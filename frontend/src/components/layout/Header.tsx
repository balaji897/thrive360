import React from 'react';
import { Sliders, LogIn, LogOut, UserCheck, Bell, Sparkles } from 'lucide-react';
import { UserSession } from '../../types';

interface HeaderProps {
  onOpenWeights: () => void;
  studentCount?: number;
  onNavigateToLogin?: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWeights,
  studentCount = 250,
  onNavigateToLogin,
  currentUser,
  onLogout
}) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg px-4 sm:px-6 py-2.5 flex items-center justify-between mb-3 shrink-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center">
          <img
            src="/images/logo_header.jpg"
            alt="QIS College of Engineering and Technology"
            className="h-8 sm:h-9 w-auto max-h-9 object-contain rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs"
          />
        </div>
        <div className="hidden sm:block border-l border-slate-200/80 pl-3.5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-[#1E1B4B] font-display">
              Thrive360 <span className="text-[#5B52E0]">Edu-Center</span>
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold bg-[#5B52E0]/10 text-[#5B52E0]">
              KPMG Hackathon
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
            QISCET Smart Campus Analytics Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#F4F5F9] text-slate-700 rounded-xl text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{studentCount} Verified Profiles</span>
        </div>

        <button
          onClick={onOpenWeights}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#5B52E0] bg-[#F4F5F9] hover:bg-slate-200/70 border border-transparent rounded-xl transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#5B52E0]" />
          <span>Score Weights</span>
        </button>

        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-[#F4F5F9] rounded-xl text-xs text-slate-700">
              <div className="w-6 h-6 rounded-lg bg-[#5B52E0] text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.charAt(0) || 'U'}
              </div>
              <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]">
                {currentUser.name}
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#5B52E0] hover:bg-[#4E46E5] rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal Sign-In</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
