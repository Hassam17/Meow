import type { Metadata } from "next";
import { DotGothic16, JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic",
  weight: "400",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutMag2469",
  description: "A living developer identity card — what I'm listening to, playing, building, and running.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dotGothic16.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("nutmag-theme")==="light"){document.documentElement.dataset.theme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
