# Julebu 四表结构迁移 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 TypePhrase 从旧 Earthworm 课程模型整体切换到 `julebu.sqlite` 的四表结构，并支持普通/困难两种练习来源。

**Architecture:** PostgreSQL 复刻 `course_packs`、`courses`、`statements`、`sentences` 四张内容表，保留 `raw_json` 为 `jsonb`。后端按 `difficulty` 查询 `statements` 或 `sentences` 并返回统一 `practiceItems`；前端围绕 `practiceItems/practiceIndex` 重命名状态并在课程入口选择难度。

**Tech Stack:** NestJS、Drizzle ORM、PostgreSQL、Nuxt 3、Pinia、Vitest/Jest、Node import script。

---

### Task 1: 更新 schema 到 Julebu 四表模型

**Files:**

- Modify: `packages/schema/src/schema/coursePack.ts`
- Modify: `packages/schema/src/schema/course.ts`
- Modify: `packages/schema/src/schema/statement.ts`
- Create: `packages/schema/src/schema/sentence.ts`
- Modify: `packages/schema/src/schema/index.ts`
- Modify: `packages/schema/src/schema/userCourseProgress.ts`
- Modify: `packages/schema/src/schema/courseHistory.ts`
- Modify: `packages/schema/src/schema/masteredElements.ts`
- Modify: `apps/api/test/helper/utils.ts`
- Modify: `apps/api/test/fixture/db.ts`

**Step 1: Update schema files**

Implement:

- `coursePack`: remove old `order/isFree/creatorId/shareLevel`; add `rawJson`.
- `course`: replace `order/video` with `displayOrder/courseType/rawJson`.
- `statement`: replace `order` with `displayOrder`; add `sentenceId/statementType/rawJson`; allow empty `soundmark`.
- `sentence`: add new table and relations.
- `userCourseProgress`: add `difficulty`, rename DB column to `practice_index`, unique on `userId/coursePackId/difficulty`.
- `courseHistory`: add `difficulty`, unique includes `difficulty`.
- `masteredElements`: replace `content jsonb` with `sourceType/sourceId/english/chinese`.

**Step 2: Update fixtures and cleanup**

Update test inserts to use the new field names and include `rawJson: {}`.

Update truncate list:

```sql
TRUNCATE TABLE courses, statements, sentences, course_packs, user_course_progress, course_history, user_learning_activities, user_learn_record, mastered_elements, sessions, users RESTART IDENTITY CASCADE;
```

**Step 3: Verify schema package**

Run:

```bash
pnpm -F @earthworm/schema build
```

Expected: TypeScript build succeeds.

**Step 4: Commit**

```bash
git add packages/schema apps/api/test/helper/utils.ts apps/api/test/fixture/db.ts
git commit -m "feat: 切换课程数据结构"
git push origin main
```

### Task 2: 后端增加难度查询和统一练习项

**Files:**

- Modify: `apps/api/src/course/course.service.ts`
- Modify: `apps/api/src/course-pack/course-pack.controller.ts`
- Modify: `apps/api/src/course-pack/course-pack.service.ts`
- Modify: `apps/api/src/course-pack/dto/complete-course.dto.ts`
- Modify: `apps/api/src/user-course-progress/model/user-progress.dto.ts`
- Modify: `apps/api/src/user-course-progress/user-course-progress.controller.ts`
- Modify: `apps/api/src/user-course-progress/user-course-progress.service.ts`
- Modify: `apps/api/src/course-history/course-history.service.ts`
- Modify: `apps/api/src/mastered-element/model/add-mastered-element.dto.ts`
- Modify: `apps/api/src/mastered-element/model/remove-mastered-element.dto.ts`
- Modify: `apps/api/src/mastered-element/mastered-element.service.ts`
- Test: `apps/api/src/course/tests/course.service.unit.spec.ts`
- Test: `apps/api/src/course-pack/tests/course-pack.service.spec.ts`
- Test: `apps/api/src/user-course-progress/tests/user-course-progress.service.spec.ts`
- Test: `apps/api/src/mastered-element/tests/mastered-element.service.spec.ts`

**Step 1: Write failing backend tests**

Cover:

- `CourseService.find(..., "normal")` reads `statements`.
- `CourseService.find(..., "hard")` reads `sentences`.
- hard mode uses `content` when `english` is empty.
- progress lookup and upsert include `difficulty`.
- course completion history includes `difficulty`.
- mastered elements match by `sourceType + sourceId`.

