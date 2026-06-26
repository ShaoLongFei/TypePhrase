import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import CoursePackIndex from "./index.vue";

const gotoCourseList = vi.fn();
const setupCoursePacks = vi.fn();
const coursePacks = [
  {
    id: "paid-pack",
    title: "付费包",
    description: "也应该可以直接学习",
    cover: "",
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

const AuthGateStub = defineComponent({
  emits: ["authenticated"],
  template: "<div><slot /></div>",
  mounted() {
    this.$emit("authenticated");
  },
});

describe("course pack page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens a course pack after auth gate allows access", async () => {
    const wrapper = mount(CoursePackIndex, {
      global: {
        stubs: {
          AuthGate: AuthGateStub,
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
