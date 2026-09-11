import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blockwright — Bedrock Texture Studio",
  description:
    "Paint 16x16 block textures for Minecraft: Bedrock Edition, preview all six faces, and export a ready-to-use add-on.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">{children}</body>
    </html>
  );
}
