"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { LANGUAGE_LABELS } from "@/lib/i18n/dictionary";

/** Toggles the UI language between English and Thai. */
export function LanguageToggle() {
  const { lang, toggleLang } = useI18n();
  const next = lang === "en" ? "th" : "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLang}
      className="gap-1.5"
      aria-label={`Switch language to ${LANGUAGE_LABELS[next]}`}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold">{LANGUAGE_LABELS[lang]}</span>
    </Button>
  );
}
