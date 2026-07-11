"use client";

import { useRouter } from "next/navigation";

export function LangToggle({ current }: { current: "en" | "tr" }) {
  const router = useRouter();
  const set = (lang: "en" | "tr") => {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.2em]">
      {(["en", "tr"] as const).map((lang, i) => (
        <span key={lang} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-faint">/</span>}
          <button
            onClick={() => set(lang)}
            className={`cursor-pointer uppercase transition ${
              current === lang ? "text-gold" : "text-faint hover:text-bone"
            }`}
          >
            {lang}
          </button>
        </span>
      ))}
    </div>
  );
}
