import React from "react";
/**
 * Renders a search input field allowing users to enter search queries.
 * The input is styled with a placeholder text "Search...".
 *
 * @returns {JSX.Element} A React element containing the search input.
 */
const Searchbar: React.FC = () => (
  <div className="flex items-center mb-6">
    <input
      type="search"
      placeholder="Search..."
      className="flex-grow border border-gray-300 rounded px-3 py-2"
    />
  </div>
);

export default Searchbar;
