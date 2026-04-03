import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyRewards",
  description: "Gestión de tareas y recompensas para toda la familia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
