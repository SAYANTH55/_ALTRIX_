import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "ALTRIX | Intelligence, Amplified",
  description: "The AI-powered suite for writing, research, and discovery. Humanize text, analyze papers, and explore knowledge — all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} ${orbitron.variable} antialiased text-white`}
      >
        {children}
      </body>
    </html>
  );
}
