import React from "react";

/**
 * Searchbar component
 *
 * A simple search input field wrapped in a styled container.
 * Intended for use as a search bar in forms or pages.
 *
 * @component
 * @example
 * ```tsx
 * <Searchbar />
 * ```
 *
 * @returns {JSX.Element} A styled search input field
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
