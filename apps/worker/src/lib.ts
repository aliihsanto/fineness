import { scoringUtils } from "@fineness/scoring";

export function isBotLogin(login: string | null): boolean {
  return scoringUtils.isBot(login);
}
