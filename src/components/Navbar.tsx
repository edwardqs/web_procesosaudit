import { useAuthStore } from "../stores/authStore";

interface NavbarProps {
  onMenuToggle: () => void;
  title?: string;
}

export default function Navbar({ onMenuToggle, title }: NavbarProps) {
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 lg:px-8">
      {/* left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        </div>
      </div>

      {/* right */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-xs font-medium text-slate-500">
            {new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold border-2 border-brand-200">
          {initial}
        </div>
      </div>
    </header>
  );
}
