import { Youtube, Linkedin, Bot, type LucideIcon } from "lucide-react";

export type QuickLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Add or remove entries here to change the namecard's quicklinks row.
export const quickLinks: QuickLink[] = [
  { label: "youtube", href: "https://youtube.com/@NutMag2469", icon: Youtube },
  { label: "linkedin", href: "https://linkedin.com/in/nutmag2469", icon: Linkedin },
  { label: "chatgpt", href: "https://chatgpt.com/g/nutmag2469", icon: Bot },
];
