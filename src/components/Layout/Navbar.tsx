import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navLinkBase =
  "text-sm font-medium px-3 py-2 rounded-full transition-colors hover:bg-slate-800 hover:text-white";

export function Navbar() {
  const { user, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="EventSphere logo"
            className="h-9 w-9 rounded-full shadow-sm"
          />
          <div className="leading-tight">
            <p className="text-xl font-bold tracking-tight text-slate-900">
              EventSphere
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`
            }
          >
            Events
          </NavLink>

          {role === "participant" && (
            <NavLink
              to="/participant"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`
              }
            >
              My Registrations
            </NavLink>
          )}

          {role === "organizer" && (
            <NavLink
              to="/organizer"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`
              }
            >
              Organizer Panel
            </NavLink>
          )}

          {user ? (
            <button
              onClick={logout}
              className="ml-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Sign out
            </button>
          ) : (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive
                  ? "bg-slate-900 text-white"
                  : "ml-2 border border-slate-200 text-slate-700 hover:border-slate-300"
                }`
              }
            >
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}



