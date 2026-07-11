import { eq } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";
import { GithubClient } from "@fineness/github";
import { isBotLogin } from "../lib";

/**
 * Full repo scan: one GraphQL request → repos row + raw commits.
 * Raw commits are stored so scores can be recomputed on algo changes.
 */
export async function ingestGithub(payload: { owner: string; name: string }) {
  const db = createDb();
  const gh = GithubClient.fromEnv();
  const { owner, name } = payload;

  const scan = await gh.scanRepo(owner, name);
  if (!scan) {
    console.warn(`[ingest-github] ${owner}/${name} not found or inaccessible`);
    return null;
  }

  const values = {
    owner,
    name,
    githubId: scan.githubId,
    url: `https://github.com/${owner}/${name}`,
    createdAtGh: new Date(scan.createdAt),
    pushedAt: new Date(scan.pushedAt),
    defaultBranch: scan.defaultBranch,
    license: scan.license,
    language: scan.language,
    isFork: scan.isFork,
    parentFullName: scan.parentFullName,
    stars: scan.stars,
    forks: scan.forks,
    watchers: scan.watchers,
    openIssues: scan.openIssues,
    hasTests: scan.hasTests,
    hasCi: scan.hasCI,
    hasLockfile: scan.hasLockfile,
    lastScannedAt: new Date(),
  };

  const [repo] = await db
    .insert(schema.repos)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.repos.owner, schema.repos.name],
      set: values,
    })
    .returning({ id: schema.repos.id });

  const repoId = repo!.id;

  if (scan.commits.length > 0) {
    await db
      .insert(schema.commits)
      .values(
        scan.commits.map((c) => ({
          repoId,
          sha: c.oid,
          authorLogin: c.author?.user?.login ?? null,
          authorIsBot: isBotLogin(c.author?.user?.login ?? null),
          committedAt: new Date(c.committedDate),
          additions: c.additions,
          deletions: c.deletions,
          messageHeadline: c.messageHeadline,
        })),
      )
      .onConflictDoNothing();
  }

  return repoId;
}
