import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-lg font-bold">S</span>
              </div>
              <span className="text-h6">SMS Mentorship</span>
            </div>
            <p className="text-body-sm text-gray-600 dark:text-gray-400">
              Empowering educational institutions with comprehensive student management solutions.
            </p>
          </div>

          <div>
            <h3 className="text-body font-semibold mb-2">Platform</h3>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-body-sm">
              <li><Link href="/dashboard" className="hover:text-black dark:hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/mission-hub" className="hover:text-black dark:hover:text-white transition-colors">Mission Hub</Link></li>
              <li><Link href="/docs" className="hover:text-black dark:hover:text-white transition-colors">Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-body font-semibold mb-2">Features</h3>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-body-sm">
              <li>Student Management</li>
              <li>Mission System</li>
              <li>Course Management</li>
              <li>Analytics</li>
            </ul>
          </div>

          <div>
            <h3 className="text-body font-semibold mb-2">Support</h3>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-body-sm">
              <li>Help Center</li>
              <li>API Reference</li>
              <li>Contact Support</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-6 pt-6 text-center text-gray-600 dark:text-gray-400 text-body-sm">
          <p>&copy; 2024 SMS Mentorship. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


