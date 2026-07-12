import { cookies } from "next/headers";

export type Lang = "en" | "tr";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("lang")?.value === "tr" ? "tr" : "en";
}

type Dict = typeof en;

const en = {
  layout: {
    tagline: "ASSAY OFFICE — TOKENIZED REPOS",
    methodology: "METHODOLOGY",
    footer1: "VERIFIABLE GITHUB DATA · NOT FINANCIAL ADVICE",
    footer2: "An observation, not an accusation. Project owners can dispute a mapping via /api/submit.",
  },
  home: {
    eyebrow: "REALITY CHECK — LIVE LEDGER",
    title: "How pure is the repo behind the token?",
    introA:
      "Every token's repository is assayed against verifiable GitHub data — fork detection, AI-slop detection, bus factor, post-launch decay. ",
    gapWord: "Reality gap",
    introB:
      " is dollars of FDV per point of actual building: the bigger the gap, the more the market pays for a repo that isn't there.",
    stats: {
      repos: "REPOS ASSAYED",
      fdv: "FDV TRACKED",
      median: "MEDIAN FINENESS",
      forks: "FORKS",
      slop: "AI SLOP",
      dead: "DEAD 14D+",
      shipping: "SHIPPING",
    },
    demoBadge: "DEMO DATA — AWAITING DATABASE_URL",
    sortBy: "SORT BY",
    sorts: { gap: "REALITY GAP", fineness: "FINENESS", fdv: "FDV", volume: "VOL 24H" },
    tabs: { all: "ALL", tribe: "TRIBE", other: "ESTABLISHED" },
    filters: { fdv: "MIN FDV", vol: "MIN VOL 24H", mcap: "MIN MCAP", grade: "GRADE", any: "ANY", apply: "APPLY", clear: "CLEAR" },
    grades: { base: "BASE METAL", alloyed: "ALLOYED", high: "HIGH PURITY" },
    noMatch: "No tokens match these filters.",
    th: {
      token: "TOKEN",
      fineness: "FINENESS",
      fdv: "FDV",
      vol: "VOL 24H",
      gap: "REALITY GAP",
      stars: "STARS",
      devs: "DEVS 30D",
      flags: "FLAGS",
      weeks: "12 WEEKS",
    },
    liq: "LIQ",
    holders: "HOLDERS",
    lastPush: (d: number) => `LAST PUSH ${d}D`,
    pushedToday: "PUSHED TODAY",
    forks: "FORKS",
    commits: "COMMITS",
    repoAge: "REPO AGE",
  },
  token: {
    assayReport: "ASSAY REPORT — TOKENIZED REPOSITORY",
    demoRepo: "DEMO — FICTIONAL REPO",
    launched: (d: number) => `launched ${d}d ago`,
    fdv: "FDV",
    gap: "REALITY GAP",
    lastCommit: "LAST COMMIT",
    today: "TODAY",
    daysAgo: (d: number) => `${d}D AGO`,
    share: "SHARE ON X",
    verdict: (total: number, grade: string, defects: number, gap: string | null) =>
      `${total}/100 — ${grade}. ${defects} defect stamp${defects === 1 ? "" : "s"}.` +
      (gap ? ` The market pays ${gap} per point of verifiable building.` : ""),
    sections: {
      market: "MARKET",
      repository: "REPOSITORY",
      notes: "ASSAY NOTES",
      subscores: "SUB-SCORES",
      hours: "COMMIT HOURS — 24H UTC",
      activity: "COMMIT ACTIVITY — WEEKLY",
      signals: "RAW SIGNALS",
    },
    hoursCaption:
      "Humans sleep: a real team leaves a 4+ hour gap in this histogram. A flat pattern means machine pushing.",
    signalsHint: "EVERY SCORE IS REPRODUCIBLE FROM THESE INPUTS — CHECK OUR MATH.",
    market: {
      price: "PRICE",
      fdv: "FDV",
      mcap: "MARKET CAP",
      vol: "VOLUME 24H",
      liq: "LIQUIDITY",
      holders: "HOLDERS",
    },
    repo: {
      stars: "STARS",
      forks: "FORKS",
      watchers: "WATCHERS",
      issues: "OPEN ISSUES",
      language: "LANGUAGE",
      license: "LICENSE",
      none: "NONE",
      age: "REPO AGE",
      commits30: "COMMITS 30D",
      devs30: "DEVS 30D",
      decay: "LAUNCH DECAY",
    },
    subs: [
      { key: "authenticity", name: "AUTHENTICITY", desc: "is this actually their code?" },
      { key: "antislop", name: "ANTI-SLOP", desc: "human development vs AI dump" },
      { key: "busfactor", name: "BUS FACTOR", desc: "survives one person leaving?" },
      { key: "momentum", name: "MOMENTUM", desc: "still alive after launch?" },
      { key: "community", name: "COMMUNITY", desc: "organic interest vs bought stars" },
    ],
  },
  notes: {
    fork: (p: string) => `Repository is a fork of ${p}.`,
    hiddenFork: "File hashes match a known popular codebase — hidden fork.",
    firstDump: (n: string) => `First commit dumped ${n} lines in one shot.`,
    medianHigh: (n: string) => `Median commit adds ${n} lines — human range is 30-250.`,
    medianOk: (n: number) => `Median commit adds ${n} lines — consistent with hand-written iteration.`,
    burst: (p: number) => `${p}% of commits landed under 3 minutes apart — machine-gun pushing.`,
    noSleep: "No sleep gap in the 24h commit histogram — nobody pushed this by hand around the clock.",
    sleep: "Commit histogram shows a clear overnight gap — a human sleep cycle.",
    decayBad: (p: number) => `Commit rate collapsed to ${p}% of pre-launch pace within a week of launch.`,
    decayGood: "Commit rate held or accelerated after launch.",
    fakeStars: (stars: string, forks: number, issues: number, ratio: number) =>
      `${stars} stars against ${forks} forks and ${issues} open issues — anomaly ratio ${ratio}. Organic repos don't look like this.`,
    stale: (d: number) => `No push for ${d} days.`,
    solo: "Effectively a single author in the last 30 days — bus factor of one.",
    team: (n: number) => `${n} distinct contributors active in the last 30 days.`,
    shipping: "Commit landed within the last 48 hours — still shipping.",
  },
  methodology: {
    eyebrow: "METHODOLOGY",
    title: "How the fineness score works",
    intro:
      "Fineness is the millesimal purity of gold — 999 is pure, 400 is mostly filler. We apply the same idea to repos behind tokens. Every score is 0-100, built from five verifiable sub-scores. No price prediction, no buy/sell signals — only GitHub data anyone can check.",
    sections: [
      {
        title: "AUTHENTICITY — 30 PTS",
        body: "Is this actually their code? GitHub fork flag (−30), hidden forks caught by file-hash fingerprinting against a corpus of popular repos (−25), identity mismatches between package.json / LICENSE / README and the repo owner (−10 each), 5,000+ line first-commit dumps (−15), erased git history (−10).",
      },
      {
        title: "ANTI-SLOP — 25 PTS",
        body: "Did humans build this over time, or did an AI dump it overnight? Commit size distribution (human median is ~30-250 added lines), machine-gun commit bursts (<3 min apart), commit message entropy (templated messages collapse to one bucket), circadian rhythm (humans sleep; a 24h histogram with no 4-hour gap is suspicious), and engineering hygiene (tests, CI, lockfile).",
      },
      {
        title: "BUS FACTOR — 15 PTS",
        body: "15 × (1 − Gini) × min(uniqueAuthors/4, 1) over the last 90 days of non-bot commits. One person doing 95% of commits scores near zero.",
      },
      {
        title: "MOMENTUM — 20 PTS",
        body: "Recency decays exponentially: exp(−daysSinceLastPush / 10). Post-launch decay ratio compares commits 7 days after launch vs 7 days before — below 0.2 raises the RUG WATCH flag.",
      },
      {
        title: "COMMUNITY — 10 PTS",
        body: "Star velocity plus an engagement mix. High stars with near-zero forks, issues and watchers is not organic — that raises FAKE STARS and halves the sub-score.",
      },
    ],
    gapTitle: "REALITY GAP",
    gapBody:
      "— dollars of fully diluted valuation per point of verifiable building. The leaderboard sorts by it.",
    transparencyTitle: "TRANSPARENCY",
    transparencyBody:
      "Every score page shows the raw signals it was computed from, and the scoring engine is open source (@fineness/scoring) — run it yourself. Scores carry an algo_version; when the formula changes, everything is recomputed. If we got your repo wrong, dispute the mapping via the submit endpoint.",
  },
};

