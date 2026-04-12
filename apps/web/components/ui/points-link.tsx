"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Wraps any points text (+X, -X) in a link to the history page.
 * Inherits all text styles from parent — adds only hover underline.
 */
export function PointsLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  return (
    <Link href={`/${locale}/history`} className={className ?? "hover:underline"}>
      {children}
    </Link>
  );
}
