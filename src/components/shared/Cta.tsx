"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Cta() {
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
    <section className="py-12 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-h3 text-gray-900 mb-2">Mentorship Programs</h2>
          <p className="text-body text-gray-700 max-w-2xl mx-auto">
            Structured academic mentoring designed to guide students through courses, missions, and career preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="text-h6 mb-1">Peer Mentoring</h3>
            <p className="text-body-sm text-gray-700">Senior students mentor juniors on coursework, study habits, and mission readiness.</p>
          </div>
          <div className="card">
            <h3 className="text-h6 mb-1">Faculty Advising</h3>
            <p className="text-body-sm text-gray-700">Faculty provide academic guidance, track progress, and align outcomes with curriculum.</p>
          </div>
          <div className="card">
            <h3 className="text-h6 mb-1">Industry Projects</h3>
            <p className="text-body-sm text-gray-700">Mentor-led, real-world projects to build portfolios and practical problem-solving skills.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/mission-hub" className="btn btn-cta px-5 py-2.5 rounded-xl">
            <BookOpen className="w-5 h-5 mr-2" /> Explore Programs
          </Link>
          {isAuthenticated ? (
            <button
              onClick={() => { setNavigating(true); router.push(dashboardUrl); }}
              disabled={navigating}
              className="btn btn-secondary px-5 py-2.5 rounded-xl disabled:opacity-70"
            >
              {navigating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Globe className="w-5 h-5 mr-2" />}
              {navigating ? "Loading..." : "Go to Dashboard"}
            </button>
          ) : (
            <Link href="/login" className="btn btn-secondary px-5 py-2.5 rounded-xl">
              <Globe className="w-5 h-5 mr-2" /> Become a Mentor
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}


