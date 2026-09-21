import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

function BuildMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-violet" />
      <path
        d="M7 15.5 12 6l5 9.5"
        stroke="hsl(var(--violet-fg))"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 12.5h6" stroke="hsl(var(--seam))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--fg)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Link href="/" className="absolute left-6 top-6 flex items-center gap-2">
        <BuildMark />
        <span className="text-sm font-semibold">BuildAI</span>
      </Link>
      <div className="relative w-full max-w-sm animate-fade-up">{children}</div>
    </div>
  );
}
