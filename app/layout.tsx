import type { Metadata } from "next";
import Script from "next/script";
import { BUILTIN_THEMES } from "@/config/themes";
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
  const themeBootstrap = JSON.stringify(
    BUILTIN_THEMES.map(({ id, label, swatch, tokens, description, source }) => ({
      id,
      label,
      swatch,
      tokens,
      description,
      source,
    })),
  );
  return (
    <html
      lang="en"
      className="h-full antialiased"
      // the pre-paint theme script below mutates data-theme before hydration —
      // expected divergence from server HTML, not a bug
      suppressHydrationWarning
      >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`(function(){try{var builtins=${themeBootstrap};var active=localStorage.getItem("nutmag-theme")||"cyber";var aliasMap={fifa:"football-manager"};active=aliasMap[active]||active;var custom=[];try{var raw=localStorage.getItem("nutmag-theme-catalog");if(raw){var parsed=JSON.parse(raw);if(Array.isArray(parsed)){custom=parsed.filter(function(item){return item&&typeof item.id==="string"&&typeof item.label==="string"&&item.tokens&&typeof item.tokens==="object";});}}}catch(e){}var catalog=builtins.concat(custom);var theme=catalog.find(function(item){return item.id===active;})||catalog.find(function(item){return item.id==="cyber";})||builtins[0];if(!theme)return;var root=document.documentElement;root.dataset.theme=theme.id;root.dataset.themeSource=theme.source||"builtin";Object.keys(theme.tokens).forEach(function(key){root.style.setProperty(key, theme.tokens[key]);});}catch(e){document.documentElement.dataset.theme="cyber";}})();`}</Script>
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
