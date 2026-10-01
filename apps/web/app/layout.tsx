import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "君斗りんくのすれ違ひ通信",
  description: "すれ違った人と、ゆるくつながる。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ★ノッチ端末で safe-area-inset-* を効かせる（AuthPageShell が使う）。
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
