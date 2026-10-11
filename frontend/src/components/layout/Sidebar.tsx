import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  PieChart,
  LifeBuoy,
  FileCheck2,
  LogIn,
  ShieldCheck,
  Calendar,
  LogOut,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'faculty'
  | 'profile'
  | 'analytics'
  | 'interventions'
  | 'data-quality'
  | 'login'
  | 'student-dashboard'
  | 'faculty-dashboard';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedStudentId?: string | null;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  selectedStudentId,
  currentUser,
  onLogout
}) => {
  let navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string; desc: string }> = [];

  if (currentUser?.portal === 'student') {
    navItems = [
      {
        id: 'student-dashboard',
        label: 'My Student 360°',
        icon: <GraduationCap className="w-4 h-4" />,
        badge: currentUser.user_id,
        desc: 'Personal Diagnostics'
      },
      {
        id: 'login',
        label: 'Switch Portal',
        icon: <LogIn className="w-4 h-4" />,
        desc: 'Sign Out / Switch'
      }
    ];
  } else if (currentUser?.portal === 'faculty') {
    navItems = [
      {
        id: 'faculty-dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-4 h-4" />,
        badge: currentUser.user_id,
        desc: 'Assigned Cohort Triage'
      },
      {
        id: 'dashboard',
        label: 'Executive Overview',
        icon: <ShieldCheck className="w-4 h-4" />,
        desc: 'Campus Overview & Risk'
      },
      {
        id: 'students',
        label: 'Students',
        icon: <Users className="w-4 h-4" />,
        badge: '250',
        desc: 'Directory & Risk Filtering'
      },
      {
        id: 'faculty',
        label: 'Teachers',
        icon: <GraduationCap className="w-4 h-4" />,
        badge: '50',
        desc: 'Academic Staff Directory'
      },
      {
        id: 'profile',
        label: 'Student 360°',
        icon: <UserCheck className="w-4 h-4" />,
        badge: selectedStudentId ? selectedStudentId : undefined,
        desc: 'Individual Diagnostics'
      },
      {
        id: 'interventions',
        label: 'Events & Plans',
        icon: <LifeBuoy className="w-4 h-4" />,
        desc: 'Action Plans & Follow-ups'
      },
      {
        id: 'analytics',
        label: 'Finance & Analytics',
        icon: <PieChart className="w-4 h-4" />,
        desc: 'Institutional Segmentation'
      },
      {
        id: 'data-quality',
        label: 'Data Provenance',
        icon: <FileCheck2 className="w-4 h-4" />,
        desc: 'Dataset Ingestion & Audit'
      }
    ];
  } else {
    navItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-4 h-4" />,
        desc: 'Campus Overview & Risk'
      },
      {
        id: 'faculty-dashboard',
        label: 'Faculty Cohort',
        icon: <ShieldCheck className="w-4 h-4" />,
        desc: 'Assigned Mentorship'
      },
      {
        id: 'students',
        label: 'Students',
        icon: <Users className="w-4 h-4" />,
        badge: '250',
        desc: 'Directory & Risk Filtering'
      },
      {
        id: 'faculty',
        label: 'Teachers',
        icon: <GraduationCap className="w-4 h-4" />,
        badge: '50',
        desc: 'Academic Staff Directory'
      },
      {
        id: 'profile',
        label: 'Student 360°',
        icon: <UserCheck className="w-4 h-4" />,
        badge: selectedStudentId ? selectedStudentId : undefined,
        desc: 'Individual Diagnostics'
      },
      {
        id: 'interventions',
        label: 'Events & Plans',
        icon: <LifeBuoy className="w-4 h-4" />,
        desc: 'Action Plans & Follow-ups'
      },
      {
        id: 'analytics',
        label: 'Finance & Analytics',
        icon: <PieChart className="w-4 h-4" />,
        desc: 'Institutional Segmentation'
      },
      {
        id: 'data-quality',
        label: 'Data Provenance',
        icon: <FileCheck2 className="w-4 h-4" />,
        desc: 'Dataset Ingestion & Audit'
      },
      {
        id: 'login',
        label: 'Portal Sign-In',
        icon: <LogIn className="w-4 h-4" />,
        desc: 'Faculty & Student Access'
      }
    ];
  }

  return (
    <aside className="w-60 md:w-64 shrink-0 bg-[#5B52E0] text-white rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl shadow-indigo-950/30 transition-all select-none">
      <div className="space-y-5">
        {/* Top Logo / Brand (Edu-Center Model) */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-white text-[#5B52E0] flex items-center justify-center font-bold shadow-md shadow-indigo-900/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-[#5B52E0]" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-extrabold text-base tracking-tight leading-tight text-white flex items-center gap-1.5">
              <span>Edu-Center</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium tracking-wide">
              Thrive360 Campus
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
            Main Menu
          </p>

          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#5B52E0] font-bold shadow-lg shadow-indigo-900/20 translate-x-1'
                      : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={isActive ? 'text-[#5B52E0] shrink-0' : 'text-white/80 shrink-0'}>
                      {item.icon}
                    </div>
                    <span className="truncate leading-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`ml-2 shrink-0 px-2 py-0.5 text-[9px] font-mono font-bold rounded-lg ${
                        isActive
                          ? 'bg-[#5B52E0]/10 text-[#5B52E0]'
                          : 'bg-white/15 text-white/90'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Illustration & Profile Capsule (Edu-Center Model) */}
      <div className="space-y-3 pt-4 border-t border-white/10 mt-4">
        {/* Illustration Banner */}
        <div className="bg-white/10 rounded-2xl p-3 text-center relative overflow-hidden backdrop-blur-xs">
          <div className="w-8 h-8 rounded-full bg-white/20 mx-auto mb-1.5 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-[10px] font-semibold text-white">Thrive360 Analytics</p>
          <p className="text-[9px] text-white/70">© 2026 QISCET Campus</p>
        </div>

        {/* User Profile / Logout Capsule */}
        {currentUser ? (
          <div className="bg-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-2 border border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {currentUser.name.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[9px] text-white/70 truncate capitalize leading-tight">
                  {currentUser.role.toLowerCase()}
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                className="px-2 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[10px] font-semibold transition cursor-pointer shrink-0 border border-white/20"
              >
                Logout
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onTabChange('login')}
            className="w-full py-2 px-3 rounded-2xl bg-white text-[#5B52E0] text-xs font-bold shadow-md hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};
