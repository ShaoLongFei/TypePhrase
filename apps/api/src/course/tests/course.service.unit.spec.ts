import { CourseService } from "../course.service";

describe("CourseService mastered state", () => {
  it("marks statements mastered when mastered content was stored as a JSON string", async () => {
    const db = createDbMock([
      {
        userId: "user-1",
        content: JSON.stringify(JSON.stringify({ english: "I" })),
      },
    ]);
    const courseService = new CourseService(db as any);

    const course = await courseService.find("pack-1", "course-1", "user-1");

    expect(course.statements[0].isMastered).toBe(true);
  });
});

function createDbMock(masteredElements: Array<{ userId: string; content: unknown }>) {
  const db: any = {
    query: {
      course: {
        findFirst: jest.fn().mockResolvedValue({
          id: "course-1",
          coursePackId: "pack-1",
          title: "course",
          order: 1,
          statements: [
            {
              order: 1,
              english: "I",
              chinese: "我",
              soundmark: "/aɪ/",
            },
          ],
        }),
      },
    },
  };

  db.select = jest.fn(() => ({
    from: () => ({
      where: () => Promise.resolve(masteredElements),
    }),
  }));

  return db;
}
