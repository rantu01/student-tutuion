import { cookies } from "next/headers";
import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";
import SiteFooter from "@/components/shared/SiteFooter";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getCurrentUser() {
  const cs = await cookies();
  const cookie = cs.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const res = await fetch(`${BASE}/api/auth/me`, { headers: { cookie }, cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-h3 mb-1">Profile</h1>
          <p className="text-body text-gray-700">View and manage your account information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="text-h6 mb-2">Account</h2>
            {user ? (
              <div className="space-y-2">
                <div className="text-body"><span className="text-gray-500">Name:</span> {user.name || "—"}</div>
                <div className="text-body"><span className="text-gray-500">Email:</span> {user.email || "—"}</div>
                <div className="text-body"><span className="text-gray-500">Role:</span> <span className="capitalize">{user.role || "—"}</span></div>
                {user.userId && (
                  <div className="text-body"><span className="text-gray-500">User ID:</span> {user.userId}</div>
                )}
              </div>
            ) : (
              <div className="text-body text-gray-600">Not signed in.</div>
            )}
          </div>

          <div className="card">
            <h2 className="text-h6 mb-2">Security</h2>
            <div className="space-y-2">
              <Link href="/change-password" className="btn btn-secondary px-4 py-2 rounded-md inline-flex">Change Password</Link>
              <Link href="/reset-password" className="btn btn-secondary px-4 py-2 rounded-md inline-flex">Reset Password</Link>
            </div>
          </div>
        </div>

        <div className="mt-4 card">
          <h2 className="text-h6 mb-2">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="btn btn-secondary px-4 py-2 rounded-md">Home</Link>
            <Link href="/dashboard" className="btn btn-secondary px-4 py-2 rounded-md">Dashboard</Link>
            <Link href="/mission-hub" className="btn btn-secondary px-4 py-2 rounded-md">Mission Hub</Link>
            <Link href="/mission-communication-hub" className="btn btn-secondary px-4 py-2 rounded-md">Communication Hub</Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}


