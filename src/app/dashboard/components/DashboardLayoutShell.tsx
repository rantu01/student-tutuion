"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/components/shared/ToastContainer";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface DashboardLayoutShellProps {
  children: React.ReactNode;
  role: string;
  name?: string;
  email?: string;
}

export function DashboardLayoutShell({ children, role, name, email }: DashboardLayoutShellProps) {
  const { logout } = useAuth();
  const headerUser = { role, name: name || role, email: email || '' };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ToastProvider>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        <Sidebar 
          user={{ role } as any} 
          sidebarOpen={false} 
          setSidebarOpen={() => {}} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <div className="text-xs">
            <DashboardHeader user={headerUser} />
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
