import { getHttp } from "./http";

export interface MasteredElementContent {
  english: string;
}

export interface MasteredElementApiResponse {
  id: string;
  userId: string;
  content: MasteredElementContent;
  masteredAt: Date | string;
}

export async function fetchAddMasteredElement(content: MasteredElementContent) {
  const http = getHttp();
  return http<MasteredElementApiResponse>("/mastered-elements", {
    method: "post",
    body: { content },
  });
}
