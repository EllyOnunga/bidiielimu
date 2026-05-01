import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-6">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-primary-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        Dashboard
      </Link>
      
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label = value.charAt(0).toUpperCase() + value.slice(1).replace("-", " ");

        if (value === "dashboard") return null;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            {last ? (
              <span className="text-slate-300 font-semibold">{label}</span>
            ) : (
              <Link
                to={to}
                className="hover:text-primary-400 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
