import React from "react";
/**
 * Navbar component
 *
 * A vertical sidebar navigation menu for the dashboard.
 * It contains navigation buttons for different sections such as
 * Dashboard, Financials, Analytics, and Product-related options.
 *
 * @component
 * @example
 * ```tsx
 * <Navbar />
 * ```
 *
 * @returns {JSX.Element} A styled sidebar navigation menu
 */
const Navbar: React.FC = () => (
  <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
    <div></div>
    <div className="text-xl font-bold mb-6">Dashboard</div>
    <nav className="flex flex-col space-y-2 flex-grow">
      <button className="text-left px-3 py-2 rounded bg-gray-200 font-semibold">
        Dashboard
      </button>
      <button className="text-left px-3 py-2 rounded hover:bg-gray-100">
        Financials
      </button>
      <button className="text-left px-3 py-2 rounded hover:bg-gray-100">
        Analytics
      </button>
      <div className="mt-6 font-semibold text-gray-500 uppercase text-xs">
        Product
      </div>
      <button className="text-left px-3 py-2 rounded hover:bg-gray-100">
        Integrations & APIs
      </button>
      <button className="text-left px-3 py-2 rounded hover:bg-gray-100">
        Settings & Administration
      </button>
    </nav>
  </aside>
);

export default Navbar;
