import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import pauserLogo from "../assets/pauser_logo_procesos-removebg-preview.png";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const links = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    adminOnly: true,
  },
  {
    to: "/usuarios",
    label: "Usuarios",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    adminOnly: true,
  },
  {
    to: "/programas",
    label: "Programas",
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.363 2.363 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
    adminOnly: true,
  },
  {
    to: "/mis-programas",
    label: "Mis Programas",
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.363 2.363 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
    adminOnly: false,
  },
  {
    to: "/reports",
    label: "Reportes",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    adminOnly: false,
  },
  {
    to: "/home",
    label: "Mi perfil",
    icon: "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function Sidebar({ open, onClose, isCollapsed, toggleCollapse }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);
  const isAdmin = user?.roleId === 1;

  // Filter links based on admin status
  const visibleLinks = links.filter(link => !link.adminOnly || isAdmin);

  const logout = () => {
    storeLogout();
    navigate("/login");
  };
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside className={`group fixed inset-y-0 left-0 z-50 bg-sidebar flex flex-col transition-all duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "w-[80px]" : "w-[270px]"}`}>
        {/* toggle collapse button (desktop only) */}
        <button
          onClick={toggleCollapse}
          className={`hidden lg:flex absolute top-6 -right-3 w-6 h-6 bg-brand-600 text-white rounded-full items-center justify-center shadow-md z-50 hover:bg-brand-500 transition-all opacity-0 group-hover:opacity-100 ring-2 ring-[#f4f6f9]`}
          title={isCollapsed ? "Expandir" : "Ocultar"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* logo */}
        <div className="py-5 min-h-[72px] flex items-center justify-center border-b border-white/10 px-4">
          <img src={pauserLogo} alt="Pauser" className={`object-contain transition-all duration-300 ${isCollapsed ? "w-12 h-auto" : "w-11/12 max-w-[200px] h-auto"}`} />
        </div>

        {/* nav */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          <p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 transition-all duration-300 ${isCollapsed ? "text-center px-0" : "px-3"}`}>
            {isCollapsed ? "..." : "Navegacion"}
          </p>
          {visibleLinks.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                  isCollapsed ? "justify-center py-3" : "px-4 py-3 gap-3"
                } ${
                  active
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                  <path d={item.icon} />
                </svg>
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* switch module */}
        <div className={`px-3 pb-2 ${isCollapsed ? "px-2" : ""}`}>
          <button
            onClick={() => navigate("/")}
            title={isCollapsed ? "Cambiar modulo" : undefined}
            className={`flex items-center w-full rounded-xl text-sm font-medium transition-all text-slate-500 hover:text-white hover:bg-white/[0.06] ${
              isCollapsed ? "justify-center py-3" : "px-4 py-3 gap-3"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
              <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            {!isCollapsed && <span>Cambiar modulo</span>}
          </button>
        </div>

        {/* user */}
        <div className={`border-t border-white/[0.08] transition-all duration-300 ${isCollapsed ? "p-3" : "p-4"}`}>
          <div className={`bg-white/[0.04] rounded-xl flex items-center transition-all duration-300 ${isCollapsed ? "p-2 justify-center" : "px-4 py-3 gap-3"}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
              {initial}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                  <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name || user?.email}</p>
                  <p className="text-[11px] text-slate-500 capitalize leading-tight">{user?.roleName || (user?.roleId === 1 ? "admin" : "user")}</p>
                </div>
                <button
                  onClick={logout}
                  title="Cerrar sesion"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-white/[0.06] transition-all shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
