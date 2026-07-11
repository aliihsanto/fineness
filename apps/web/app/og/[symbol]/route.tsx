import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getEntryBySymbol } from "../../../lib/data";
import { fmtUsd } from "../../../lib/format";

export const revalidate = 300;

// ── assay palette ────────────────────────────────────────────────────────────
const INK = "#0A0F0D";
const GOLD = "#D9B454";
const GOLD_SOFT = "rgba(217, 180, 84, 0.45)";
const GOLD_FAINT = "rgba(217, 180, 84, 0.22)";
const BONE = "#EDE8D8";
const STONE = "#97A094";
const DIM = "#5D6960";

function grade(total: number): { label: string; color: string } {
  if (total >= 70) return { label: "HIGH PURITY", color: "#4FBF7A" };
  if (total >= 40) return { label: "ALLOYED", color: "#D9A93C" };
  return { label: "BASE METAL", color: "#E25D4B" };
}

const FLAG_LABELS: Record<string, string> = {
  FORK: "FORK",
  AI_SLOP: "AI SLOP",
  RUG_WATCH: "RUG WATCH",
  DEAD: "DEAD",
  SOLO: "SOLO",
  FAKE_STARS: "FAKE STARS",
  SHIPPING: "SHIPPING",
};

let fontsPromise: Promise<{ marcellus: Buffer; mono: Buffer; monoSemi: Buffer }> | null = null;
function loadFonts() {
  fontsPromise ??= (async () => {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const [marcellus, mono, monoSemi] = await Promise.all([
      readFile(path.join(dir, "Marcellus-Regular.ttf")),
      readFile(path.join(dir, "IBMPlexMono-Regular.ttf")),
      readFile(path.join(dir, "IBMPlexMono-SemiBold.ttf")),
    ]);
    return { marcellus, mono, monoSemi };
  })();
  return fontsPromise;
}

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const entry = await getEntryBySymbol(symbol);
  if (!entry) return new Response("not found", { status: 404 });

  const { marcellus, mono, monoSemi } = await loadFonts();
  const g = grade(entry.total);
  const max = Math.max(...entry.commitTimeline, 1);
  const sym = `$${entry.symbol}`;
  const symSize = sym.length > 10 ? 58 : sym.length > 7 ? 74 : 92;
  const assayDate = new Date().toISOString().slice(0, 10);
  const lastCommit = entry.lastCommitDaysAgo === 0 ? "TODAY" : `${entry.lastCommitDaysAgo}D AGO`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          backgroundImage: "radial-gradient(ellipse 900px 500px at 15% -10%, rgba(217,180,84,0.08), transparent)",
          padding: 26,
          fontFamily: "PlexMono",
          color: BONE,
        }}
      >
        {/* certificate double border */}
        <div style={{ display: "flex", flex: 1, border: `1.5px solid ${GOLD_SOFT}`, padding: 6 }}>
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
              border: `1px solid ${GOLD_FAINT}`,
              padding: "34px 48px 30px 48px",
            }}
          >
            {/* eyebrow */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 19, letterSpacing: 5, color: GOLD, fontWeight: 600 }}>
                ASSAY REPORT — TOKENIZED REPOSITORY
              </div>
              <div style={{ display: "flex", fontSize: 17, letterSpacing: 2, color: DIM }}>
                {`No. ${assayDate} / v0.1`}
              </div>
            </div>

            {/* main */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 44 }}>
              {/* left: identity + flags */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: symSize, color: BONE, lineHeight: 1.05 }}>
                  {sym}
                </div>
                <div style={{ display: "flex", fontSize: 25, color: STONE, marginTop: 8 }}>
                  {entry.repoFullName}
                </div>
                <div style={{ display: "flex", fontSize: 21, letterSpacing: 1.5, color: "#B9BFAF", marginTop: 24 }}>
                  {`FDV ${fmtUsd(entry.fdv)}   ·   LAST COMMIT ${lastCommit}`}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
                  {entry.flags.slice(0, 5).map((f, i) => {
                    const good = f === "SHIPPING";
                    const c = good ? "#4FBF7A" : "#E25D4B";
                    return (
                      <div
                        key={f}
                        style={{
                          display: "flex",
                          fontSize: 19,
                          fontWeight: 600,
                          letterSpacing: 2.5,
                          padding: "7px 16px",
                          border: `1.5px solid ${c}`,
                          borderRadius: 4,
                          color: c,
                          background: good ? "rgba(79,191,122,0.06)" : "rgba(226,93,75,0.06)",
                          transform: `rotate(${i % 2 === 0 ? -1.6 : 1.1}deg)`,
                        }}
                      >
                        {FLAG_LABELS[f] ?? f}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* right: the fineness stamp */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 330,
                  padding: "30px 20px 26px 20px",
                  border: `2px solid ${GOLD_SOFT}`,
                  background: "linear-gradient(150deg, #131C16, #0C110E)",
                  boxShadow: "inset 0 2px 18px rgba(0,0,0,0.65)",
                }}
              >
                <div style={{ display: "flex", fontSize: 20, fontWeight: 600, letterSpacing: 7, color: GOLD }}>
                  FINENESS
                </div>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Marcellus",
                    fontSize: 148,
                    lineHeight: 1,
                    color: g.color,
                    marginTop: 6,
                  }}
                >
                  {String(entry.total)}
                </div>
                <div style={{ display: "flex", fontSize: 21, letterSpacing: 5, color: STONE, marginTop: 2 }}>
                  OF 100
                </div>
                <div style={{ display: "flex", width: 210, height: 1, background: GOLD_FAINT, marginTop: 18 }} />
                <div
                  style={{
                    display: "flex",
                    fontSize: 21,
                    fontWeight: 600,
                    letterSpacing: 5,
                    color: g.color,
                    marginTop: 14,
                  }}
                >
                  {g.label}
                </div>
              </div>
            </div>

            {/* bottom */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 62 }}>
                  {entry.commitTimeline.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        width: 22,
                        height: Math.max((v / max) * 58, 3),
                        background: v > 0 ? "#8F7420" : "#1C2620",
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", fontSize: 15, letterSpacing: 2.5, color: DIM, marginTop: 10 }}>
                  COMMIT ACTIVITY · 12 WEEKS
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Marcellus",
                    fontSize: 38,
                    backgroundImage: "linear-gradient(100deg, #F0D584 10%, #A9821F 55%, #F0D584 95%)",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  fineness.xyz
                </div>
                <div style={{ display: "flex", fontSize: 14, letterSpacing: 1.5, color: DIM, marginTop: 6 }}>
                  VERIFIABLE GITHUB DATA · NOT FINANCIAL ADVICE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Marcellus", data: marcellus, weight: 400, style: "normal" },
        { name: "PlexMono", data: mono, weight: 400, style: "normal" },
        { name: "PlexMono", data: monoSemi, weight: 600, style: "normal" },
      ],
    },
  );
}
