"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HelpCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionDef {
  id: string;
  emoji: string;
  key: string;
  adminOnly?: boolean;
  questionCount: number;
}

const SECTION_DEFS: SectionDef[] = [
  { id: "start", emoji: "\u{1F680}", key: "start", questionCount: 3 },
  { id: "tasks", emoji: "\u2705", key: "tasks", questionCount: 4 },
  { id: "points", emoji: "\u2B50", key: "points", questionCount: 4 },
  { id: "rewards", emoji: "\u{1F381}", key: "rewards", questionCount: 3 },
  { id: "challenges", emoji: "\u{1F3C6}", key: "challenges", questionCount: 3 },
  { id: "achievements", emoji: "\u{1F947}", key: "achievements", questionCount: 2 },
  { id: "calendar", emoji: "\u{1F4C5}", key: "calendar", questionCount: 2 },
  { id: "admin_general", emoji: "\u2699\uFE0F", key: "admin_general", adminOnly: true, questionCount: 2 },
  { id: "admin_tasks", emoji: "\u{1F4CB}", key: "admin_tasks", adminOnly: true, questionCount: 3 },
  { id: "admin_rewards", emoji: "\u{1F3C5}", key: "admin_rewards", adminOnly: true, questionCount: 2 },
  { id: "admin_templates", emoji: "\u{1F4E6}", key: "admin_templates", adminOnly: true, questionCount: 1 },
];

export default function HelpClient() {
  const t = useTranslations("help");
  const { currentUser } = useAppStore();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!currentUser) return null;

  const isAdmin = currentUser.role === "admin";

  // Build sections from translations
  const allSections = useMemo(() => {
    return SECTION_DEFS.filter((def) => !def.adminOnly || isAdmin).map((def) => {
      const items: { question: string; answer: string }[] = [];
      for (let i = 1; i <= def.questionCount; i++) {
        items.push({
          question: t(`sections.${def.key}.q${i}`),
          answer: t(`sections.${def.key}.a${i}`),
        });
      }
      return {
        id: def.id,
        emoji: def.emoji,
        title: t(`sections.${def.key}.title`),
        adminOnly: def.adminOnly,
        items,
      };
    });
  }, [t, isAdmin]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allSections;
    const q = query.toLowerCase();
    return allSections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [query, allSections]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {/* Sections */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("noResults", { query })}
          </CardContent>
        </Card>
      ) : (
        filtered.map((section) => (
          <div key={section.id} className="space-y-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span>{section.emoji}</span>
              {section.title}
              {section.adminOnly && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full normal-case tracking-normal">
                  {t("adminOnly")}
                </span>
              )}
            </h2>
            <Card className="shadow-sm divide-y divide-border">
              {section.items.map((item) => {
                const key = `${section.id}:${item.question}`;
                const open = expanded[key];
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-sm pr-4">
                        {item.question}
                      </span>
                      {open ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {open && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground pt-2">
        {t("footer")}
      </p>
    </div>
  );
}
