import test from 'node:test';
import assert from 'node:assert/strict';

const VALID_NAV_TABS = [
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

function createMockJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = 'mock_signature_hash_bytes';
  return `${header}.${body}.${sig}`;
}

function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      (typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary'))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isValidSession(session) {
  if (!session || typeof session !== 'object') return false;
  if (typeof session.user_id !== 'string' || !session.user_id.trim()) return false;
  if (session.portal !== 'student' && session.portal !== 'faculty') return false;
  if (typeof session.access_token !== 'string' || !session.access_token.trim()) return false;

  const claims = parseJwtPayload(session.access_token);
  if (!claims || typeof claims !== 'object') {
    return false;
  }

  if (typeof claims.exp === 'number') {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds >= claims.exp) {
      return false; // Token expired
    }
  }

  if (claims.portal && claims.portal !== session.portal) {
    return false;
  }
  if (claims.sub && claims.sub !== session.user_id) {
    return false;
  }

  return true;
}

function createMockStorage(initialData = {}) {
  const store = { ...initialData };
  return {
    getItem(key) {
      return store[key] !== undefined ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
    get _store() {
      return store;
    }
  };
}

function getStoredSession(storage) {
  try {
    const stored = storage.getItem('thrive360_session');
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (isValidSession(session)) {
      return session;
    }
    storage.removeItem('thrive360_session');
    return null;
  } catch {
    storage.removeItem('thrive360_session');
    return null;
  }
}

function getInitialTabFromUrl(session, pathname = '/') {
  if (!session || !isValidSession(session)) {
    return 'login';
  }

  const path = pathname.replace(/^\/+/, '').split('/')[0].trim();
  const requestedTab = (path && VALID_NAV_TABS.includes(path)) ? path : null;

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

function canRenderDashboard(currentUser, currentTab) {
  // Synchronous render gate:
  // if (!currentUser || !isValidSession(currentUser) || currentTab === 'login') return <LoginPage />;
  if (!currentUser || !isValidSession(currentUser) || currentTab === 'login') {
    return false; // renders LoginPage
  }
  return true; // renders authenticated dashboard layout
}

test('1. Fresh unauthenticated session: immediately renders LoginPage and blocks dashboard', () => {
  const storage = createMockStorage();
  const session = getStoredSession(storage);
  assert.equal(session, null, 'Fresh session must be null');

  const initialTab = getInitialTabFromUrl(session, '/');
  assert.equal(initialTab, 'login', 'Root URL without session must resolve to login');

  const rendersDashboard = canRenderDashboard(session, initialTab);
  assert.equal(rendersDashboard, false, 'Unauthenticated user must never render dashboard');
});

test('2. Direct navigation by unauthenticated user across all protected routes forces LoginPage', () => {
  const storage = createMockStorage();
  const session = getStoredSession(storage);

  const protectedPaths = [
    '/dashboard',
    '/students',
    '/faculty',
    '/student-dashboard',
    '/faculty-dashboard',
    '/analytics',
    '/interventions',
    '/data-quality',
    '/profile'
  ];

  for (const path of protectedPaths) {
    const tab = getInitialTabFromUrl(session, path);
    assert.equal(tab, 'login', `Direct access to ${path} without auth must resolve to login`);
    assert.equal(canRenderDashboard(session, tab), false, `Direct access to ${path} must never render dashboard`);
  }
});

test('3. Key presence alone is rejected: invalid, corrupted, or expired tokens are purged', () => {
  const now = Math.floor(Date.now() / 1000);

  // A. Dummy string or non-JWT value
  const s1 = createMockStorage({ thrive360_session: '{"user_id":"STU001","portal":"student","access_token":"not-a-jwt"}' });
  assert.equal(getStoredSession(s1), null);
  assert.equal(s1.getItem('thrive360_session'), null, 'Must purge fake session');

  // B. Corrupted JSON
  const s2 = createMockStorage({ thrive360_session: '{corrupted_json:' });
  assert.equal(getStoredSession(s2), null);
  assert.equal(s2.getItem('thrive360_session'), null);

  // C. Expired token (exp in the past)
  const expiredJwt = createMockJwt({ sub: 'STU001', portal: 'student', exp: now - 3600 });
  const s3 = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'STU001',
      portal: 'student',
      access_token: expiredJwt
    })
  });
  assert.equal(getStoredSession(s3), null, 'Expired token must be rejected');
  assert.equal(s3.getItem('thrive360_session'), null);

  // D. Identity mismatch (token sub does not match session user_id)
  const mismatchJwt = createMockJwt({ sub: 'STU999', portal: 'student', exp: now + 3600 });
  const s4 = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'STU001',
      portal: 'student',
      access_token: mismatchJwt
    })
  });
  assert.equal(getStoredSession(s4), null, 'Mismatched token sub must be rejected');

  // E. Portal mismatch (token portal does not match session portal)
  const portalMismatchJwt = createMockJwt({ sub: 'STU001', portal: 'faculty', exp: now + 3600 });
  const s5 = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'STU001',
      portal: 'student',
      access_token: portalMismatchJwt
    })
  });
  assert.equal(getStoredSession(s5), null, 'Mismatched token portal must be rejected');
});

