import { Github, Server } from "lucide-react";
import { NutMagLogo } from "@/components/NutMagLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

const PROJECT_EPOCH = new Date("2026-06-08T00:00:00Z").getTime();

function daysSince() {
  return Math.floor((Date.now() - PROJECT_EPOCH) / 86_400_000);
}

export function IdentityBlock() {
  const days = daysSince();

  return (
    <div className="namecard">
      <div>
        <div className="namecard-logo flex items-center gap-2">
          <NutMagLogo className="h-5 w-auto" />
          NutMag2469
        </div>
        <div className="namecard-sub flex flex-wrap items-center gap-2">
          <a
            href="https://github.com/NutMag2469"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            <Github size={14} strokeWidth={1.75} /> github
          </a>
          <span>·</span>
          <a href="#homelab" className="inline-flex items-center gap-1">
            <Server size={14} strokeWidth={1.75} /> homelab
          </a>
          <span>·</span>
          <span>{days}d running this build</span>
        </div>
      </div>
      <div className="namecard-right">
        <div className="namecard-tagline">building things at 2am</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="live-badge">
            <span className="live-dot" />
            live
          </span>
        </div>
      </div>
    </div>
  );
}
