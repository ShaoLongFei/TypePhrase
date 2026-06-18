import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { fetchCompleteCourse, fetchCourse } from "~/api/course";
import { fetchAddMasteredElement } from "~/api/mastered-elements";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { useCourseStore } from "../course";

vi.mock("~/api/course");
vi.mock("~/api/mastered-elements");
vi.mock("~/composables/courses/activeCourse");

vi.mock("../statement.ts", () => {
  return {
    useStatement: () => {
      const returnObj = {
        statementIndex: ref(0),
      };

      return returnObj;
    },
  };
});

const mockCourse = {
  id: "1",
  title: "Test Course",
  description: "A test course",
  order: 1,
  statements: [
    {
      id: "1",
      order: 1,
      english: "Hello",
      chinese: "你好",
      soundmark: "/heləʊ/",
      isMastered: false,
    },
    {
      id: "2",
      order: 2,
      english: "World",
      chinese: "世界",
      soundmark: "/wɜːld/",
      isMastered: false,
    },
    { id: "3", order: 3, english: "Test", chinese: "测试", soundmark: "/test/", isMastered: false },
    {
      id: "4",
      order: 4,
      english: "Unit",
      chinese: "单元",
      soundmark: "/ˈjuːnɪt/",
      isMastered: false,
    },
    { id: "5", order: 5, english: "Case", chinese: "案例", soundmark: "/keɪs/", isMastered: false },
  ],
  coursePackId: "pack1",
  completionCount: 0,
  statementIndex: 0,
  video: "https://example.com/test-video.mp4",
};

function cloneCourse(course = mockCourse) {
  return {
    ...course,
    statements: course.statements.map((statement) => ({ ...statement })),
  };
}

