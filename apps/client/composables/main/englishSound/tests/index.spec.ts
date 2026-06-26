import { createTestingPinia } from "@pinia/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCourseStore } from "~/store/course";
import { play, updateSource } from "../audio";
import { useCurrentPracticeItemEnglishSound } from "../index";

vi.mock("../audio.ts", () => {
  return {
    updateSource: vi.fn(),
    play: vi.fn(),
  };
});

describe("useCurrentPracticeItemEnglishSound", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createTestingPinia({
      createSpy: vi.fn,
    });

    const courseStore = useCourseStore();
    courseStore.currentPracticeItem = {
      id: "1",
      sourceType: "statement",
      order: 1,
      english: "I",
      soundmark: "/I/",
      chinese: "我",
      itemType: "word",
      isMastered: false,
    };

    vi.clearAllMocks();
  });

  it("plays sound", async () => {
    const { playSound } = useCurrentPracticeItemEnglishSound();

    playSound();

    expect(play).toHaveBeenCalled();
  });

  it("should updates audio source", async () => {
    useCurrentPracticeItemEnglishSound();

    // update english value
    const courseStore = useCourseStore();
    courseStore.currentPracticeItem = {
      id: "2",
      sourceType: "statement",
      order: 2,
      english: "like",
      soundmark: "/like/",
      chinese: "喜欢",
      itemType: "word",
      isMastered: false,
    };
    await vi.advanceTimersToNextTimerAsync();

    expect(updateSource).toBeCalledTimes(1);
  });

  it("does not update audio source if the word is the same", async () => {
    useCurrentPracticeItemEnglishSound();

    const courseStore = useCourseStore();
    courseStore.currentPracticeItem = {
      id: "1",
      sourceType: "statement",
      order: 1,
      english: "I",
      soundmark: "/I/",
      chinese: "我",
      itemType: "word",
      isMastered: false,
    };

    expect(updateSource).toHaveBeenCalledTimes(1);
  });
});
