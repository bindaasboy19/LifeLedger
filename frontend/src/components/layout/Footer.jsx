import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">LifeLedger Digital Blood Platform v1.1.0</span>
            <span className="text-slate-700">•</span>
            <span className="text-emerald-400">All systems operational</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-medium text-slate-400">
            <Link to="/dashboard" className="hover:text-red-400 transition">
              Emergency Hub
            </Link>
            <Link to="/dashboard?tab=profile" className="hover:text-red-400 transition">
              Account Profile
            </Link>
            <span className="text-slate-700">|</span>
            <span>&copy; {new Date().getFullYear()} LifeLedger. Intelligent Blood Ecosystem.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
