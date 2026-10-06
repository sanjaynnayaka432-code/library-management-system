import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen aurora-bg text-slate-900 dark:text-slate-100 flex transition-colors duration-300 relative overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Dynamic Ambient Aurora Background Blobs */}
      <div className="glow-orb top-[-100px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-brand-600/30 to-violet-500/20" />
      <div className="glow-orb top-[10%] right-[-150px] w-[550px] h-[550px] bg-gradient-to-bl from-accent-cyan/25 to-blue-600/20" />
      <div className="glow-orb bottom-[-100px] left-[25%] w-[600px] h-[450px] bg-gradient-to-r from-accent-violet/20 via-pink-500/15 to-accent-emerald/15" />

      {/* Main Structural Layout */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
