import { notFound, redirect } from "next/navigation";
import { getEntryByRepo } from "../../../../lib/data";

export const revalidate = 300;

/** Repo-first view — works even when no token is mapped; for now reuses the token page. */
export default async function RepoPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const entry = await getEntryByRepo(owner, repo);
  if (!entry) notFound();
  redirect(`/t/${entry.symbol}`);
}
