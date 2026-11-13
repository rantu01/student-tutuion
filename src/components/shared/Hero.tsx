"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Target, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Hero() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

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

  return (
    <section className="bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-h3 mb-2">
            Student Management
            <span className="block">System</span>
          </h1>
          <p className="text-body max-w-3xl mx-auto leading-relaxed">
            A comprehensive platform for managing student missions, courses, and academic progress. 
            Streamline your educational institution with our powerful dashboard and mission management system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => { setNavigating(true); router.push(dashboardUrl); }}
                disabled={navigating}
                className="btn btn-primary px-5 py-2.5 rounded-xl shadow disabled:opacity-70"
              >
                {navigating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Target className="w-5 h-5 mr-2" />}
                {navigating ? "Loading..." : "Go to Dashboard"}
                {!navigating && <ArrowRight className="w-5 h-5 ml-2" />}
              </button>
              <Link
                href="/mission-hub"
                className="btn btn-cta px-5 py-2.5 rounded-xl"
              >
                <Users className="w-5 h-5 mr-2" />
                Mission Hub
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-primary px-5 py-2.5 rounded-xl shadow"
              >
                <Target className="w-5 h-5 mr-2" />
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/login"
                className="btn btn-cta px-5 py-2.5 rounded-xl"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign In to Explore
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