Run:

```bash
pnpm -F api test -- course.service.unit.spec.ts user-course-progress.service.spec.ts mastered-element.service.spec.ts
```

Expected: tests fail because implementation has not changed yet.

**Step 2: Implement backend types**

Add local shared type:

```ts
export type PracticeDifficulty = "normal" | "hard";
export type PracticeSourceType = "statement" | "sentence";
```

Controller defaults:

- missing `difficulty` => `normal`
- invalid `difficulty` => validation error

**Step 3: Implement CourseService**

Return:

```ts
{
  ...courseEntity,
  difficulty,
  practiceIndex,
  practiceItems: PracticeItem[],
}
```

No `statements` response field.

**Step 4: Implement progress/history/mastered updates**

Every write path accepts and stores `difficulty`:

- save progress
- complete course
- learning activity metadata
- mastered element add/remove

**Step 5: Run backend tests**

```bash
pnpm -F api test
```

Expected: pass.

**Step 6: Commit**

```bash
git add apps/api
git commit -m "feat: 支持课程难度练习"
git push origin main
```

### Task 3: 前端切换到 practiceItems 并加入难度入口

**Files:**

- Modify: `apps/client/api/course.ts`
- Modify: `apps/client/api/course-pack.ts`
- Modify: `apps/client/api/mastered-elements.ts`
- Modify: `apps/client/api/user-course-progress.ts`
- Modify: `apps/client/types/models/course.ts`
- Modify: `apps/client/types/models/course-pack.ts`
- Modify: `apps/client/store/course.ts`
- Modify: `apps/client/store/statement.ts`
- Modify: `apps/client/store/tests/course.spec.ts`
- Modify: `apps/client/pages/course-pack/[id].vue`
- Modify: `apps/client/pages/game/[coursePackId]/[id].vue`
- Modify: `apps/client/components/main/CourseContents.vue`
- Modify: `apps/client/components/main/Answer.vue`
- Modify: `apps/client/components/main/Summary.vue`
- Modify: `apps/client/components/main/PrevAndNextBtn.vue`
- Modify: `apps/client/components/mode/chineseToEnglish/Question.vue`
- Modify: `apps/client/components/mode/dictation/Question.vue`

**Step 1: Write failing store tests**

Update `apps/client/store/tests/course.spec.ts` so mock course uses:

```ts
practiceItems: [
  { id: "1", sourceType: "statement", order: 1, english: "Hello", chinese: "你好", soundmark: "/heləʊ/", itemType: "word", isMastered: false },
],
practiceIndex: 0,
difficulty: "normal",
```

Add assertions:

- `fetchCourse` is called with difficulty.
- progress save includes difficulty.
- mastered payload includes source type and source id.

Run:

```bash
pnpm -F client test -- store/tests/course.spec.ts
```

Expected: fail.

**Step 2: Update API and types**

Replace `StatementApiResponse` with `PracticeItemApiResponse`.

Update `fetchCourse(coursePackId, courseId, difficulty)` to append query params.

Update `fetchCompleteCourse` and `fetchUpsertUserCourseProgress` payloads to include `difficulty`.

**Step 3: Update store names**

Rename runtime state:

- `currentStatement` => `currentPracticeItem`
- `statementIndex` => `practiceIndex`
- `visibleStatementsCount` => `visiblePracticeItemsCount`
- `visibleStatementIndex` => `visiblePracticeItemIndex`

Keep no old aliases.

**Step 4: Add difficulty UI**

On `apps/client/pages/course-pack/[id].vue`, add a compact segmented control:

- `普通`
- `困难`

Default `普通`. Course click navigates with `?difficulty=normal|hard`.

On game page, read query difficulty and pass it into store setup.

**Step 5: Update components**

Replace all `statements` reads with `practiceItems`.

Hide soundmark text when empty.

**Step 6: Run frontend tests**

```bash
pnpm -F client test
```

Expected: pass.

**Step 7: Commit**

```bash
git add apps/client
git commit -m "feat: 前端支持普通困难模式"
git push origin main
```

### Task 4: 添加 Julebu 导入脚本

**Files:**

- Modify: `packages/db/package.json`
- Modify: `packages/db/src/index.ts`
- Create: `packages/db/src/importJulebu.ts`
- Modify: `pnpm-lock.yaml`
- Create: `packages/db/src/importJulebu.test.ts` if a lightweight parser test is practical

