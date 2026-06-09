"use client";

import { motion } from "framer-motion";

const stack = ["Unity", "Python", "TypeScript", "Docker", "Claude Code"];

export function StackChips() {
  return (
    <section className="space-y-3">
      <p className="label">// stack</p>
      <ul className="flex flex-wrap gap-2">
        {stack.map((item, i) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{
              x: [0, -1, 2, -1, 0],
              filter: ["brightness(1)", "brightness(1.5)", "brightness(0.8)", "brightness(1.4)", "brightness(1)"],
            }}
            className="rounded-full border border-[var(--accent-orange)] px-3 py-0.5 text-[10px] font-[family-name:var(--font-display)] tracking-widest text-[var(--text-primary)] uppercase cursor-default"
            style={{ boxShadow: "0 0 6px rgba(255,107,43,0.08)" }}
          >
            {item}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
