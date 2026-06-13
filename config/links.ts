import { Youtube, Linkedin, Bot, type LucideIcon } from "lucide-react";

export type QuickLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Add or remove entries here to change the namecard's quicklinks row.
export const quickLinks: QuickLink[] = [
  { label: "youtube", href: "https://youtube.com/@PapuBhaiya", icon: Youtube },
  { label: "linkedin", href: "https://www.linkedin.com/in/hassam-h-b23287235", icon: Linkedin },
  { label: "chatgpt", href: "https://chatgpt.com/g/PapuBhaiya", icon: Bot },
];
