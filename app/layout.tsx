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
            __html: `(function(){try{var t=localStorage.getItem("nutmag-theme");var h=new Date().getHours();if(t==="light"||(t==="auto"&&h>=6&&h<20)){document.documentElement.dataset.theme="light";}var p=localStorage.getItem("nutmag-palette");if(p&&p!=="ember"){document.documentElement.dataset.palette=p;}}catch(e){}})();`,
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
