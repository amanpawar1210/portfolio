import { getChatGPTUser } from "../app/chatgpt-auth";

export const OWNER_EMAIL = "amanrpawar18@gmail.com";

export async function isOwner() {
  const user = await getChatGPTUser();
  return user?.email.trim().toLowerCase() === OWNER_EMAIL;
}
