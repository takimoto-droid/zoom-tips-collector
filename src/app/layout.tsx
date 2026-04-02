import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoom Tips Collector",
  description: "Zoom Tips を自動収集・共有",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
