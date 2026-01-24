import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MinimalChat - AI 对话助手",
  description: "一个极简的 AI 对话应用，支持多种大模型",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