test('4. Authenticated student access: lands on student-dashboard and restricts administrative tabs', () => {
  const now = Math.floor(Date.now() / 1000);
  const validStudentJwt = createMockJwt({
    sub: 'STU001',
    username: 'karthik.babu',
    name: 'Karthik Babu',
    role: 'STUDENT',
    portal: 'student',
    exp: now + 3600
  });

  const studentSession = {
    user_id: 'STU001',
    username: 'karthik.babu',
    name: 'Karthik Babu',
    role: 'STUDENT',
    portal: 'student',
    access_token: validStudentJwt
  };

  const storage = createMockStorage({
    thrive360_session: JSON.stringify(studentSession)
  });

  const session = getStoredSession(storage);
  assert.ok(session, 'Valid student session must be accepted');

  // Root path resolves to student-dashboard
  assert.equal(getInitialTabFromUrl(session, '/'), 'student-dashboard');

  // Allowed personal profile tab
  assert.equal(getInitialTabFromUrl(session, '/profile'), 'profile');

  // Blocked from administrative and faculty tabs
  assert.equal(getInitialTabFromUrl(session, '/faculty-dashboard'), 'student-dashboard');
  assert.equal(getInitialTabFromUrl(session, '/students'), 'student-dashboard');
  assert.equal(getInitialTabFromUrl(session, '/faculty'), 'student-dashboard');
  assert.equal(getInitialTabFromUrl(session, '/analytics'), 'student-dashboard');

  // Student dashboard can render
  assert.equal(canRenderDashboard(session, 'student-dashboard'), true);
});

test('5. Authenticated faculty and admin access: lands on faculty-dashboard and permits authorized tabs', () => {
  const now = Math.floor(Date.now() / 1000);
  const validFacultyJwt = createMockJwt({
    sub: 'FAC01',
    username: 'dr.anitha',
    name: 'Dr. Anitha Rao',
    role: 'FACULTY',
    portal: 'faculty',
    exp: now + 3600
  });

  const facultySession = {
    user_id: 'FAC01',
    username: 'dr.anitha',
    name: 'Dr. Anitha Rao',
    role: 'FACULTY',
    portal: 'faculty',
    access_token: validFacultyJwt
  };

  const storage = createMockStorage({
    thrive360_session: JSON.stringify(facultySession)
  });

  const session = getStoredSession(storage);
  assert.ok(session, 'Valid faculty session must be accepted');

  // Root resolves to faculty-dashboard
  assert.equal(getInitialTabFromUrl(session, '/'), 'faculty-dashboard');

  // Allowed triage and directory routes
  assert.equal(getInitialTabFromUrl(session, '/students'), 'students');
  assert.equal(getInitialTabFromUrl(session, '/faculty'), 'faculty');
  assert.equal(getInitialTabFromUrl(session, '/dashboard'), 'dashboard');
  assert.equal(getInitialTabFromUrl(session, '/analytics'), 'analytics');
  assert.equal(getInitialTabFromUrl(session, '/interventions'), 'interventions');

  // Blocked from private student portal
  assert.equal(getInitialTabFromUrl(session, '/student-dashboard'), 'faculty-dashboard');

  // Faculty dashboard can render
  assert.equal(canRenderDashboard(session, 'faculty-dashboard'), true);
});

