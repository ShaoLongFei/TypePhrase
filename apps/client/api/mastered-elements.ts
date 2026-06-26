import { getHttp } from "./http";

export interface MasteredElementContent {
  sourceType: "statement" | "sentence";
  sourceId: string;
  english: string;
  chinese: string;
}

export interface MasteredElementApiResponse {
  id: string;
  userId: string;
  sourceType: "statement" | "sentence";
  sourceId: string;
  english: string;
  chinese: string;
  masteredAt: Date | string;
}

export async function fetchAddMasteredElement(content: MasteredElementContent) {
  const http = getHttp();
  return http<MasteredElementApiResponse>("/mastered-elements", {
    method: "post",
    body: content,
  });
}
