import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { WeightConfigModal } from './components/layout/WeightConfigModal';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { FacultyPage } from './pages/FacultyPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { FacultyDashboardPage } from './pages/FacultyDashboardPage';
import { CreateInterventionModal } from './components/interventions/CreateInterventionModal';
import { UserSession } from './types';
import { api } from './services/api';

const VALID_NAV_TABS: NavTab[] = [
  'dashboard',
  'students',
  'faculty',
  'profile',
  'analytics',
  'interventions',
  'data-quality',
  'login',
  'student-dashboard',
  'faculty-dashboard'
];

/**
 * Safely decodes a JWT payload without external dependencies.
 */
export function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'function') return null;
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Validates that an object represents an authenticated UserSession.
 * Validates token structure, portal alignment, user ID match, and expiration timestamp.
 */
export function isValidSession(session: any): session is UserSession {
  if (!session || typeof session !== 'object') return false;
  if (typeof session.user_id !== 'string' || !session.user_id.trim()) return false;
  if (session.portal !== 'student' && session.portal !== 'faculty') return false;
  if (typeof session.access_token !== 'string' || !session.access_token.trim()) return false;

  // Validate the JWT token structure and expiration
  const claims = parseJwtPayload(session.access_token);
  if (!claims || typeof claims !== 'object') {
    return false;
  }

  // Check token expiration if present
  if (typeof claims.exp === 'number') {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds >= claims.exp) {
      return false; // Token has expired
    }
  }

  // Verify portal and identity match JWT claims
  if (claims.portal && claims.portal !== session.portal) {
    return false;
  }
  if (claims.sub && claims.sub !== session.user_id) {
    return false;
  }

  return true;
}

/**
 * Retrieves and validates the stored session from sessionStorage.
 * Cleans corrupted session records automatically.
 */
export function getStoredSession(): UserSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('thrive360_session');
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (isValidSession(session)) {
      return session;
    }
    sessionStorage.removeItem('thrive360_session');
    return null;
  } catch {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('thrive360_session');
      }
    } catch {}
    return null;
  }
}

/**
 * Resolves the initial active tab from the browser URL, strictly enforcing role boundaries.
 * Unauthenticated users always resolve to 'login'.
 */
