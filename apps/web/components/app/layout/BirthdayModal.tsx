"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";

export default function BirthdayModal() {
  const t = useTranslations("birthday");
  const { currentUser } = useAppStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.birthDate) return;

    const today = new Date();
    const [, mm, dd] = currentUser.birthDate.split("-");
    const todayMM = String(today.getMonth() + 1).padStart(2, "0");
    const todayDD = String(today.getDate()).padStart(2, "0");

    if (mm !== todayMM || dd !== todayDD) return;

    const key = `birthday-shown-${currentUser.id}-${today.getFullYear()}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    setOpen(true);
  }, [currentUser?.id, currentUser?.birthDate]);

  if (!currentUser) return null;

  return (
    <AppModal open={open} onOpenChange={setOpen}>
      <AppModalHeader
        emoji="\u{1F382}"
        title={t("title", { name: currentUser.name })}
        color="bg-gradient-to-r from-pink-500 to-purple-500"
        onClose={() => setOpen(false)}
      />
      <AppModalBody>
        <div className="text-center space-y-4 py-2">
          <div className="text-5xl">{"\u{1F389}\u{1F382}\u{1F389}"}</div>
          <p className="text-base text-muted-foreground">
            {t("message")}
          </p>
        </div>
      </AppModalBody>
      <AppModalFooter className="justify-center border-0">
        <Button onClick={() => setOpen(false)} className="px-8">
          {t("button")}
        </Button>
      </AppModalFooter>
    </AppModal>
  );
}
