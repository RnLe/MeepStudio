import React from "react";
import CustomLucideIcon from "./CustomLucideIcon";

interface TabWindowDashboardProps {
  dashboardId: string;
}

const TabWindowDashboard: React.FC<TabWindowDashboardProps> = ({ dashboardId }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 text-gray-300">
      <CustomLucideIcon src="/icons/dashboard.svg" size={64} className="mb-4 text-gray-600" />
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-gray-500">Dashboard content coming soon...</p>
      <p className="text-xs text-gray-600 mt-4">ID: {dashboardId}</p>
    </div>
  );
};

export default TabWindowDashboard;
