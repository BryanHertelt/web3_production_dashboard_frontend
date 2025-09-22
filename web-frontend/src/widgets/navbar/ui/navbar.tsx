import React from "react";
/**
 * Renders a sidebar navigation bar for the dashboard, including sections for
 * main navigation items like Dashboard, Financials, and Analytics, as well as
 * a Product section with additional options.
 *
 * @returns {JSX.Element} A React element representing the navigation sidebar.
 */
const Navbar: React.FC = () => {
  const navElementPages = ["Dashboard", "Financials", "Analytics"];
  const navElementProduct = ["Integrations & API", "Settings & Administration"];
  const button = "text-left px-3 py-2 rounded hover:bg-gray-100";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="text-xl font-bold mb-6"> Dashboard </div>
      <nav className="flex flex-col space-y-2 flex-grow">
        {navElementPages.map((navEl: string, idx: number) => {
          return (
            <button key={idx} className={`${button}`}>
              {" "}
              {navEl}{" "}
            </button>
          );
        })}
        <div className="mt-6 font-semibold text-gray-500 uppercase text-xs">
          Product
        </div>
        {navElementProduct.map((navEl: string, idx: number) => {
          return (
            <button key={idx} className={`${button}`}>
              {" "}
              {navEl}{" "}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Navbar;
