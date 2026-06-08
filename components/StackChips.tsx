const stack = ["Unity", "Python", "TypeScript", "Docker", "Claude Code"];

export function StackChips() {
  return (
    <ul className="flex flex-wrap gap-2">
      {stack.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[var(--accent-orange)] px-3 py-1 text-xs text-[var(--text-primary)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
