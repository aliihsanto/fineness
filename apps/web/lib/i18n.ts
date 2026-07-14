import type { Lang } from "./i18n-dict";

export * from "./i18n-dict";

export async function getLang(): Promise<Lang> {
  return "en";
}
