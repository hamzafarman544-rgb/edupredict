"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const pageTitles = {
  "/dashboard":          { title: "Dashboard",          sub: "Overview & analytics" },
  "/dashboard/predict":  { title: "New Prediction",     sub: "Run AI performance analysis" },
  "/dashboard/students": { title: "Students",           sub: "Manage student records" },
  "/dashboard/history":  { title: "Prediction History", sub: "All past predictions" }
};

export default function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const page = pageTitles[pathname] || { title: "EduPredict", sub: "" };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{page.title}</h1>
        {page.sub && <p className="text-xs text-gray-400 mt-0.5">{page.sub}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Model indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-medium text-blue-700">Random Forest · Active</span>
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-700 hidden md:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
