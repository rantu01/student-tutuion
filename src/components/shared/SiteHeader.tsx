"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SiteHeader() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const pathname = usePathname();

  const dashboardUrl = (() => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "student":
        return user.profileCompleted ? "/dashboard/student/profile" : "/profile-complete";
      case "admin":
        return "/dashboard/admin";
      case "manager":
        return "/dashboard/manager";
      case "developer":
        return "/dashboard/developer";
      case "sre":
        return "/dashboard/sre";
      case "mentor":
        return "/dashboard/mentor";
      default:
        return "/dashboard";
    }
  })();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-transparent pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-full border border-black bg-white/95 backdrop-blur shadow-md px-4">
          <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <div className="leading-tight">
              <div className="text-h6">SMS Mentorship</div>
              <div className="text-body-xs text-gray-500">Academic Mentorship Platform</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/"
                    className={`px-3 py-1.5 rounded-full text-body-sm transition-colors ${
                      isActive('/')
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    href={dashboardUrl}
                    className={`px-3 py-1.5 rounded-full text-body-sm transition-colors ${
                      isActive(dashboardUrl)
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black'
                    }`}
                  >
                    Dashboard
                  </Link>
                  {/* <Link
                    href="/mission-hub"
                    className={`px-3 py-1.5 rounded-full text-body-sm transition-colors ${
                      isActive('/mission-hub')
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black'
                    }`}
                  >
                    Mission Hub
                  </Link> */}
                  {/* <Link
                    href="/mission-communication-hub"
                    className={`px-3 py-1.5 rounded-full text-body-sm transition-colors ${
                      isActive('/mission-communication-hub')
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black'
                    }`}
                  >
                    Communication Hub
                  </Link> */}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-body-sm text-gray-600">
                    Welcome, <Link href="/profile" className="font-semibold text-gray-900 hover:text-black">{user?.name || user?.email}</Link>
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md text-body-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary px-3 py-1.5 rounded-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </nav>
  );
}


