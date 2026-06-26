import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { cleanDB, testImportModules } from "../../../test/helper/utils";
import { endDB } from "../../common/db";
import { DB, DbType } from "../../global/providers/db.provider";
import { MasteredElementService } from "../mastered-element.service";

describe("MasteredElementService", () => {
  let db: DbType;
  let masteredElementService: MasteredElementService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: testImportModules,
      providers: [MasteredElementService],
    }).compile();

    db = module.get<DbType>(DB);
    masteredElementService = module.get<MasteredElementService>(MasteredElementService);
  });

  afterAll(async () => {
    await cleanDB(db);
    await endDB();
  });

  beforeEach(async () => {
    await cleanDB(db);
  });

  describe("addMasteredElement", () => {
    it("should successfully add a new mastered element", async () => {
      const userId = "testUser";
      const content = createMasteredContent("statement", "statement-1", "test");

      const result = await masteredElementService.addMasteredElement(userId, content);

      expect(result).toBeDefined();
      expect(result).toEqual(expect.objectContaining(content));
    });

    it("should throw BadRequestException when adding an existing source element", async () => {
      const userId = "testUser";
      const content = createMasteredContent("statement", "statement-1", "test");

      await masteredElementService.addMasteredElement(userId, content);

      await expect(masteredElementService.addMasteredElement(userId, content)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should allow the same english text from a different source", async () => {
      const userId = "testUser";
      await masteredElementService.addMasteredElement(
        userId,
        createMasteredContent("statement", "statement-1", "test"),
      );

      const result = await masteredElementService.addMasteredElement(
        userId,
        createMasteredContent("sentence", "sentence-1", "test"),
      );

      expect(result).toEqual(
        expect.objectContaining({
          sourceType: "sentence",
          sourceId: "sentence-1",
          english: "test",
        }),
      );
    });

    it("should throw BadRequestException when adding element without source id", async () => {
      const userId = "testUser";
      const content = { sourceType: "statement", english: "test", chinese: "" };

      await expect(
        masteredElementService.addMasteredElement(userId, content as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getMasteredElements", () => {
    it("should return all mastered elements for a user", async () => {
      const userId = "testUser";
      const contents = [
        createMasteredContent("statement", "statement-1", "test1"),
        createMasteredContent("statement", "statement-2", "test2"),
        createMasteredContent("sentence", "sentence-1", "test3"),
      ];
      for (const content of contents) {
        await masteredElementService.addMasteredElement(userId, content);
      }

      const result = await masteredElementService.getMasteredElements(userId);

      expect(result).toHaveLength(3);
      expect(result.map(({ sourceType, sourceId, english }) => ({ sourceType, sourceId, english })))
        .toMatchInlineSnapshot(`
        [
          {
            "english": "test3",
            "sourceId": "sentence-1",
            "sourceType": "sentence",
          },
          {
            "english": "test2",
            "sourceId": "statement-2",
            "sourceType": "statement",
          },
          {
            "english": "test1",
            "sourceId": "statement-1",
            "sourceType": "statement",
          },
        ]
      `);
    });

    it("should return elements in descending order of masteredAt", async () => {
      const userId = "testUser";
      const contents = [
        createMasteredContent("statement", "statement-1", "test1"),
        createMasteredContent("statement", "statement-2", "test2"),
        createMasteredContent("sentence", "sentence-1", "test3"),
      ];
      for (const content of contents) {
        await masteredElementService.addMasteredElement(userId, content);
      }

      const result = await masteredElementService.getMasteredElements(userId);

      expect(result.map((r) => r.sourceId)).toEqual(["sentence-1", "statement-2", "statement-1"]);
    });

    it("should return an empty array when user has no mastered elements", async () => {
      const result = await masteredElementService.getMasteredElements("nonexistentUser");
      expect(result).toEqual([]);
    });
  });

  describe("removeMasteredElement", () => {
    it("should successfully remove an existing mastered element", async () => {
      const userId = "testUser";
      const content = createMasteredContent("statement", "statement-1", "test");
      const addedElement = await masteredElementService.addMasteredElement(userId, content);

      await masteredElementService.removeMasteredElement(userId, addedElement.id);

      const elements = await masteredElementService.getMasteredElements(userId);
      expect(elements).toHaveLength(0);
    });

    it("should throw NotFoundException when removing a non-existent element", async () => {
      const userId = "testUser";
      const nonExistentId = "nonexistent";
      await expect(
        masteredElementService.removeMasteredElement(userId, nonExistentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle removal with invalid elementId", async () => {
      const userId = "testUser";
      const invalidElementId = "";
      await expect(
        masteredElementService.removeMasteredElement(userId, invalidElementId),
      ).rejects.toThrow();
    });
  });
});

function createMasteredContent(
  sourceType: "statement" | "sentence",
  sourceId: string,
  english: string,
) {
  return {
    sourceType,
    sourceId,
    english,
    chinese: "测试",
  };
}
