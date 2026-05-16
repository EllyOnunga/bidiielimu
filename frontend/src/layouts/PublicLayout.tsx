import { Outlet } from "react-router-dom";
import { PublicFooter } from "../components/layout/PublicFooter";

export const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
