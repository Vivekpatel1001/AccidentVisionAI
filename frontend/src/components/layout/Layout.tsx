import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Classic Navigation Header */}
      <Navbar />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 min-w-0">
        <Outlet />
      </main>

      {/* Clean Reassuring Customer Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
