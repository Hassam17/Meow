import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "PapuBhaiya",
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
      className="h-full antialiased"
      // the pre-paint theme script below mutates data-theme before hydration —
      // expected divergence from server HTML, not a bug
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("nutmag-theme");var v=t==="cyber"||t==="fifa"||t==="mission-control"||t==="glass"||t==="retro"?t:"cyber";document.documentElement.dataset.theme=v;}catch(e){document.documentElement.dataset.theme="cyber";}})();`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        // browser extensions may inject body attributes before hydration
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