**Step 1: Choose SQLite reader**

Add `better-sqlite3` to `packages/db` dependencies or devDependencies so the server does not depend on system `sqlite3` CLI.

Run:

```bash
pnpm -F @earthworm/db add better-sqlite3
pnpm -F @earthworm/db add -D @types/better-sqlite3
```

**Step 2: Implement import script**

Script behavior:

```bash
pnpm -F @earthworm/db import:julebu -- --sqlite ./julebu.sqlite
```

The script should:

- require `DATABASE_URL`
- require `--sqlite`
- read four SQLite tables in batches
- parse `raw_json` to objects
- truncate old content and learning state inside one transaction
- preserve `users` and `sessions`
- insert in order: course packs, courses, sentences, statements
- print exact imported counts

**Step 3: Add dry validation mode**

Support:

```bash
pnpm -F @earthworm/db import:julebu -- --sqlite ./julebu.sqlite --dry-run
```

Dry run validates tables and counts without writing PostgreSQL.

**Step 4: Verify locally**

Run:

```bash
pnpm -F @earthworm/db import:julebu -- --sqlite ./julebu.sqlite --dry-run
```

Expected: prints 37, 2971, 107096, 297057.

**Step 5: Commit**

```bash
git add packages/db pnpm-lock.yaml
git commit -m "feat: 添加 Julebu 数据导入"
git push origin main
```

### Task 5: 生产库切换和数据导入

**Files:**

- No source files expected unless deployment docs are updated.

**Step 1: Sync code**

Run:

```bash
rsync -az --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='apps/api/.env.prod' \
  --exclude='apps/client/.env.prod' \
  --exclude='data/' \
  --exclude='spa-server.mjs' \
  --exclude='apps/client/.output/' \
  --exclude='apps/api/dist/' \
  ./ lxc-dev:/opt/typephrase/
```

**Step 2: Upload SQLite snapshot**

Run:

```bash
ssh lxc-dev 'mkdir -p /opt/typephrase/data/import'
rsync -az ./julebu.sqlite lxc-dev:/opt/typephrase/data/import/julebu.sqlite
```

**Step 3: Build schema and apply target schema**

Run on server:

```bash
cd /opt/typephrase
pnpm install --frozen-lockfile
pnpm schema:build
pnpm -F @earthworm/db init
```

Expected: PostgreSQL schema matches the new Drizzle definitions.

**Step 4: Import data**

Run on server:

```bash
cd /opt/typephrase
systemctl stop typephrase-api.service
pnpm -F @earthworm/db import:julebu -- --sqlite /opt/typephrase/data/import/julebu.sqlite
```

Expected counts:

- `course_packs`: 37
- `courses`: 2971
- `sentences`: 107096
- `statements`: 297057

**Step 5: Build and restart services**

Run:

```bash
cd /opt/typephrase
pnpm -F api build
pnpm -F client generate
systemctl restart typephrase-api.service
systemctl restart typephrase-web.service
systemctl is-active typephrase-api.service
systemctl is-active typephrase-web.service
```

Expected: both services active.

**Step 6: Verify production behavior**

Run:

```bash
curl -I https://typephrase-api.shaolongfei.com/swagger
```

Manual checks:

- 登录后能看到 37 个课程包。
- 课程包详情页默认 `普通`。
- 切到 `困难` 后进入课程，题目来自 `sentences`。
- 普通和困难分别学习几题，刷新后进度互不覆盖。
- 标记已掌握后，只有对应来源的练习项消失或变更状态。

**Step 7: Commit deployment docs if changed**

If any deployment docs are modified:

```bash
git add docs
git commit -m "docs: 更新 Julebu 部署步骤"
git push origin main
```

### Task 6: 收尾检查

**Files:**

- No source files expected.

**Step 1: Check git status**

Run:

```bash
git status --short --ignored
```

Expected:

- no tracked changes
- `julebu.sqlite` remains ignored

**Step 2: Check server table counts**

Run:

```bash
ssh lxc-dev "sudo -u postgres psql -d typephrase -Atc \"select 'course_packs', count(*) from course_packs union all select 'courses', count(*) from courses union all select 'sentences', count(*) from sentences union all select 'statements', count(*) from statements;\""
```

Expected:

```text
course_packs|37
courses|2971
sentences|107096
statements|297057
```

**Step 3: Final response**

Report:

- schema switch completed
- import counts
- production URLs checked
- any remaining risks
