import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyRewards",
  description: "Gestión de tareas y recompensas para toda la familia",
  applicationName: "FamilyRewards",
  appleWebApp: {
    capable: true,
    title: "FamilyRewards",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
