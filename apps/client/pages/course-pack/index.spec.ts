import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CoursePackIndex from "./index.vue";

const gotoCourseList = vi.fn();
const setupCoursePacks = vi.fn();
const coursePacks = [
  {
    id: "paid-pack",
    title: "付费包",
    description: "也应该可以直接学习",
    cover: "",
    isFree: false,
  },
];

vi.mock("~/composables/useNavigation", () => ({
  useNavigation: () => ({
    gotoCourseList,
  }),
}));

vi.mock("~/store/coursePack", () => ({
  useCoursePackStore: () => ({
    coursePacks,
    setupCoursePacks,
  }),
}));

describe("course pack page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens any course pack directly", async () => {
    const wrapper = mount(CoursePackIndex, {
      global: {
        stubs: {
          Loading: true,
          NuxtImg: true,
        },
      },
    });

    await flushPromises();
    await wrapper.find(".course-pack-card").trigger("click");

    expect(gotoCourseList).toHaveBeenCalledWith("paid-pack");
  });
});
