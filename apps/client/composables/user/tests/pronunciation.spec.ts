import { beforeEach, describe, expect, it } from "vitest";

import { PronunciationType, usePronunciation } from "../pronunciation";

const PRONUNCIATION_TYPE = "pronunciationType";

function expectPronunciation(type: PronunciationType) {
  const { pronunciation } = usePronunciation();

  expect(pronunciation.value).toBe(type);
  expect(localStorage.getItem(PRONUNCIATION_TYPE)).toBe(type);
}

describe("pronunciation", () => {
  beforeEach(() => {
    const { pronunciation } = usePronunciation();
    pronunciation.value = PronunciationType.American;
    localStorage.clear();
  });

  it("get default pronunciation if it was stored", () => {
    localStorage.setItem(PRONUNCIATION_TYPE, PronunciationType.British);

    expectPronunciation(PronunciationType.British);
  });

  it("get default pronunciation if it wasn't stored", () => {
    expectPronunciation(PronunciationType.American);
  });

  it("get pronunciation options", () => {
    const { getPronunciationOptions } = usePronunciation();

    expect(getPronunciationOptions()).toEqual([
      { label: "美音", value: "American" },
      { label: "英音", value: "British" },
    ]);
  });

  it("toggle pronunciation", () => {
    const { togglePronunciation } = usePronunciation();

    togglePronunciation(PronunciationType.British);

    expectPronunciation(PronunciationType.British);
  });

  it("encodes English text when building the Youdao pronunciation URL", () => {
    const { getPronunciationUrl } = usePronunciation();

    expect(getPronunciationUrl("I don't know")).toBe(
      "https://dict.youdao.com/dictvoice?type=2&audio=I%20don't%20know",
    );
  });
});
