import { CourseService } from "../course.service";

describe("CourseService practice items", () => {
  it("loads statements as normal difficulty practice items", async () => {
    const db = createDbMock({
      masteredElements: [
        {
          userId: "user-1",
          sourceType: "statement",
          sourceId: "statement-1",
        },
      ],
    });
    const courseService = new CourseService(db as any);

    const course = await courseService.find("pack-1", "course-1", "user-1", "normal");

    expect(course.practiceItems).toEqual([
      {
        id: "statement-1",
        sourceType: "statement",
        order: 1,
        english: "I",
        chinese: "我",
        soundmark: "/aɪ/",
        itemType: "word",
        isMastered: true,
      },
      {
        id: "statement-2",
        sourceType: "statement",
        order: 2,
        english: "like",
        chinese: "喜欢",
        soundmark: "/laɪk/",
        itemType: "phrase",
        isMastered: false,
      },
    ]);
  });

  it("loads sentences as hard difficulty practice items and falls back to content", async () => {
    const db = createDbMock({
      masteredElements: [
        {
          userId: "user-1",
          sourceType: "sentence",
          sourceId: "sentence-2",
        },
      ],
    });
    const courseService = new CourseService(db as any);

    const course = await courseService.find("pack-1", "course-1", "user-1", "hard");

    expect(course.practiceItems).toEqual([
      {
        id: "sentence-1",
        sourceType: "sentence",
        order: 1,
        english: "I like TypePhrase.",
        chinese: "我喜欢 TypePhrase。",
        soundmark: "",
        itemType: "sentence",
        isMastered: false,
      },
      {
        id: "sentence-2",
        sourceType: "sentence",
        order: 2,
        english: "Fallback content.",
        chinese: "回退内容。",
        soundmark: "",
        itemType: "sentence",
        isMastered: true,
      },
    ]);
  });
});

function createDbMock(options: {
  masteredElements: Array<{ userId: string; sourceType: string; sourceId: string }>;
}) {
  const db: any = {
    query: {
      course: {
        findFirst: jest.fn().mockResolvedValue({
          id: "course-1",
          coursePackId: "pack-1",
          title: "course",
          displayOrder: 1,
        }),
      },
      statement: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "statement-1",
            displayOrder: 1,
            english: "I",
            chinese: "我",
            soundmark: "/aɪ/",
            statementType: "word",
          },
          {
            id: "statement-2",
            displayOrder: 2,
            english: "like",
            chinese: "喜欢",
            soundmark: "/laɪk/",
            statementType: "phrase",
          },
        ]),
      },
      sentence: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "sentence-1",
            sortOrder: 1,
            content: "I like TypePhrase.",
            english: "I like TypePhrase.",
            chinese: "我喜欢 TypePhrase。",
          },
          {
            id: "sentence-2",
            sortOrder: 2,
            content: "Fallback content.",
            english: "",
            chinese: "回退内容。",
          },
        ]),
      },
    },
  };

  db.select = jest.fn(() => ({
    from: () => ({
      where: () => Promise.resolve(options.masteredElements),
    }),
  }));

  return db;
}