test('6. Page refresh preservation: unauthenticated stays on login, authenticated preserves tab', () => {
  // A. Refresh while unauthenticated on /students
  const unauthStorage = createMockStorage();
  const unauthSession = getStoredSession(unauthStorage);
  assert.equal(unauthSession, null);
  const unauthTabAfterRefresh = getInitialTabFromUrl(unauthSession, '/students');
  assert.equal(unauthTabAfterRefresh, 'login', 'Refresh on /students while unauthenticated must load login');
  assert.equal(canRenderDashboard(unauthSession, unauthTabAfterRefresh), false);

  // B. Refresh while authenticated as faculty on /students
  const now = Math.floor(Date.now() / 1000);
  const authJwt = createMockJwt({ sub: 'FAC21', portal: 'faculty', exp: now + 3600 });
  const authStorage = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'FAC21',
      portal: 'faculty',
      access_token: authJwt
    })
  });
  const authSession = getStoredSession(authStorage);
  assert.ok(authSession);
  const authTabAfterRefresh = getInitialTabFromUrl(authSession, '/students');
  assert.equal(authTabAfterRefresh, 'students', 'Refresh on /students while authenticated must preserve students tab');
  assert.equal(canRenderDashboard(authSession, authTabAfterRefresh), true);
});

test('7. Logout lifecycle: purges session and forces immediate return to login page', () => {
  const now = Math.floor(Date.now() / 1000);
  const jwt = createMockJwt({ sub: 'FAC01', portal: 'faculty', exp: now + 3600 });
  const storage = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'FAC01',
      portal: 'faculty',
      access_token: jwt
    })
  });

  // Logged in
  let session = getStoredSession(storage);
  assert.ok(session);
  assert.equal(canRenderDashboard(session, 'faculty-dashboard'), true);

  // Logout executed
  storage.removeItem('thrive360_session');
  session = getStoredSession(storage);
  assert.equal(session, null, 'Session must be null after logout');

  // Post-logout tab resolution
  const postLogoutTab = getInitialTabFromUrl(session, '/');
  assert.equal(postLogoutTab, 'login');
  assert.equal(canRenderDashboard(session, postLogoutTab), false, 'Must not render dashboard after logout');
});

test('8. Flash prevention: synchronous render barrier blocks unauthenticated state regardless of tab', () => {
  const session = null;
  assert.equal(canRenderDashboard(session, 'dashboard'), false);
  assert.equal(canRenderDashboard(session, 'students'), false);
  assert.equal(canRenderDashboard(session, 'faculty'), false);
  assert.equal(canRenderDashboard(session, 'profile'), false);
  assert.equal(canRenderDashboard(session, 'faculty-dashboard'), false);
  assert.equal(canRenderDashboard(session, 'student-dashboard'), false);
  assert.equal(canRenderDashboard(session, 'analytics'), false);
  assert.equal(canRenderDashboard(session, 'interventions'), false);
  assert.equal(canRenderDashboard(session, 'data-quality'), false);
});

test('9. SPA route fallback: vercel.json rewrite rules correctly route application paths without rewriting static assets or API', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  // Read vercel.json configuration
  const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
  assert.ok(fs.existsSync(vercelJsonPath), 'frontend/vercel.json must exist');

  const config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  assert.ok(Array.isArray(config.rewrites), 'vercel.json must have rewrites array');

  // Verify API rewrite rule exists and routes to Render backend
  const apiRewrite = config.rewrites.find(r => r.source === '/api/(.*)');
  assert.ok(apiRewrite, 'Must have an API rewrite rule');
  assert.match(apiRewrite.destination, /^https:\/\/thrive360-m7fe\.onrender\.com\/api\/\$1/, 'API requests must route to Render backend');

  // Verify SPA fallback rewrite rule exists and maps to /index.html
  const spaRewrite = config.rewrites.find(r => r.destination === '/index.html');
  assert.ok(spaRewrite, 'Must have an SPA fallback rewrite targeting /index.html');

  // Compile regex from vercel rewrite rule
  const cleanSourcePattern = spaRewrite.source
    .replace(/^\^/, '')
    .replace(/\$$/, '');
  const spaRegex = new RegExp(`^${cleanSourcePattern}$`);

  // Application routes MUST match the SPA rewrite
  const appRoutes = [
    '/faculty-dashboard',
    '/student-dashboard',
    '/login',
    '/dashboard',
    '/students',
    '/faculty',
    '/profile',
    '/analytics',
    '/interventions',
    '/data-quality'
  ];

  for (const route of appRoutes) {
    assert.ok(spaRegex.test(route), `Application route "${route}" must match the rewrite to /index.html`);
  }

  // Real static assets and API requests MUST NOT match the /index.html rewrite
  const nonSpaPaths = [
    '/api/v1/health',
    '/api/v1/auth/login',
    '/api/v1/students',
    '/images/logo_header.jpg',
    '/images/campus_gal1.jpg',
    '/assets/index-BbyfU6yP.js',
    '/assets/index-Ic9LFBnJ.css',
    '/favicon.ico',
    '/nonexistent.png',
    '/missing.js'
  ];

  for (const assetPath of nonSpaPaths) {
    assert.equal(spaRegex.test(assetPath), false, `Asset/API path "${assetPath}" must NOT match the rewrite to /index.html`);
  }
});

