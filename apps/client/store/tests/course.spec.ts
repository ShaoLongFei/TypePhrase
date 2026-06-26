import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { fetchCompleteCourse, fetchCourse } from "~/api/course";
import { fetchAddMasteredElement } from "~/api/mastered-elements";
import { fetchUpsertUserCourseProgress } from "~/api/user-course-progress";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { useCourseStore } from "../course";

vi.mock("~/api/course");
vi.mock("~/api/mastered-elements");
vi.mock("~/api/user-course-progress");
vi.mock("~/composables/courses/activeCourse");

vi.mock("../practice.ts", () => {
  return {
    usePractice: () => {
      return {
        practiceIndex: ref(0),
      };
    },
  };
});

const mockCourse = {
  id: "1",
  title: "Test Course",
  description: "A test course",
  displayOrder: 1,
  difficulty: "hard" as const,
  practiceItems: [
    {
      id: "1",
      sourceType: "statement" as const,
      order: 1,
      english: "Hello",
      chinese: "你好",
      soundmark: "/heləʊ/",
      itemType: "word",
      isMastered: false,
    },
    {
      id: "2",
      sourceType: "statement" as const,
      order: 2,
      english: "World",
      chinese: "世界",
      soundmark: "/wɜːld/",
      itemType: "word",
      isMastered: false,
    },
    {
      id: "3",
      sourceType: "sentence" as const,
      order: 3,
      english: "Test",
      chinese: "测试",
      soundmark: "",
      itemType: "sentence",
      isMastered: false,
    },
    {
      id: "4",
      sourceType: "statement" as const,
      order: 4,
      english: "Unit",
      chinese: "单元",
      soundmark: "/ˈjuːnɪt/",
      itemType: "word",
      isMastered: false,
    },
    {
      id: "5",
      sourceType: "statement" as const,
      order: 5,
      english: "Case",
      chinese: "案例",
      soundmark: "/keɪs/",
      itemType: "word",
      isMastered: false,
    },
  ],
  coursePackId: "pack1",
  completionCount: 0,
  practiceIndex: 0,
  courseType: "normal",
};

function cloneCourse(course = mockCourse) {
  return {
    ...course,
    practiceItems: course.practiceItems.map((practiceItem) => ({ ...practiceItem })),
  };
}

