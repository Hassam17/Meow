"use client";

import { motion } from "framer-motion";
import { NutMagLogo } from "@/components/NutMagLogo";

const PROJECT_EPOCH = new Date("2026-06-08T00:00:00Z").getTime();

function daysSince() {
  return Math.floor((Date.now() - PROJECT_EPOCH) / 86_400_000);
}

function GlitchLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-[var(--accent-cyan)] text-xs tracking-widest uppercase cursor-pointer"
      whileHover={{
        x: [0, -2, 2, -1, 0],
        filter: ["brightness(1)", "brightness(1.5)", "brightness(0.7)", "brightness(1.4)", "brightness(1)"],
      }}
      transition={{ duration: 0.18, times: [0, 0.25, 0.5, 0.75, 1] }}
    >
      {children}
    </motion.a>
  );
}

export function IdentityBlock() {
  const days = daysSince();

  return (
    <section className="space-y-3">
      <div>
        <NutMagLogo className="mb-3 h-5 w-auto" />
        <p className="label">// identity</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider text-[var(--accent-orange)]"
          style={{ textShadow: "0 0 20px rgba(255,107,43,0.4)" }}
        >
          NutMag2469
        </h1>
        <p className="font-[family-name:var(--font-display)] text-sm text-[var(--text-muted)] mt-0.5 tracking-widest">
          building things at 2am
        </p>
      </div>

      <div className="flex items-center gap-5">
        <GlitchLink href="https://github.com/NutMag2469" external>github</GlitchLink>
        <span className="text-[var(--text-muted)] text-xs">·</span>
        <GlitchLink href="#homelab">homelab</GlitchLink>
        <span className="text-[var(--text-muted)] text-xs">·</span>
        <span className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-display)] tracking-widest">
          {days}d running this build
        </span>
      </div>
    </section>
  );
}
