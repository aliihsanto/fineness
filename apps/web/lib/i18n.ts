import { cookies } from "next/headers";
import type { Lang } from "./i18n-dict";

export * from "./i18n-dict";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("lang")?.value === "tr" ? "tr" : "en";
}
