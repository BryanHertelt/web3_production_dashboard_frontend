import React from "react";

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
