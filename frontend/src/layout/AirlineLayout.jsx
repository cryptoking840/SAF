import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const SidebarItem = ({ to, icon, label, isActive }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
          isActive
            ? 'bg-primary/20 border-l-4 border-primary text-primary'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

export default function AirlineLayout() {
  const navigate = useNavigate();
  const airlineName = localStorage.getItem('airlineName') || 'SkyBlue Airways';

  const handleLogout = () => {
    localStorage.removeItem("saf_auth");
    localStorage.removeItem("airlineName");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">flight_takeoff</span>
            </div>
            <div>
              <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-none">SAFc Wallet</h1>
              <p className="text-primary text-[10px] font-semibold tracking-wider uppercase mt-1">Carbon Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem to="/airline/dashboard" icon="dashboard" label="Dashboard" />
          <SidebarItem to="/airline/marketplace" icon="storefront" label="Marketplace" />
          <SidebarItem to="/airline/bids" icon="receipt_long" label="My Bids" />
          <SidebarItem to="/airline/certificates" icon="verified_user" label="Certificates" />

          <div className="pt-8 pb-2 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Settings
          </div>
          <SidebarItem to="/airline/wallet" icon="account_balance_wallet" label="Wallet Setup" />
          <SidebarItem to="/airline/settings" icon="settings" label="Preferences" />
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <img
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8_OktQC2R-bg66GP_mFxRWQnhND4VNe2zejs_69kJsvECFHZ5nBoaXGbo7ynpJrdbybvSqSUrN0V675etsdK6WnRUdlzcbZjlU926dlcUcxzLYHkZC2y-uepNWnWm24NDmyqs6gvu1BVI-jwFv2Nm5FpkKARm7g3p1PEitLg1Psd_nlYibj4ic3wMXmK_dnjJiQiLQeRXXHYTaYWJyGij4x3MibVwBpgd3Up1NxI4MyIcgvfvlC4AsNsa84MH02HjHP5SBMjl4TDz"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{airlineName}</p>
              <p className="text-xs text-slate-500 truncate">Admin Account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