describe("CourseStore", () => {
  let courseStore: ReturnType<typeof useCourseStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.mocked(fetchCourse).mockResolvedValue(cloneCourse());
    vi.mocked(useActiveCourseMap).mockReturnValue({
      updateActiveCourseMap: vi.fn(),
    } as any);

    courseStore = useCourseStore();
    await courseStore.setup("pack1", "1");

    vi.clearAllMocks();
  });

  describe("Course initialization", () => {
    it("should correctly load the course", () => {
      expect(courseStore.currentCourse).toEqual(mockCourse);
      expect(courseStore.currentCourse?.statements[1].isMastered).toBe(false); // World
      expect(courseStore.currentCourse?.statements[0].isMastered).toBe(false); // Hello
    });

    it("should initialize at the first unmastered statement", async () => {
      await courseStore.setup("pack1", "1");
      expect(courseStore.statementIndex).toBe(0);
    });
  });

  describe("Statement navigation", () => {
    it("should navigate to the next unmastered statement", () => {
      courseStore.toNextStatement();
      expect(courseStore.statementIndex).toBe(1);
    });

    it("should navigate to the previous unmastered statement", () => {
      courseStore.toSpecificStatement(2);
      courseStore.toPreviousStatement();
      expect(courseStore.statementIndex).toBe(1);
    });

    it("should handle navigation boundaries", () => {
      courseStore.toPreviousStatement();
      expect(courseStore.statementIndex).toBe(0);
      for (let i = 0; i < 10; i++) courseStore.toNextStatement();
      expect(courseStore.statementIndex).toBe(4);
    });
  });

  describe("Progress tracking", () => {
    it("should correctly identify when all statements are done", () => {
      expect(courseStore.isAllDone()).toBe(false);
      courseStore.toSpecificStatement(4);
      expect(courseStore.isAllDone()).toBe(true);
    });

    it("should correctly identify the last statement", () => {
      expect(courseStore.isLastStatement()).toBe(false);
      courseStore.toSpecificStatement(4);
      expect(courseStore.isLastStatement()).toBe(true);
    });

    it("should correctly identify when all statements are mastered", async () => {
      expect(courseStore.isAllMastered()).toBe(false);
      vi.mocked(fetchCourse).mockResolvedValue({
        ...cloneCourse(),
        statements: mockCourse.statements.map((statement) => ({ ...statement, isMastered: true })),
      });
      await courseStore.setup("pack1", "2");
      expect(courseStore.isAllMastered()).toBe(true);
    });

    it("should mark the current statement as mastered and move to the next unmastered statement", async () => {
      vi.mocked(fetchAddMasteredElement).mockResolvedValue({
        id: "mastered-1",
        userId: "user-1",
        content: { english: "Hello" },
        masteredAt: new Date(),
      } as any);

      await courseStore.markCurrentStatementMastered();

      expect(fetchAddMasteredElement).toHaveBeenCalledWith({ english: "Hello" });
      expect(courseStore.currentCourse?.statements[0].isMastered).toBe(true);
      expect(courseStore.statementIndex).toBe(1);
    });
  });

  describe("Visible statements and index relationship", () => {
    it("should correctly calculate the number of visible statements", () => {
      expect(courseStore.visibleStatementsCount).toBe(5);
    });

    it("should have correct initial visibleStatementIndex", () => {
      expect(courseStore.visibleStatementIndex).toBe(0);
    });

    it("should update visibleStatementIndex when navigating to next statement", () => {
      courseStore.toNextStatement();
      expect(courseStore.visibleStatementIndex).toBe(1);
    });

    it("should update visibleStatementIndex when navigating to previous statement", () => {
      courseStore.toSpecificStatement(3);
      courseStore.toPreviousStatement();
      expect(courseStore.visibleStatementIndex).toBe(2);
    });

    it("should update visibleStatementIndex when jumping to a specific index", () => {
      courseStore.toSpecificStatement(3);
      expect(courseStore.visibleStatementIndex).toBe(3);
    });

    it("should reset visibleStatementIndex on doAgain", () => {
      courseStore.toSpecificStatement(3);
      courseStore.doAgain();
      expect(courseStore.visibleStatementIndex).toBe(0);
    });

    it("should handle visibleStatementIndex when all statements are mastered", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({
        ...cloneCourse(),
        statements: mockCourse.statements.map((statement) => ({ ...statement, isMastered: true })),
      });
      await courseStore.setup("pack1", "2");
      expect(courseStore.visibleStatementIndex).toBe(-1);
      expect(courseStore.visibleStatementsCount).toBe(0);
    });
  });

  describe("Course reset and completion", () => {
    it("should reset course state on doAgain", () => {
      courseStore.toSpecificStatement(3);
      courseStore.doAgain();
      expect(courseStore.statementIndex).toBe(0);
      expect(courseStore.visibleStatementIndex).toBe(0);
    });

    it("should complete the course and fetch the next course", async () => {
      vi.mocked(fetchCompleteCourse).mockResolvedValue({
        nextCourse: { ...cloneCourse(), id: "2" },
      });
      const result = await courseStore.completeCourse();
      expect(result).toEqual({ nextCourse: { ...cloneCourse(), id: "2" } });
    });
  });

  describe("Computed properties", () => {
    it("should return the correct current statement", () => {
      expect(courseStore.currentStatement).toEqual(mockCourse.statements[0]);
    });

    it("should correctly split the current statement's English words", () => {
      expect(courseStore.words).toEqual(["Hello"]);
    });

    it("should return the correct total number of questions", () => {
      expect(courseStore.totalQuestionsCount).toBe(5);
    });
  });

  describe("Edge cases", () => {
    it("should handle an empty course", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({ ...cloneCourse(), statements: [] });
      await courseStore.setup("pack1", "1");
      expect(courseStore.visibleStatementsCount).toBe(0);
      expect(courseStore.isAllDone()).toBe(true);
      expect(courseStore.isAllMastered()).toBe(true);
    });

    it("should handle a course with only one statement", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({
        ...cloneCourse(),
        statements: [{ ...mockCourse.statements[0] }],
      });
      await courseStore.setup("pack1", "1");
      expect(courseStore.totalQuestionsCount).toBe(1);
      expect(courseStore.isLastStatement()).toBe(true);
    });
  });
});
