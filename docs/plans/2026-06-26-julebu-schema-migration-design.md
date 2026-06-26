# Julebu 四表结构迁移设计

## 背景

TypePhrase 当前的数据模型来自旧 Earthworm：`course_packs -> courses -> statements` 是唯一练习来源，学习进度用 `statement_index` 记录。现在决定整体切换到 `julebu.sqlite` 里更完整的四表结构：

- `course_packs`
- `courses`
- `statements`
- `sentences`

新系统不保留旧课程数据的兼容逻辑。课程选择时提供难度选项：`普通` 使用 `statements`，`困难` 使用 `sentences`。`statements` 和 `sentences` 在练习选择上是平级来源，不再把 `sentences` 当作 `statements` 的附属数据。

## 当前状态

本地 `julebu.sqlite` 已加入 `.gitignore`，不会提交到 GitHub。SQLite 文件当前统计：

| 表             |   数量 | 说明                                                      |
| -------------- | -----: | --------------------------------------------------------- |
| `course_packs` |     37 | 课程包                                                    |
| `courses`      |   2971 | 课程                                                      |
| `statements`   | 297057 | 普通难度练习项，包含 word、phrase、chunk、sentence 等类型 |
| `sentences`    | 107096 | 困难难度练习项，完整句子为主                              |

生产库当前仍是旧结构，主要数据量：

| 表                  |  数量 |
| ------------------- | ----: |
| `course_packs`      |     4 |
| `courses`           |   358 |
| `statements`        | 38989 |
| `mastered_elements` |     2 |
| `users`             |     3 |
| `sessions`          |     1 |

学习统计相关表当前为空。迁移时建议保留 `users` 和 `sessions`，清空旧内容、旧学习进度和旧掌握状态。

## 目标数据模型

PostgreSQL 侧复刻 SQLite 四张内容表，并把 `raw_json` 保存为 `jsonb`，这样既能保留原始数据，又能让运行时查询用结构化列。

### `course_packs`

| 字段          | 类型                      | 说明              |
| ------------- | ------------------------- | ----------------- |
| `id`          | `text primary key`        | 沿用 SQLite 原 ID |
| `title`       | `text not null`           | 标题              |
| `description` | `text default ''`         | 描述              |
| `cover`       | `text`                    | 封面              |
| `raw_json`    | `jsonb not null`          | 原始课程包数据    |
| `created_at`  | `timestamp default now()` | 创建时间          |
| `updated_at`  | `timestamp`               | 更新时间          |

### `courses`

| 字段             | 类型                      | 说明                       |
| ---------------- | ------------------------- | -------------------------- |
| `id`             | `text primary key`        | 沿用 SQLite 原 ID          |
| `course_pack_id` | `text not null`           | 课程包 ID                  |
| `title`          | `text not null`           | 标题                       |
| `description`    | `text default ''`         | 描述                       |
| `display_order`  | `integer not null`        | 排序                       |
| `course_type`    | `text default 'normal'`   | `normal`、`audio`、`video` |
| `raw_json`       | `jsonb not null`          | 原始课程数据               |
| `created_at`     | `timestamp default now()` | 创建时间                   |
| `updated_at`     | `timestamp`               | 更新时间                   |

从旧模型删除或停止使用 `video`、`order` 这类旧字段名。媒体地址如需展示，优先从 `raw_json.mediaUrl` 解析为 API 字段，不额外设计兼容字段。

### `statements`

| 字段             | 类型                      | 说明                             |
| ---------------- | ------------------------- | -------------------------------- |
| `id`             | `text primary key`        | 沿用 SQLite 原 ID                |
| `course_id`      | `text not null`           | 课程 ID                          |
| `sentence_id`    | `text`                    | 可选引用，不作为运行时选择关系   |
| `chinese`        | `text default ''`         | 中文                             |
| `english`        | `text not null`           | 英文练习内容                     |
| `soundmark`      | `text default ''`         | 音标                             |
| `statement_type` | `text default ''`         | word、phrase、chunk、sentence 等 |
| `display_order`  | `integer not null`        | 排序                             |
| `raw_json`       | `jsonb not null`          | 原始 statement 数据              |
| `created_at`     | `timestamp default now()` | 创建时间                         |
| `updated_at`     | `timestamp`               | 更新时间                         |

### `sentences`

| 字段         | 类型                      | 说明               |
| ------------ | ------------------------- | ------------------ |
| `id`         | `text primary key`        | 沿用 SQLite 原 ID  |
| `course_id`  | `text not null`           | 课程 ID            |
| `content`    | `text default ''`         | 原句内容           |
| `english`    | `text default ''`         | 英文句子           |
| `chinese`    | `text default ''`         | 中文               |
| `sort_order` | `integer not null`        | 排序               |
| `raw_json`   | `jsonb not null`          | 原始 sentence 数据 |
| `created_at` | `timestamp default now()` | 创建时间           |
| `updated_at` | `timestamp`               | 更新时间           |

困难模式下，如果 `english` 为空，用 `content` 作为英文展示和练习文本。目前有 153 条数据需要这个回退。

## 难度与 API 设计

