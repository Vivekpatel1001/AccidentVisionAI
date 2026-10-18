import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-main text-text-main font-sans">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Navbar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-bg-main p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