const tr: Dict = {
  layout: {
    tagline: "AYAR EVİ — TOKEN'LAŞTIRILMIŞ REPOLAR",
    methodology: "METODOLOJİ",
    footer1: "DOĞRULANABİLİR GITHUB VERİSİ · YATIRIM TAVSİYESİ DEĞİLDİR",
    footer2: "Bu bir gözlemdir, suçlama değildir. Proje sahipleri /api/submit üzerinden eşlemeye itiraz edebilir.",
  },
  home: {
    eyebrow: "GERÇEKLİK KONTROLÜ — CANLI DEFTER",
    title: "Token'ın arkasındaki repo ne kadar saf?",
    introA:
      "Her token'ın deposu doğrulanabilir GitHub verisiyle ayar testinden geçirilir — fork tespiti, AI-slop tespiti, bus factor, launch sonrası çürüme. ",
    gapWord: "Reality gap",
    introB:
      " gerçekten inşa edilen her puan başına ödenen FDV dolarıdır: boşluk büyüdükçe piyasa, var olmayan bir repo için daha çok ödüyor demektir.",
    stats: {
      repos: "TARANAN REPO",
      fdv: "İZLENEN FDV",
      median: "MEDYAN FINENESS",
      forks: "FORK",
      slop: "AI SLOP",
      dead: "ÖLÜ 14G+",
      shipping: "SHIPPING",
    },
    demoBadge: "DEMO VERİ — DATABASE_URL BEKLENİYOR",
    sortBy: "SIRALA",
    sorts: { gap: "REALITY GAP", fineness: "FINENESS", fdv: "FDV", volume: "HACİM 24S" },
    tabs: { all: "TÜMÜ", tribe: "TRIBE", other: "YERLEŞİK" },
    filters: { fdv: "MİN FDV", vol: "MİN HACİM 24S", mcap: "MİN MCAP", grade: "DERECE", any: "HEPSİ", apply: "UYGULA", clear: "TEMİZLE" },
    grades: { base: "BASE METAL", alloyed: "ALLOYED", high: "HIGH PURITY" },
    noMatch: "Bu filtrelere uyan token yok.",
    th: {
      token: "TOKEN",
      fineness: "FINENESS",
      fdv: "FDV",
      vol: "HACİM 24S",
      gap: "REALITY GAP",
      stars: "STAR",
      devs: "DEV 30G",
      flags: "BAYRAKLAR",
      weeks: "12 HAFTA",
    },
    liq: "LİK",
    holders: "HOLDER",
    lastPush: (d: number) => `SON PUSH ${d}G`,
    pushedToday: "BUGÜN PUSH",
    forks: "FORK",
    commits: "COMMIT",
    repoAge: "REPO YAŞI",
  },
  token: {
    assayReport: "AYAR RAPORU — TOKEN'LAŞTIRILMIŞ REPO",
    demoRepo: "DEMO — KURGUSAL REPO",
    launched: (d: number) => `${d}g önce launch`,
    fdv: "FDV",
    gap: "REALITY GAP",
    lastCommit: "SON COMMIT",
    today: "BUGÜN",
    daysAgo: (d: number) => `${d}G ÖNCE`,
    share: "X'TE PAYLAŞ",
    verdict: (total: number, grade: string, defects: number, gap: string | null) =>
      `${total}/100 — ${grade}. ${defects} kusur damgası.` +
      (gap ? ` Piyasa, doğrulanabilir her inşa puanı için ${gap} ödüyor.` : ""),
    sections: {
      market: "PİYASA",
      repository: "REPO",
      notes: "AYAR NOTLARI",
      subscores: "ALT SKORLAR",
      hours: "COMMIT SAATLERİ — 24S UTC",
      activity: "COMMIT AKTİVİTESİ — HAFTALIK",
      signals: "HAM SİNYALLER",
    },
    hoursCaption:
      "İnsanlar uyur: gerçek bir ekip bu histogramda 4+ saatlik boşluk bırakır. Dümdüz bir dağılım makine push'u demektir.",
    signalsHint: "HER SKOR BU GİRDİLERDEN YENİDEN HESAPLANABİLİR — MATEMATİĞİMİZİ KONTROL EDİN.",
    market: {
      price: "FİYAT",
      fdv: "FDV",
      mcap: "PİYASA DEĞERİ",
      vol: "HACİM 24S",
      liq: "LİKİDİTE",
      holders: "HOLDER",
    },
    repo: {
      stars: "STAR",
      forks: "FORK",
      watchers: "İZLEYEN",
      issues: "AÇIK ISSUE",
      language: "DİL",
      license: "LİSANS",
      none: "YOK",
      age: "REPO YAŞI",
      commits30: "COMMIT 30G",
      devs30: "DEV 30G",
      decay: "LAUNCH ÇÜRÜMESİ",
    },
    subs: [
      { key: "authenticity", name: "ÖZGÜNLÜK", desc: "kod gerçekten onların mı?" },
      { key: "antislop", name: "ANTİ-SLOP", desc: "insan emeği mi, AI dökümü mü?" },
      { key: "busfactor", name: "BUS FACTOR", desc: "tek kişi gidince hayatta kalır mı?" },
      { key: "momentum", name: "MOMENTUM", desc: "launch'tan sonra yaşıyor mu?" },
      { key: "community", name: "TOPLULUK", desc: "organik ilgi mi, satın alınmış star mı?" },
    ],
  },
  notes: {
    fork: (p: string) => `Repo, ${p} deposunun fork'u.`,
    hiddenFork: "Dosya hash'leri bilinen popüler bir kod tabanıyla eşleşiyor — gizli fork.",
    firstDump: (n: string) => `İlk commit tek seferde ${n} satır döktü.`,
    medianHigh: (n: string) => `Medyan commit ${n} satır ekliyor — insan aralığı 30-250'dir.`,
    medianOk: (n: number) => `Medyan commit ${n} satır ekliyor — elle yazılan iterasyonla tutarlı.`,
    burst: (p: number) => `Commit'lerin %${p}'i 3 dakikadan kısa aralıklarla atılmış — makineli tüfek push'u.`,
    noSleep: "24 saatlik commit histogramında uyku boşluğu yok — bunu gece gündüz elle push eden olmamış.",
    sleep: "Commit histogramı net bir gece boşluğu gösteriyor — insan uyku düzeni.",
    decayBad: (p: number) => `Commit temposu launch'tan sonraki bir hafta içinde launch öncesinin %${p}'ine düştü.`,
    decayGood: "Commit temposu launch sonrasında korundu veya hızlandı.",
    fakeStars: (stars: string, forks: number, issues: number, ratio: number) =>
      `${forks} fork ve ${issues} açık issue'ya karşılık ${stars} star — anomali oranı ${ratio}. Organik repolar böyle görünmez.`,
    stale: (d: number) => `${d} gündür push yok.`,
    solo: "Son 30 günde fiilen tek yazar — bus factor bir.",
    team: (n: number) => `Son 30 günde ${n} farklı katkıcı aktif.`,
    shipping: "Son 48 saat içinde commit atılmış — hâlâ üretiyor.",
  },
  methodology: {
    eyebrow: "METODOLOJİ",
    title: "Fineness skoru nasıl çalışır",
    intro:
      "Fineness, altının binde saflık ayarıdır — 999 saftır, 400 çoğunlukla dolgudur. Aynı fikri token'ların arkasındaki repolara uyguluyoruz. Her skor 0-100 arasıdır ve beş doğrulanabilir alt skordan oluşur. Fiyat tahmini yok, al/sat sinyali yok — yalnızca herkesin kontrol edebileceği GitHub verisi.",
    sections: [
      {
        title: "ÖZGÜNLÜK — 30 PUAN",
        body: "Kod gerçekten onların mı? GitHub fork bayrağı (−30), popüler repo korpusuna karşı dosya hash parmak iziyle yakalanan gizli fork'lar (−25), package.json / LICENSE / README ile repo sahibi arasındaki kimlik uyumsuzlukları (her biri −10), ilk commit'te 5.000+ satır döküm (−15), silinmiş git geçmişi (−10).",
      },
      {
        title: "ANTİ-SLOP — 25 PUAN",
        body: "Bunu insanlar zamanla mı inşa etti, yoksa bir AI bir gecede mi döktü? Commit boyutu dağılımı (insan medyanı ~30-250 satır), makineli tüfek commit patlamaları (<3 dk arayla), commit mesajı entropisi (şablon mesajlar tek kovaya düşer), sirkadiyen ritim (insanlar uyur; 4 saatlik boşluğu olmayan 24 saatlik histogram şüphelidir) ve mühendislik hijyeni (test, CI, lockfile).",
      },
      {
        title: "BUS FACTOR — 15 PUAN",
        body: "Son 90 günün bot olmayan commit'leri üzerinden 15 × (1 − Gini) × min(uniqueAuthors/4, 1). Commit'lerin %95'ini tek kişinin attığı repo sıfıra yakın puan alır.",
      },
      {
        title: "MOMENTUM — 20 PUAN",
        body: "Tazelik üstel azalır: exp(−sonPushtanBeriGün / 10). Launch sonrası çürüme oranı, launch'tan sonraki 7 günün commit'lerini önceki 7 günle karşılaştırır — 0.2'nin altı RUG WATCH bayrağını kaldırır.",
      },
      {
        title: "TOPLULUK — 10 PUAN",
        body: "Star hızı artı etkileşim karışımı. Fork, issue ve izleyici sıfıra yakınken yüksek star organik değildir — FAKE STARS bayrağı kalkar ve alt skor yarıya iner.",
      },
    ],
    gapTitle: "REALITY GAP",
    gapBody:
      "— doğrulanabilir inşanın her puanı başına düşen tam seyreltilmiş değerleme doları. Liderlik tablosu buna göre sıralanır.",
    transparencyTitle: "ŞEFFAFLIK",
    transparencyBody:
      "Her skor sayfası, hesaplandığı ham sinyalleri gösterir ve skorlama motoru açık kaynaktır (@fineness/scoring) — kendiniz çalıştırabilirsiniz. Skorlar algo_version taşır; formül değiştiğinde her şey yeniden hesaplanır. Reponuzu yanlış değerlendirdiysek submit endpoint'i üzerinden itiraz edin.",
  },
};

const dicts: Record<Lang, Dict> = { en, tr };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
