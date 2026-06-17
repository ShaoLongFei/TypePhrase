import { describe, expect, it } from "vitest";

import {
  buildCoursePacks,
  normalizeEnglishForTyping,
  parseManyThingsText,
} from "./tatoebaManythings";

describe("tatoebaManythings importer helpers", () => {
  it("normalizes English for the current word-by-word input checker", () => {
    expect(normalizeEnglishForTyping("Even now, I'd like to see you.")).toBe(
      "Even now I'd like to see you",
    );
    expect(normalizeEnglishForTyping("Tom — don't move!")).toBe("Tom don't move");
    expect(normalizeEnglishForTyping("I ♥ TypePhrase")).toBeNull();
  });

  it("parses, filters, and de-duplicates ManyThings rows", () => {
    const text = [
      "Hi.\t嗨。\tCC-BY 2.0 (France) Attribution: tatoeba.org #1 (A) & #2 (B)",
      "Hi!\t你好。\tCC-BY 2.0 (France) Attribution: tatoeba.org #1 (A) & #3 (C)",
      "I don't know.\t我不知道。\tCC-BY 2.0 (France) Attribution: tatoeba.org #4 (A) & #5 (B)",
      "I ♥ you.\t我爱你。\tCC-BY 2.0 (France) Attribution: tatoeba.org #6 (A) & #7 (B)",
    ].join("\n");

    const result = parseManyThingsText(text, { maxWords: 24 });

    expect(result).toEqual([
      {
        chinese: "嗨。",
        english: "Hi",
        attribution: "CC-BY 2.0 (France) Attribution: tatoeba.org #1 (A) & #2 (B)",
        wordCount: 1,
      },
      {
        chinese: "我不知道。",
        english: "I don't know",
        attribution: "CC-BY 2.0 (France) Attribution: tatoeba.org #4 (A) & #5 (B)",
        wordCount: 3,
      },
    ]);
  });

  it("builds deterministic course packs split by sentence length", () => {
    const statements = [
      {
        chinese: "你好。",
        english: "Hello",
        attribution: "source 1",
        wordCount: 1,
        soundmark: "/həlˈoʊ/",
      },
      {
        chinese: "我不知道。",
        english: "I don't know",
        attribution: "source 2",
        wordCount: 3,
        soundmark: "/aɪ dˈoʊnt nˈoʊ/",
      },
      {
        chinese: "我想今天下午去书店。",
        english: "I want to go to the bookstore this afternoon",
        attribution: "source 3",
        wordCount: 9,
        soundmark: "/aɪ wˈɑːnt/",
      },
      {
        chinese: "如果你明天有空的话我们可以一起吃晚饭。",
        english: "If you are free tomorrow we can have dinner together after work",
        attribution: "source 4",
        wordCount: 12,
        soundmark: "/ɪf ju/",
      },
      {
        chinese: "这是一个更长的句子。",
        english: "This is a longer sentence that should be placed in the long sentence course pack",
        attribution: "source 5",
        wordCount: 14,
        soundmark: "/ðɪs/",
      },
    ];

    const packs = buildCoursePacks(statements, { baseOrder: 10, lessonSize: 2 });

    expect(packs.map((pack) => [pack.id, pack.order, pack.courses.length])).toEqual([
      ["typephrase_tatoeba_cmn_eng_short", 10, 1],
      ["typephrase_tatoeba_cmn_eng_medium", 11, 1],
      ["typephrase_tatoeba_cmn_eng_long", 12, 1],
    ]);
    expect(packs[0].courses[0].statements.map((statement) => statement.english)).toEqual([
      "Hello",
      "I don't know",
    ]);
    expect(packs[1].courses[0].statements.map((statement) => statement.english)).toEqual([
      "I want to go to the bookstore this afternoon",
      "If you are free tomorrow we can have dinner together after work",
    ]);
  });
});
