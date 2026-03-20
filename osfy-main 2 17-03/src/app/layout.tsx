import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// TecOS - Sistema SaaS Multi-Loja para Assistências Técnicas
export const metadata: Metadata = {
  title: "TecOS - Sistema de Ordens de Serviço para Assistências Técnicas",
  description: "Sistema completo de gestão de ordens de serviço para assistências técnicas. Multi-loja, QR Code, timeline visual, assinatura digital e muito mais.",
  keywords: ["OS", "ordem de serviço", "assistência técnica", "celular", "manutenção", "gestão", "SaaS"],
  authors: [{ name: "TecOS" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
