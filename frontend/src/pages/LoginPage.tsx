import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ChevronLeft,
  Search,
  Building2,
  Check,
  X,
  Info
} from 'lucide-react';
import { AuthPortal, UserSession } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess?: (session: UserSession) => void;
  onNavigateToDashboard?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToDashboard
}) => {
  const [portal, setPortal] = useState<AuthPortal>('faculty');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showCredentialGuide, setShowCredentialGuide] = useState(false);

  // Form states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ identifier?: string; password?: string }>({});

  // "Not your institute?" search & registration modal state
  const [showInstituteModal, setShowInstituteModal] = useState(false);
  const [instituteSearch, setInstituteSearch] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState('QIS College of Engineering and Technology');
  const [showRegisterInquiry, setShowRegisterInquiry] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', college: '', email: '' });

  const availableInstitutes = [
    { name: 'QIS College of Engineering and Technology', location: 'Ongole, Andhra Pradesh', code: 'QISCET', active: true },
    { name: 'QIS Institute of Technology', location: 'Ongole, Andhra Pradesh', code: 'QISIT', active: false },
    { name: 'Jawaharlal Nehru Technological University', location: 'Kakinada, Andhra Pradesh', code: 'JNTUK', active: false },
    { name: 'Andhra University College of Engineering', location: 'Visakhapatnam, Andhra Pradesh', code: 'AUCE', active: false },
    { name: 'Sri Venkateswara University College of Engineering', location: 'Tirupati, Andhra Pradesh', code: 'SVUCE', active: false }
  ];

  const filteredInstitutes = availableInstitutes.filter(inst =>
    inst.name.toLowerCase().includes(instituteSearch.toLowerCase()) ||
    inst.location.toLowerCase().includes(instituteSearch.toLowerCase()) ||
    inst.code.toLowerCase().includes(instituteSearch.toLowerCase())
  );

  const handlePortalSwitch = (newPortal: AuthPortal) => {
    setPortal(newPortal);
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationErrors({});
    setIdentifier('');
    setPassword('');
  };

  const handleQuickFill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setValidationErrors({});
    setErrorMsg(null);
  };

  const validateInputs = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier =
        portal === 'student'
          ? 'Student ID is required (e.g., STU001)'
          : 'Faculty ID or Username is required (e.g., FAC01)';
    }
    if (!password) {
      errors.password = 'Password is required to authenticate';
    } else if (password.length < 3) {
      errors.password = 'Password must be at least 3 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.login({
        portal,
        identifier: identifier.trim(),
        password
      });

      if (response.success && response.access_token) {
        setSuccessMsg(`Access Granted: Welcome, ${response.name}!`);
        const session: UserSession = {
          user_id: response.user_id,
          username: response.username,
          name: response.name,
          role: response.role,
          portal: response.portal,
          access_token: response.access_token
        };
        sessionStorage.setItem('thrive360_session', JSON.stringify(session));

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(session);
          } else if (onNavigateToDashboard) {
            onNavigateToDashboard();
          }
        }, 800);
      } else {
        setErrorMsg(response.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMsg(err.message || 'Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.college || !regForm.email) return;
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setShowRegisterInquiry(false);
      setRegForm({ name: '', college: '', email: '' });
      setShowInstituteModal(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Institutional Header Banner */}
      <header className="border-b border-slate-800/80 bg-[#060d1f] sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Top-left: Official QIS College of Engineering and Technology logo only */}
          <div className="flex items-center">
            <img
              src="/images/logo_header.jpg"
              alt="QIS College of Engineering and Technology"
              className="h-10 sm:h-12 w-auto max-h-12 object-contain rounded bg-white p-1 shadow-sm border border-slate-700/60"
            />
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-300 transition py-1.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Navy Welcome Section + Right Login Panel */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
        {/* Left Section: Clean Midnight Navy Welcome Section */}
        <section className="lg:col-span-7 xl:col-span-7 bg-[#071126] border-b lg:border-b-0 lg:border-r border-slate-800/80 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
          <div className="max-w-xl space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                Thrive360 Analytics Platform
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Smart Campus Analytics & Predictive Intelligence
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Empowering {selectedInstitute} with real-time academic health diagnostics,
              placement readiness telemetry, and deterministic risk early-warning intelligence.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Student 360° Health Diagnostics</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Comprehensive telemetry across academic performance, attendance, and behavioral signals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Placement Readiness Telemetry</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Multi-factor industry readiness assessments and skill competency evaluations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Proactive Mentorship Interventions</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Targeted guidance protocols and rapid faculty intervention workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Institutional Stat Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-8 max-w-md">
            <div className="bg-[#050b17] border border-slate-800 p-3.5 rounded-xl">
              <div className="text-2xl font-bold font-display text-cyan-400">250</div>
              <div className="text-[11px] text-slate-400 font-medium">Unified Scholars</div>
            </div>
            <div className="bg-[#050b17] border border-slate-800 p-3.5 rounded-xl">
              <div className="text-2xl font-bold font-display text-white">50</div>
              <div className="text-[11px] text-slate-400 font-medium">Faculty Mentors</div>
            </div>
            <div className="bg-[#050b17] border border-slate-800 p-3.5 rounded-xl">
              <div className="text-2xl font-bold font-display text-cyan-400">6</div>
              <div className="text-[11px] text-slate-400 font-medium">Core Disciplines</div>
            </div>
          </div>
        </section>

        {/* Right Section: Clean Login Panel */}
        <section className="lg:col-span-5 xl:col-span-5 bg-[#081226] p-6 sm:p-10 lg:p-12 flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Login Card Header */}
            <div className="space-y-1.5">
              <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                Welcome to Portal Access
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Authenticate with your official institutional account credentials to access academic diagnostic dashboards.
              </p>
            </div>

            {/* Portal Switcher Tabs (Faculty vs Student) */}
            <div className="p-1 bg-[#050b17] border border-slate-800 rounded-2xl grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handlePortalSwitch('faculty')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  portal === 'faculty'
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${portal === 'faculty' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>Faculty & Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('student')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  portal === 'student'
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${portal === 'student' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>Student Portal</span>
              </button>
            </div>

            {/* Quick Demo Credentials Autofill Banner */}
            <div className="p-3 bg-[#050b17] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Demo Accounts
                </span>
                <span className="text-[10px] text-slate-500">Click to autofill</span>
              </div>

              {portal === 'faculty' ? (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('FAC01', 'CampusFaculty2026!')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono transition cursor-pointer"
                  >
                    FAC01 (Mathematics Faculty)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('FAC21', 'CampusAdmin2026!')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono transition cursor-pointer"
                  >
                    FAC21 (Campus Admin)
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('STU001', 'CampusStudent2026!')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono transition cursor-pointer"
                  >
                    STU001 (Karthik Babu • IT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('STU003', 'CampusStudent2026!')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono transition cursor-pointer"
                  >
                    STU003 (Sneha Patel • MECH)
                  </button>
                </div>
              )}
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {portal === 'student' ? 'Student ID / Roll Number' : 'Faculty ID or Institutional Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value);
                      if (validationErrors.identifier) setValidationErrors({ ...validationErrors, identifier: undefined });
                    }}
                    placeholder={portal === 'student' ? 'e.g. STU001' : 'e.g. FAC01'}
                    disabled={loading}
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#050b17] border rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      validationErrors.identifier
                        ? 'border-rose-500/80 focus:ring-rose-400/30'
                        : 'border-slate-800 focus:border-cyan-400 focus:ring-cyan-400/20'
                    }`}
                  />
                </div>
                {validationErrors.identifier && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.identifier}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (validationErrors.password) setValidationErrors({ ...validationErrors, password: undefined });
                    }}
                    placeholder="Enter account password"
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-2.5 bg-[#050b17] border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      validationErrors.password
                        ? 'border-rose-500/80 focus:ring-rose-400/30'
                        : 'border-slate-800 focus:border-cyan-400 focus:ring-cyan-400/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me and Credential Guide link */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-400 focus:ring-offset-slate-900"
                  />
                  <span className="text-[11px]">Remember workstation session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowCredentialGuide(!showCredentialGuide)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer font-medium"
                >
                  Credential Guide
                </button>
              </div>

              {/* Collapsible Credential Guide Drawer */}
              {showCredentialGuide && (
                <div className="p-3 bg-[#050b17] border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300 animate-in fade-in duration-200">
                  <div className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Authentication Formats
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-4 list-disc">
                    <li><strong className="text-slate-200">Faculty/Admins:</strong> ID range <code className="text-cyan-300 font-mono">FAC01</code> to <code className="text-cyan-300 font-mono">FAC50</code>. Default: <code className="text-slate-200 font-mono">CampusFaculty2026!</code></li>
                    <li><strong className="text-slate-200">Campus Admin:</strong> Account <code className="text-cyan-300 font-mono">FAC21</code> with <code className="text-slate-200 font-mono">CampusAdmin2026!</code></li>
                    <li><strong className="text-slate-200">Scholars:</strong> Roll format <code className="text-cyan-300 font-mono">STU001</code> to <code className="text-cyan-300 font-mono">STU250</code>. Default: <code className="text-slate-200 font-mono">CampusStudent2026!</code></li>
                  </ul>
                </div>
              )}

              {/* Error Message Toast */}
              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-rose-300">Authentication Failed</span>
                    <span className="text-[11px] leading-relaxed block text-rose-200/90">{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Success Message Toast */}
              {successMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold">{successMsg}</span>
                </div>
              )}

              {/* Orange CTA Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-display text-xs font-bold tracking-wider text-white uppercase transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer ${
                  loading
                    ? 'bg-orange-600/70 cursor-wait'
                    : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.99]'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {portal === 'student' ? 'Student Portal' : 'Faculty Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* "Not your institute?" Search and Registration Flow */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setShowInstituteModal(true)}
                className="text-xs text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              >
                Not your institute?{' '}
                <span className="text-cyan-400 underline underline-offset-2">Search or register your campus</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* "Not your institute?" Modal Flow */}
      {showInstituteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#081226] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-base text-white">Campus Institution Directory</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInstituteModal(false);
                  setShowRegisterInquiry(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showRegisterInquiry ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={instituteSearch}
                    onChange={e => setInstituteSearch(e.target.value)}
                    placeholder="Search by college name, code, or city..."
                    className="w-full pl-9 pr-4 py-2 bg-[#050b17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredInstitutes.length > 0 ? (
                    filteredInstitutes.map((inst, idx) => {
                      const isCurrent = selectedInstitute === inst.name;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedInstitute(inst.name);
                            setShowInstituteModal(false);
                          }}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isCurrent
                              ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                              : 'bg-[#050b17] border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-2">
                              {inst.name}
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                {inst.code}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">{inst.location}</div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No matching institutions found.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Can&apos;t find your institution?</span>
                  <button
                    type="button"
                    onClick={() => setShowRegisterInquiry(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    Register your campus →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <p className="text-xs text-slate-300">
                  Register your college or university for Thrive360 campus intelligence:
                </p>

                {registerSuccess ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inquiry submitted! Our campus deployment team will reach out.</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#050b17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      required
                      placeholder="College / Institution Name"
                      value={regForm.college}
                      onChange={e => setRegForm({ ...regForm, college: e.target.value })}
                      className="w-full px-3 py-2 bg-[#050b17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Official Institutional Email"
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#050b17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRegisterInquiry(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs cursor-pointer shadow-md shadow-orange-500/20"
                      >
                        Submit Campus Registration
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="border-t border-slate-800/80 bg-[#060c19] px-6 py-3 text-center text-xs text-slate-500">
        <p>
          {selectedInstitute} • Thrive360 Smart Campus Analytics Platform
        </p>
      </footer>
    </div>
  );
};