内部使用稳定英文枚举，界面展示中文：

| UI   | API/DB   |
| ---- | -------- |
| 普通 | `normal` |
| 困难 | `hard`   |

课程详情接口保留现有路径，增加 query：

```text
GET /course-pack/:coursePackId/courses/:courseId?difficulty=normal
GET /course-pack/:coursePackId/courses/:courseId?difficulty=hard
```

后端返回统一练习项结构：

```ts
type PracticeItem = {
  id: string;
  sourceType: "statement" | "sentence";
  order: number;
  english: string;
  chinese: string;
  soundmark: string;
  itemType: string;
  isMastered: boolean;
};
```

课程返回结构从 `statements` 切换为 `practiceItems`，进度字段从 `statementIndex` 切换为 `practiceIndex`。这是一次破坏性迁移，不保留旧字段别名。

## 学习进度与掌握状态

需要把难度接入用户学习状态，避免普通模式和困难模式互相覆盖。

### `user_course_progress`

新增 `difficulty`，唯一约束改为：

```text
user_id + course_pack_id + difficulty
```

含义：一个用户在一个课程包里，普通和困难各保留一条最近进度。字段 `statement_index` 重命名为 `practice_index`。

### `course_history`

新增 `difficulty`，唯一约束改为：

```text
user_id + course_id + course_pack_id + difficulty
```

含义：同一课程普通和困难完成次数分开统计。

### `mastered_elements`

从 JSON 内容匹配改成来源感知字段：

| 字段          | 说明                      |
| ------------- | ------------------------- |
| `user_id`     | 用户                      |
| `source_type` | `statement` 或 `sentence` |
| `source_id`   | 练习项 ID                 |
| `english`     | 展示和搜索用              |
| `chinese`     | 展示和搜索用              |
| `mastered_at` | 掌握时间                  |

唯一约束：

```text
user_id + source_type + source_id
```

这样普通模式的短语掌握不会把困难模式的整句误判为已掌握。

## 前端改造

课程包详情页增加难度选择，默认 `普通`。点击课程时带上难度：

```text
/game/:coursePackId/:courseId?difficulty=normal
/game/:coursePackId/:courseId?difficulty=hard
```

前端状态统一改名：

| 旧名               | 新名                  |
| ------------------ | --------------------- |
| `statements`       | `practiceItems`       |
| `statementIndex`   | `practiceIndex`       |
| `currentStatement` | `currentPracticeItem` |

课程目录、答题、已掌握、进度保存、完成课程都使用 `difficulty`。困难模式无音标时隐藏音标行，不显示空白占位。

## 导入与清空策略

迁移脚本放在 `packages/db/src/importJulebu.ts`，输入为本地或服务器上的 SQLite 文件路径：

```bash
pnpm -F @earthworm/db import:julebu -- --sqlite ./julebu.sqlite
```

脚本职责：

1. 校验 SQLite 四张表存在。
2. 校验 `raw_json` 是合法 JSON。
3. 在 PostgreSQL 事务中清空旧内容和旧学习状态：
   - `course_history`
   - `user_course_progress`
   - `user_learning_activities`
   - `user_learn_record`
   - `mastered_elements`
   - `statements`
   - `sentences`
   - `courses`
   - `course_packs`
4. 保留：
   - `users`
   - `sessions`
5. 按外键顺序导入：
   - `course_packs`
   - `courses`
   - `sentences`
   - `statements`
6. 输出导入计数和异常样本。

服务器当前没有 `sqlite3` CLI，所以导入脚本优先使用 Node 依赖读取 SQLite，例如 `better-sqlite3`。SQLite 文件继续不提交，只通过 `rsync` 或 `scp` 放到服务器临时目录。

## 部署切换

建议按以下顺序切换：

1. 本地完成代码和导入脚本。
2. 本地运行单元测试、类型检查和构建。
3. 推送代码。
4. 同步代码到 `/opt/typephrase`。
5. 上传 `julebu.sqlite` 到服务器临时目录。
6. 停止 `typephrase-api.service`，避免迁移中写入进度。
7. 对生产库执行 schema push 或迁移 SQL。
8. 执行 `import:julebu`，清空旧内容并导入四表。
9. 构建 API 和前端。
10. 重启 `typephrase-api.service` 和 `typephrase-web.service`。
11. 验证：
    - `/swagger` 正常
    - 课程包列表显示 37 个课程包
    - 普通模式加载 statements
    - 困难模式加载 sentences
    - 普通/困难进度互不覆盖
    - 掌握状态按来源 ID 区分

## 风险与处理

- `sentences.english` 有空值：困难模式使用 `content` 回退；仍为空则导入但 API 过滤掉不可练习项。
- `raw_json` 最大约 50KB：使用 `jsonb` 可接受。
- 旧前端字段名较多：直接重命名为 `practiceItems`，避免留下旧语义。
- 旧 Drizzle 迁移历史已经不重要：本次以目标 schema 为准，生产库可通过 schema push 或一次性 SQL 切换。
- 账号是否清空：本设计默认保留账号和会话，因为当前系统仍需要登录学习。
