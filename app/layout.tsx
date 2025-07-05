import type { Metadata } from "next";

import { Quicksand } from "next/font/google";
import "./globals.css";

import { constructMetaData } from "@/utils/create-metadata";

import Header from "@/components/layout/header";
import { Providers } from "@/providers";
import BottomNavbar from "@/components/layout/bottom-navbar";


const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = constructMetaData();


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} antialiased flex justify-center`}
      >
        <Providers>
          <div className="relative h-full min-h-dvh w-full max-w-[500px]">
            <Header />
            <main className="py-24 px-5 h-full min-h-dvh w-full">
              {children}
            </main>
            <BottomNavbar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
