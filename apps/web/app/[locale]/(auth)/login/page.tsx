import { getTranslations } from "next-intl/server";
import LoginClient from "@/components/app/auth/LoginClient";

export default async function LoginPage() {
  const t = await getTranslations("login");
  return <LoginClient t={{ title: t("title"), subtitle: t("subtitle"), description: t("description"), adminBadge: t("adminBadge"), memberBadge: t("memberBadge") }} />;
}
