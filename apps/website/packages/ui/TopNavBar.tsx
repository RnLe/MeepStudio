import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const TopNavBar: React.FC = () => (
  <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 px-2">
    <Link href="/" className="flex items-center px-3 py-1 text-white bg-gray-700 hover:bg-gray-600 rounded mr-2 transition-colors">
      <ArrowLeft size={16} className="mr-1" />
      <span>Home</span>
    </Link>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded cursor-not-allowed">File</button>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded cursor-not-allowed">Edit</button>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded cursor-not-allowed">View</button>
    <button className="px-3 py-1 text-white hover:bg-gray-700 rounded cursor-not-allowed">Help</button>
  </div>
);

export default TopNavBar;