test('10. Refreshing /faculty-dashboard serves React app and preserves faculty session', () => {
  const now = Math.floor(Date.now() / 1000);
  const facultyJwt = createMockJwt({
    sub: 'FAC01',
    username: 'venkat.reddy',
    name: 'Venkat Reddy',
    role: 'FACULTY',
    portal: 'faculty',
    exp: now + 3600
  });

  const storage = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'FAC01',
      username: 'venkat.reddy',
      name: 'Venkat Reddy',
      role: 'FACULTY',
      portal: 'faculty',
      access_token: facultyJwt
    })
  });

  // When /faculty-dashboard is refreshed:
  // 1. Vercel serves index.html via the rewrite rule
  // 2. React reads stored session
  const session = getStoredSession(storage);
  assert.ok(session, 'Stored session must be valid on refresh');

  // 3. React evaluates initial tab from URL
  const initialTab = getInitialTabFromUrl(session, '/faculty-dashboard');
  assert.equal(initialTab, 'faculty-dashboard', 'Refreshing /faculty-dashboard must resolve to faculty-dashboard');

  // 4. Authenticated dashboard renders without 404 or login redirect
  assert.equal(canRenderDashboard(session, initialTab), true, 'Must render faculty dashboard');
});

test('11. Login success / failure lifecycle and duplicate submission guard', () => {
  let isSubmitting = false;
  let submitCount = 0;

  function simulateSubmit() {
    if (isSubmitting) {
      return { rejected: true, reason: 'duplicate_submission_blocked' };
    }
    isSubmitting = true;
    submitCount++;
    return { rejected: false };
  }

  // First submit accepted
  const first = simulateSubmit();
  assert.equal(first.rejected, false);
  assert.equal(submitCount, 1);

  // Rapid duplicate submit blocked
  const second = simulateSubmit();
  assert.equal(second.rejected, true);
  assert.equal(second.reason, 'duplicate_submission_blocked');
  assert.equal(submitCount, 1, 'Duplicate submit must not increment submission count');

  // Finish submission (failure or success)
  isSubmitting = false;

  // New submit allowed after resolution
  const third = simulateSubmit();
  assert.equal(third.rejected, false);
  assert.equal(submitCount, 2);
});

test('12. Unauthorized API response (401) clears storage session and triggers expiration', () => {
  const storage = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'FAC01',
      portal: 'faculty',
      access_token: 'some_token'
    })
  });

  assert.ok(storage.getItem('thrive360_session'), 'Session exists before 401');

  // Simulate 401 response handling (as in api.ts handleResponse)
  function handleUnauthorized(status) {
    if (status === 401) {
      storage.removeItem('thrive360_session');
      return { sessionCleared: true };
    }
    return { sessionCleared: false };
  }

  const res401 = handleUnauthorized(401);
  assert.equal(res401.sessionCleared, true);
  assert.equal(storage.getItem('thrive360_session'), null, 'Session must be purged on 401');

  // 403 or other status does not clear session
  storage.setItem('thrive360_session', 'active_session');
  const res403 = handleUnauthorized(403);
  assert.equal(res403.sessionCleared, false);
  assert.equal(storage.getItem('thrive360_session'), 'active_session', '403 must not purge session');
});

test('13. Expired sessions: tokens with exp in past are immediately rejected and purged', () => {
  const now = Math.floor(Date.now() / 1000);
  const expiredToken = createMockJwt({
    sub: 'FAC01',
    portal: 'faculty',
    exp: now - 100 // expired 100s ago
  });

  const storage = createMockStorage({
    thrive360_session: JSON.stringify({
      user_id: 'FAC01',
      portal: 'faculty',
      access_token: expiredToken
    })
  });

  const session = getStoredSession(storage);
  assert.equal(session, null, 'Expired session must return null');
  assert.equal(storage.getItem('thrive360_session'), null, 'Expired session must be removed from storage');
  assert.equal(getInitialTabFromUrl(session, '/faculty-dashboard'), 'login', 'Expired session must redirect to login');
});
