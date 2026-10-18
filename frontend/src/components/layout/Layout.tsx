import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-bg-main text-text-main font-sans flex flex-col selection:bg-accent-primary/20 selection:text-accent-primary">
      {/* Top Classic Navigation Header */}
      <Navbar />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Clean Reassuring Customer Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
