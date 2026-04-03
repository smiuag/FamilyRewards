import { redirect } from "next/navigation";

export default async function LocaleRoot({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
