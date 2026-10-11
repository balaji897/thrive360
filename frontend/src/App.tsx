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

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const stored = sessionStorage.getItem('thrive360_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    try {
      const stored = sessionStorage.getItem('thrive360_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.portal === 'student') return 'student-dashboard';
        if (session.portal === 'faculty') return 'faculty-dashboard';
      }
    } catch {}
    return 'dashboard';
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

  // Route guarding
  useEffect(() => {
    if (currentUser?.portal === 'student') {
      if (currentTab !== 'student-dashboard' && currentTab !== 'login' && currentTab !== 'profile') {
        setAccessDeniedMessage(`Access restricted: Student account (${currentUser.user_id}) cannot access administrative or directory routes.`);
        setCurrentTab('student-dashboard');
      }
    } else if (currentUser?.portal === 'faculty') {
      if (currentTab === 'student-dashboard') {
        setAccessDeniedMessage('Access restricted: Faculty accounts cannot access the private student portal.');
        setCurrentTab('faculty-dashboard');
      }
    } else if (!currentUser) {
      if (currentTab === 'student-dashboard' || currentTab === 'faculty-dashboard') {
        setCurrentTab('login');
      }
    }
  }, [currentUser, currentTab]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setAccessDeniedMessage(null);
    setRefreshKey(k => k + 1);
    setCurrentTab('profile');
  };

  const handleNavigateToStudentsWithFilter = (filter?: { academic_risk?: string; placement_risk?: string }) => {
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
    setInterventionPrefill({ id, name, category, title, description, priority });
    setIsInterventionModalOpen(true);
  };

  const handleLoginSuccess = (session: UserSession) => {
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
  };

  if (currentTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToDashboard={() => {
          if (currentUser?.portal === 'student') {
            setCurrentTab('student-dashboard');
          } else if (currentUser?.portal === 'faculty') {
            setCurrentTab('faculty-dashboard');
          } else {
            setCurrentTab('dashboard');
          }
        }}
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
            if (tab === 'students') {
              setStudentDirectoryFilter(undefined);
            }
            // Enforce student guard on click
            if (currentUser?.portal === 'student' && tab !== 'student-dashboard' && tab !== 'login' && tab !== 'profile') {
              setAccessDeniedMessage(`Access restricted: Student account (${currentUser.user_id}) cannot access administrative or directory routes.`);
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