describe("CourseStore", () => {
  let courseStore: ReturnType<typeof useCourseStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.mocked(fetchCourse).mockResolvedValue(cloneCourse());
    vi.mocked(fetchUpsertUserCourseProgress).mockResolvedValue(undefined);
    vi.mocked(useActiveCourseMap).mockReturnValue({
      updateActiveCourseMap: vi.fn(),
    } as any);

    courseStore = useCourseStore();
    await courseStore.setup("pack1", "1", "hard");

    vi.clearAllMocks();
  });

  describe("Course initialization", () => {
    it("should correctly load the course with difficulty", async () => {
      await courseStore.setup("pack1", "1", "hard");

      expect(fetchCourse).toHaveBeenCalledWith("pack1", "1", "hard");
      expect(courseStore.currentCourse).toEqual(mockCourse);
      expect(courseStore.currentCourse?.practiceItems[1].isMastered).toBe(false);
      expect(courseStore.currentCourse?.practiceItems[0].isMastered).toBe(false);
    });

    it("should initialize at the first unmastered practice item", async () => {
      await courseStore.setup("pack1", "1", "hard");
      expect(courseStore.practiceIndex).toBe(0);
    });

    it("should initialize at the saved practice index", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({ ...cloneCourse(), practiceIndex: 2 });
      await courseStore.setup("pack1", "1", "hard");

      expect(courseStore.practiceIndex).toBe(2);
    });
  });

  describe("Practice item navigation", () => {
    it("should navigate to the next unmastered practice item", () => {
      courseStore.toNextPracticeItem();
      expect(courseStore.practiceIndex).toBe(1);
    });

    it("should save user progress when navigating to the next practice item", () => {
      courseStore.toNextPracticeItem();

      expect(fetchUpsertUserCourseProgress).toHaveBeenCalledWith({
        coursePackId: "pack1",
        courseId: "1",
        difficulty: "hard",
        practiceIndex: 1,
      });
    });

    it("should navigate to the previous unmastered practice item", () => {
      courseStore.toSpecificPracticeItem(2);
      courseStore.toPreviousPracticeItem();
      expect(courseStore.practiceIndex).toBe(1);
    });

    it("should handle navigation boundaries", () => {
      courseStore.toPreviousPracticeItem();
      expect(courseStore.practiceIndex).toBe(0);
      for (let i = 0; i < 10; i++) courseStore.toNextPracticeItem();
      expect(courseStore.practiceIndex).toBe(4);
    });
  });

  describe("Progress tracking", () => {
    it("should correctly identify when all practice items are done", () => {
      expect(courseStore.isAllDone()).toBe(false);
      courseStore.toSpecificPracticeItem(4);
      expect(courseStore.isAllDone()).toBe(true);
    });

    it("should correctly identify the last practice item", () => {
      expect(courseStore.isLastPracticeItem()).toBe(false);
      courseStore.toSpecificPracticeItem(4);
      expect(courseStore.isLastPracticeItem()).toBe(true);
    });

    it("should correctly identify when all practice items are mastered", async () => {
      expect(courseStore.isAllMastered()).toBe(false);
      vi.mocked(fetchCourse).mockResolvedValue({
        ...cloneCourse(),
        practiceItems: mockCourse.practiceItems.map((practiceItem) => ({
          ...practiceItem,
          isMastered: true,
        })),
      });
      await courseStore.setup("pack1", "2", "hard");
      expect(courseStore.isAllMastered()).toBe(true);
    });

    it("should mark the current practice item as mastered and move to the next one", async () => {
      vi.mocked(fetchAddMasteredElement).mockResolvedValue({
        id: "mastered-1",
        userId: "user-1",
        sourceType: "statement",
        sourceId: "1",
        english: "Hello",
        chinese: "你好",
        masteredAt: new Date(),
      } as any);

      await courseStore.markCurrentPracticeItemMastered();

      expect(fetchAddMasteredElement).toHaveBeenCalledWith({
        sourceType: "statement",
        sourceId: "1",
        english: "Hello",
        chinese: "你好",
      });
      expect(courseStore.currentCourse?.practiceItems[0].isMastered).toBe(true);
      expect(courseStore.practiceIndex).toBe(1);
    });
  });

  describe("Visible practice items and index relationship", () => {
    it("should correctly calculate the number of visible practice items", () => {
      expect(courseStore.visiblePracticeItemsCount).toBe(5);
    });

    it("should have correct initial visiblePracticeItemIndex", () => {
      expect(courseStore.visiblePracticeItemIndex).toBe(0);
    });

    it("should update visiblePracticeItemIndex when navigating to next practice item", () => {
      courseStore.toNextPracticeItem();
      expect(courseStore.visiblePracticeItemIndex).toBe(1);
    });

    it("should update visiblePracticeItemIndex when navigating to previous practice item", () => {
      courseStore.toSpecificPracticeItem(3);
      courseStore.toPreviousPracticeItem();
      expect(courseStore.visiblePracticeItemIndex).toBe(2);
    });

    it("should update visiblePracticeItemIndex when jumping to a specific index", () => {
      courseStore.toSpecificPracticeItem(3);
      expect(courseStore.visiblePracticeItemIndex).toBe(3);
    });

    it("should reset visiblePracticeItemIndex on doAgain", () => {
      courseStore.toSpecificPracticeItem(3);
      courseStore.doAgain();
      expect(courseStore.visiblePracticeItemIndex).toBe(0);
    });

    it("should handle visiblePracticeItemIndex when all practice items are mastered", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({
        ...cloneCourse(),
        practiceItems: mockCourse.practiceItems.map((practiceItem) => ({
          ...practiceItem,
          isMastered: true,
        })),
      });
      await courseStore.setup("pack1", "2", "hard");
      expect(courseStore.visiblePracticeItemIndex).toBe(-1);
      expect(courseStore.visiblePracticeItemsCount).toBe(0);
    });
  });

  describe("Course reset and completion", () => {
    it("should reset course state on doAgain", () => {
      courseStore.toSpecificPracticeItem(3);
      courseStore.doAgain();
      expect(courseStore.practiceIndex).toBe(0);
      expect(courseStore.visiblePracticeItemIndex).toBe(0);
    });

    it("should complete the course and fetch the next course with difficulty", async () => {
      vi.mocked(fetchCompleteCourse).mockResolvedValue({
        nextCourse: { ...cloneCourse(), id: "2" },
      });

      const result = await courseStore.completeCourse();

      expect(fetchCompleteCourse).toHaveBeenCalledWith("pack1", "1", {
        completedAt: expect.any(String),
        difficulty: "hard",
      });
      expect(result).toEqual({ nextCourse: { ...cloneCourse(), id: "2" } });
    });
  });

  describe("Computed properties", () => {
    it("should return the correct current practice item", () => {
      expect(courseStore.currentPracticeItem).toEqual(mockCourse.practiceItems[0]);
    });

    it("should correctly split the current practice item's English words", () => {
      expect(courseStore.words).toEqual(["Hello"]);
    });

    it("should return the correct total number of questions", () => {
      expect(courseStore.totalQuestionsCount).toBe(5);
    });
  });

  describe("Edge cases", () => {
    it("should handle an empty course", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({ ...cloneCourse(), practiceItems: [] });
      await courseStore.setup("pack1", "1", "hard");
      expect(courseStore.visiblePracticeItemsCount).toBe(0);
      expect(courseStore.isAllDone()).toBe(true);
      expect(courseStore.isAllMastered()).toBe(true);
    });

    it("should handle a course with only one practice item", async () => {
      vi.mocked(fetchCourse).mockResolvedValue({
        ...cloneCourse(),
        practiceItems: [{ ...mockCourse.practiceItems[0] }],
      });
      await courseStore.setup("pack1", "1", "hard");
      expect(courseStore.totalQuestionsCount).toBe(1);
      expect(courseStore.isLastPracticeItem()).toBe(true);
    });
  });
});
