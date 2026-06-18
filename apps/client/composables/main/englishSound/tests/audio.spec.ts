import { beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudio {
  src = "";
  currentTime = 0;
  playbackRate = 1;
  addEventListener = vi.fn();
  load = vi.fn();
  pause = vi.fn();
  play = vi.fn(() => Promise.reject(new Error("remote audio missing")));
  removeEventListener = vi.fn();
}

describe("english sound audio fallback", () => {
  const speak = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.stubGlobal(
      "Audio",
      vi.fn(() => new FakeAudio()),
    );
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn(function (this: any, text: string) {
        this.text = text;
        this.lang = "";
        this.rate = 1;
      }),
    );
    vi.stubGlobal("speechSynthesis", {
      cancel,
      speak,
    });
  });

  it("uses browser speech synthesis when remote sentence audio fails", async () => {
    const { play, updateSource } = await import("../audio");

    updateSource("https://example.com/missing.mp3", "I think you should know");
    play();

    await vi.waitFor(() => {
      expect(speak).toHaveBeenCalledTimes(1);
    });
    expect(speak.mock.calls[0][0]).toMatchObject({
      text: "I think you should know",
      lang: "en-US",
      rate: 1,
    });
  });
});
