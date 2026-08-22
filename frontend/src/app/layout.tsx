import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ntust-robotresearchers.vercel.app"),
  title: {
    default: "臺科大機器人研究社 社團網站 | NTUST Robot Researchers Club Website",
    template: "%s | 臺科大機器人研究社",
  },
  description: "國立臺灣科技大學 機器人研究社（NTUST Robot Researchers Club）社團官網",
  keywords: [
    "臺科大",
    "臺灣科技大學",
    "NTUST",
    "機器人研究社",
    "機器人",
    "創客",
    "程式",
    "Arduino",
    "3D列印",
    "雷射切割",
    "社團",
    "黑客松",
    "創客松",
    "工作坊"
  ],
  authors: [{ name: "國立臺灣科技大學 機器人研究社" }],
  creator: "國立臺灣科技大學 機器人研究社 俞詠翔",
  publisher: "國立臺灣科技大學 機器人研究社",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "NTUST Robot Researchers Club 臺科大機器人研究社",
    title: "臺科大機器人研究社 社團官網",
    description: "國立臺灣科技大學 機器人研究社（NTUST Robot Researchers Club）社團官網",
    images: [
      {
        url: "/image/Bar_Logo_Yellow.png",
        width: 1200,
        height: 630,
        alt: "臺科大機器人研究社 NTUST RRC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "臺科大機器人研究社 社團官網",
    description: "國立臺灣科技大學 機器人研究社（NTUST Robot Researchers Club）社團官網",
    images: ["/image/Bar_Logo_Yellow.png"],
  },
  verification: {
    google: "6ohWJUh6HtS-jw5dKoELpnViGjB1xx_aGiZq7dT9CTQ",
  },
};

export const viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${notoSansTC.variable} ${geistMono.variable} font-sans antialiased overscroll-none`}
        style={{ fontFamily: "var(--font-noto-sans-tc), sans-serif" }}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

