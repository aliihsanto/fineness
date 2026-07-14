import { graphql } from "@octokit/graphql";
import { TokenPool } from "./token-pool";

// One request: metadata + last 100 commits with line counts + root tree.
// additions/deletions come straight from GraphQL — the whole anti-slop input.
const REPO_QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      databaseId
      createdAt
      pushedAt
      isFork
      parent {
        nameWithOwner
      }
      stargazerCount
      forkCount
      watchers {
        totalCount
      }
      issues(states: OPEN) {
        totalCount
      }
      licenseInfo {
        key
      }
      primaryLanguage {
        name
      }
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(first: 100) {
              nodes {
                oid
                committedDate
                additions
                deletions
                messageHeadline
                author {
                  user {
                    login
                  }
                }
              }
            }
          }
        }
      }
      object(expression: "HEAD:") {
        ... on Tree {
          entries {
            name
            type
          }
        }
      }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`;

export type RawCommitNode = {
  oid: string;
  committedDate: string;
  additions: number;
  deletions: number;
  messageHeadline: string;
  author: { user: { login: string } | null } | null;
};

export type RepoScan = {
  githubId: number | null;
  createdAt: string;
  pushedAt: string;
  isFork: boolean;
  parentFullName: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  language: string | null;
  defaultBranch: string | null;
  commits: RawCommitNode[];
  rootEntries: { name: string; type: string }[];
  hasTests: boolean;
  hasCI: boolean;
  hasLockfile: boolean;
};

const TEST_HINTS = ["test", "tests", "__tests__", "spec", "vitest.config.ts", "jest.config.js", "jest.config.ts"];
const LOCKFILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb", "bun.lock", "Cargo.lock", "poetry.lock", "uv.lock"];

// flagship repo of an org (or user) — the one a protocol's token actually points at
const TOP_REPO_QUERY = /* GraphQL */ `
  query ($login: String!) {
    repositoryOwner(login: $login) {
      ... on Organization {
        repositories(first: 3, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            name
            stargazerCount
          }
        }
      }
      ... on User {
        repositories(first: 3, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            name
            stargazerCount
          }
        }
      }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`;

export class GithubClient {
  constructor(private pool: TokenPool) {}

  static fromEnv(): GithubClient {
    return new GithubClient(TokenPool.fromEnv());
  }

  /** most-starred non-fork repo of an org/user, or null when the login is gone */
  async topRepo(login: string): Promise<{ owner: string; name: string; stars: number } | null> {
    const token = this.pool.pick();
    let res: any;
    try {
      res = await graphql(TOP_REPO_QUERY, { login, headers: { authorization: `token ${token}` } });
    } catch (err: any) {
      if (err?.data?.rateLimit) {
        this.pool.report(token, err.data.rateLimit.remaining, err.data.rateLimit.resetAt);
      }
      if (err?.errors?.some((e: any) => e.type === "NOT_FOUND")) return null;
      throw err;
    }
    this.pool.report(token, res.rateLimit.remaining, res.rateLimit.resetAt);
    const top = res.repositoryOwner?.repositories?.nodes?.[0];
    return top ? { owner: login, name: top.name, stars: top.stargazerCount } : null;
  }

  async scanRepo(owner: string, name: string): Promise<RepoScan | null> {
    const token = this.pool.pick();
    let res: any;
    try {
      res = await graphql(REPO_QUERY, {
        owner,
        name,
        headers: { authorization: `token ${token}` },
      });
    } catch (err: any) {
      // NOT_FOUND → repo deleted/private; report quota if present, then bubble null
      if (err?.data?.rateLimit) {
        this.pool.report(token, err.data.rateLimit.remaining, err.data.rateLimit.resetAt);
      }
      if (err?.errors?.some((e: any) => e.type === "NOT_FOUND")) return null;
      throw err;
    }

    this.pool.report(token, res.rateLimit.remaining, res.rateLimit.resetAt);
    const r = res.repository;
    if (!r) return null;

    const entries: { name: string; type: string }[] = r.object?.entries ?? [];
    const names = entries.map((e) => e.name.toLowerCase());

    return {
      githubId: r.databaseId ?? null,
      createdAt: r.createdAt,
      pushedAt: r.pushedAt,
      isFork: r.isFork,
      parentFullName: r.parent?.nameWithOwner ?? null,
      stars: r.stargazerCount,
      forks: r.forkCount,
      watchers: r.watchers.totalCount,
      openIssues: r.issues.totalCount,
      license: r.licenseInfo?.key ?? null,
      language: r.primaryLanguage?.name ?? null,
      defaultBranch: r.defaultBranchRef?.name ?? null,
      commits: r.defaultBranchRef?.target?.history?.nodes ?? [],
      rootEntries: entries,
      hasTests: names.some((n) => TEST_HINTS.includes(n)),
      hasCI: names.includes(".github") || names.includes(".gitlab-ci.yml") || names.includes(".circleci"),
      hasLockfile: LOCKFILES.some((l) => names.includes(l.toLowerCase())),
    };
  }
}

export { TokenPool, RateLimitedError } from "./token-pool";
