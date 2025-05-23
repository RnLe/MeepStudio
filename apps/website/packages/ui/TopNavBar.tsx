import React from "react";

const TopNavBar: React.FC = () => (
  <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 px-2">
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded">File</button>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded">Edit</button>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded">View</button>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded">Help</button>
  </div>
);

export default TopNavBar;