export function getInitialTabFromUrl(session: UserSession | null): NavTab {
  if (!session || !isValidSession(session)) {
    return 'login';
  }

  let routeCandidate: string | null = null;
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].trim();
    if (path) {
      routeCandidate = path;
    } else if (window.location.hash) {
      routeCandidate = window.location.hash.replace(/^#[/]?/, '').split('/')[0].trim();
    }
  }

  const requestedTab = (routeCandidate && VALID_NAV_TABS.includes(routeCandidate as NavTab))
    ? (routeCandidate as NavTab)
    : null;

  if (session.portal === 'student') {
    if (requestedTab === 'student-dashboard' || requestedTab === 'profile') {
      return requestedTab;
    }
    return 'student-dashboard';
  }

  if (session.portal === 'faculty') {
    if (requestedTab && requestedTab !== 'student-dashboard' && requestedTab !== 'login') {
      return requestedTab;
    }
    return 'faculty-dashboard';
  }

  return 'login';
}

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    return getStoredSession();
  });

  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const session = getStoredSession();
    return getInitialTabFromUrl(session);
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU001');
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [studentDirectoryFilter, setStudentDirectoryFilter] = useState<{ academic_risk?: string; placement_risk?: string } | undefined>(undefined);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Intervention modal triggered from student detail and priority queue
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [interventionPrefill, setInterventionPrefill] = useState<{
    id: string;
    name: string;
    category?: string;
    title?: string;
    description?: string;
    priority?: string;
  }>({ id: '', name: '' });
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null);

  // Key to force re-render/refetch of active page when weights change
  const [refreshKey, setRefreshKey] = useState(0);

  // Strict route guarding
  useEffect(() => {
    if (!currentUser || !isValidSession(currentUser)) {
      if (currentTab !== 'login') {
        setCurrentTab('login');
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    if (currentUser.portal === 'student') {
      if (currentTab !== 'student-dashboard' && currentTab !== 'login' && currentTab !== 'profile') {
        setAccessDeniedMessage(`Access restricted: Student account (${currentUser.user_id}) cannot access administrative or directory routes.`);
        setCurrentTab('student-dashboard');
      }
    } else if (currentUser.portal === 'faculty') {
      if (currentTab === 'student-dashboard') {
        setAccessDeniedMessage('Access restricted: Faculty accounts cannot access the private student portal.');
        setCurrentTab('faculty-dashboard');
      }
    }
  }, [currentUser, currentTab]);

  // Synchronize browser URL with current tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetPath = (!currentUser || !isValidSession(currentUser) || currentTab === 'login')
      ? '/login'
      : `/${currentTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
  }, [currentTab, currentUser]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const stored = getStoredSession();
      if (!stored) {
        setCurrentUser(null);
        setCurrentTab('login');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.history.replaceState(null, '', '/login');
        }
        return;
      }
      setCurrentUser(stored);
      const tab = getInitialTabFromUrl(stored);
      setCurrentTab(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Multi-tab sync and 401 session expiry listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'thrive360_session') {
        if (!e.newValue) {
          setCurrentUser(null);
          setCurrentTab('login');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.history.replaceState(null, '', '/login');
          }
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (isValidSession(parsed)) {
              setCurrentUser(parsed);
              setCurrentTab(getInitialTabFromUrl(parsed));
            }
          } catch {}
        }
      }
    };

    const handleSessionExpired = () => {
      setCurrentUser(null);
      setCurrentTab('login');
      setAccessDeniedMessage('Your session has expired. Please log in again.');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('thrive360_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('thrive360_session_expired', handleSessionExpired);
    };
  }, []);

  // Background token verification with backend on mount/refresh
  useEffect(() => {
    if (currentUser?.access_token) {
      api.getCurrentUser(currentUser.access_token).catch((err: any) => {
        if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
          sessionStorage.removeItem('thrive360_session');
          setCurrentUser(null);
          setCurrentTab('login');
          setAccessDeniedMessage('Session expired or invalidated by server. Please sign in again.');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/login');
          }
        }
      });
    }
  }, []);

  const handleSelectStudent = (id: string) => {
    if (!currentUser || !isValidSession(currentUser)) {
      setCurrentTab('login');
      return;
    }
    setSelectedStudentId(id);
    setAccessDeniedMessage(null);
    setRefreshKey(k => k + 1);
    setCurrentTab('profile');
  };

  const handleNavigateToStudentsWithFilter = (filter?: { academic_risk?: string; placement_risk?: string }) => {
    if (!currentUser || !isValidSession(currentUser)) {
      setCurrentTab('login');
      return;
    }
    if (currentUser.portal === 'student') {
      setAccessDeniedMessage(`Access restricted: Student account (${currentUser.user_id}) cannot access administrative or directory routes.`);
      return;
    }
    setStudentDirectoryFilter(filter);
    setCurrentTab('students');
  };

  const handleWeightsUpdated = () => {
    setRefreshKey(k => k + 1);
  };

  const handleOpenInterventionModal = (
    id: string,
    name: string,
    category?: string,
    title?: string,
    description?: string,
    priority?: string
  ) => {
    if (!currentUser || !isValidSession(currentUser)) {
      setCurrentTab('login');
      return;
    }
    setInterventionPrefill({ id, name, category, title, description, priority });
    setIsInterventionModalOpen(true);
  };

  const handleLoginSuccess = (session: UserSession) => {
    sessionStorage.setItem('thrive360_session', JSON.stringify(session));
    setCurrentUser(session);
    setAccessDeniedMessage(null);
    if (session.portal === 'student') {
      setCurrentTab('student-dashboard');
    } else if (session.portal === 'faculty') {
      setCurrentTab('faculty-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Backend logout encountered error:', err);
    }
    sessionStorage.removeItem('thrive360_session');
    setCurrentUser(null);
    setAccessDeniedMessage(null);
    setCurrentTab('login');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
  };

  // Synchronous authentication gate: unauthenticated users ALWAYS see LoginPage with 0ms flash
  if (!currentUser || !isValidSession(currentUser) || currentTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToDashboard={
          currentUser && isValidSession(currentUser)
            ? () => {
                if (currentUser.portal === 'student') {
                  setCurrentTab('student-dashboard');
                } else if (currentUser.portal === 'faculty') {
                  setCurrentTab('faculty-dashboard');
                } else {
                  setCurrentTab('dashboard');
                }
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E124A] via-[#2A1B6D] to-[#3B2885] p-2.5 sm:p-4 lg:p-5 flex flex-col font-sans text-slate-800 relative selection:bg-[#5B52E0] selection:text-white">
      {/* Global Header */}
      <Header
        onOpenWeights={() => setIsWeightsModalOpen(true)}
        onNavigateToLogin={() => setCurrentTab('login')}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Access Denied Warning Toast/Banner */}
      {accessDeniedMessage && (
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-5 py-2.5 mb-3 flex items-center justify-between text-amber-200 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg">
              Protected Route Guard
            </span>
            <span>{accessDeniedMessage}</span>
          </div>
          <button
            onClick={() => setAccessDeniedMessage(null)}
            className="text-amber-200 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Notification Toast */}
      {successToastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl px-5 py-2.5 mb-3 flex items-center justify-between text-emerald-200 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-lg">
              Intervention Logged
            </span>
            <span className="font-medium">{successToastMessage}</span>
          </div>
          <button
            onClick={() => setSuccessToastMessage(null)}
            className="text-emerald-200 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Application Canvas (Edu-Center Model) */}
      <div className="flex-1 flex flex-col md:flex-row gap-3.5 sm:gap-4 lg:gap-5 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={tab => {
            if (!currentUser || !isValidSession(currentUser)) {
              setCurrentTab('login');
              return;
            }
            if (tab === 'students') {
              setStudentDirectoryFilter(undefined);
            }
            // Enforce student guard on click
            if (currentUser.portal === 'student' && tab !== 'student-dashboard' && tab !== 'login' && tab !== 'profile') {
              setAccessDeniedMessage(`Access restricted: Student account (${currentUser.user_id}) cannot access administrative or directory routes.`);
              return;
            }
            if (currentUser.portal === 'faculty' && tab === 'student-dashboard') {
              setAccessDeniedMessage('Access restricted: Faculty accounts cannot access the private student portal.');
              return;
            }
            setCurrentTab(tab);
          }}
          selectedStudentId={selectedStudentId}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Content Area (Floating Rounded White Container) */}
        <main className="flex-1 bg-white rounded-3xl md:rounded-[32px] p-5 sm:p-6 lg:p-7 shadow-2xl shadow-indigo-950/40 overflow-y-auto min-w-0 flex flex-col">
          {currentTab === 'student-dashboard' && (
            <StudentDashboardPage
              key={`student-dashboard-${refreshKey}`}
              onLogout={handleLogout}
            />
          )}

          {currentTab === 'faculty-dashboard' && (
            <FacultyDashboardPage
              key={`faculty-dashboard-${refreshKey}`}
              onLogout={handleLogout}
              onNavigateToStudentDetail={handleSelectStudent}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              key={`dashboard-${refreshKey}`}
              onSelectStudent={handleSelectStudent}
              onNavigateToStudents={handleNavigateToStudentsWithFilter}
              onOpenInterventionModal={handleOpenInterventionModal}
            />
          )}

          {currentTab === 'students' && (
            <StudentsPage
              key={`students-${refreshKey}`}
              onSelectStudent={handleSelectStudent}
              initialFilter={studentDirectoryFilter}
            />
          )}

          {currentTab === 'faculty' && (
            <FacultyPage
              key={`faculty-${refreshKey}`}
            />
          )}

          {currentTab === 'profile' && (
            <StudentDetailPage
              key={`profile-${selectedStudentId}-${refreshKey}`}
              studentId={selectedStudentId}
              onBack={() => {
                if (currentUser?.portal === 'faculty') {
                  setCurrentTab('faculty-dashboard');
                } else {
                  setCurrentTab('students');
                }
              }}
              onOpenInterventionModal={handleOpenInterventionModal}
              onSwitchStudent={id => {
                setSelectedStudentId(id);
                setAccessDeniedMessage(null);
                setRefreshKey(k => k + 1);
              }}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage
              key={`analytics-${refreshKey}`}
              onSelectStudent={handleSelectStudent}
            />
          )}

          {currentTab === 'interventions' && (
            <InterventionsPage
              key={`interventions-${refreshKey}`}
              onSelectStudent={handleSelectStudent}
            />
          )}

          {currentTab === 'data-quality' && (
            <DataQualityPage
              key={`data-quality-${refreshKey}`}
            />
          )}
        </main>
      </div>

      {/* Dynamic Weight Configuration Modal */}
      <WeightConfigModal
        isOpen={isWeightsModalOpen}
        onClose={() => setIsWeightsModalOpen(false)}
        onWeightsUpdated={handleWeightsUpdated}
      />

      {/* Intervention Modal */}
      <CreateInterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        onCreated={() => {
          setSuccessToastMessage(`Intervention successfully logged for ${interventionPrefill.name || interventionPrefill.id || 'student'}. Recorded in institutional intervention registry.`);
          setCurrentTab('interventions');
          setRefreshKey(k => k + 1);
          setTimeout(() => {
            setSuccessToastMessage(null);
          }, 6000);
        }}
        defaultStudentId={interventionPrefill.id}
        defaultStudentName={interventionPrefill.name}
        defaultCategory={interventionPrefill.category}
        defaultTitle={interventionPrefill.title}
        defaultDescription={interventionPrefill.description}
        defaultPriority={interventionPrefill.priority}
      />
    </div>
  );
};

export default App;
