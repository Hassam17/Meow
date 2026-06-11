import { Link2 } from "lucide-react";
import { quickLinks } from "@/config/links";

export function QuickLinks() {
  return (
    <div className="block quicklinks-compact">
      <div className="block-label">
        <Link2 size={14} strokeWidth={1.75} />
        quicklinks
      </div>

      <div className="quicklink-row">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="quicklink">
              <Icon size={14} strokeWidth={1.75} />
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
