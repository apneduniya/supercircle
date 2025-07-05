import type { Metadata } from "next";

import { Quicksand } from "next/font/google";
import "./globals.css";

import { constructMetaData } from "@/utils/create-metadata";

import Header from "@/components/layout/header";
import { Providers } from "@/providers";


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
        className={`${quicksand.variable} antialiased flex justify-center items-center`}
      >
        <Providers>
          <div className="relative h-full w-full max-w-[500px]">
            <Header />
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
