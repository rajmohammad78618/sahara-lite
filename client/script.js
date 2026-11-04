// ---------- Settings ----------
const API_URL = 'http://localhost:5000/api/auth';

// ---------- HTML elements ----------
const loadingView = document.getElementById('loading-view');
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const messageBox = document.getElementById('message');

const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// ---------- Helper functions ----------
function showView(name) {
  loadingView.classList.toggle('hidden', name !== 'loading');
  authView.classList.toggle('hidden', name !== 'auth');
  dashboardView.classList.toggle('hidden', name !== 'dashboard');
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message ' + type; // "message error" ya "message success"
}

function clearMessage() {
  messageBox.textContent = '';
  messageBox.className = 'message';
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', isLogin);
  clearMessage();
}

// Backend ko request bhejne ka ek hi function.
// Agar token saved hai to wo apne aap Authorization header me jata hai.
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  try {
    const res = await fetch(API_URL + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: { message: 'Server se connect nahi ho paya. Backend chal raha hai?' },
    };
  }
}

// ---------- Check: user logged in hai ya nahi ----------
async function checkAuth() {
  const token = localStorage.getItem('token');

  if (!token) {
    showView('auth');
    return;
  }

  const result = await apiRequest('/profile');

  if (result.ok) {
    userName.textContent = result.data.user.name;
    userEmail.textContent = result.data.user.email;
    showView('dashboard');
    return;
  }

  // Token galat ya expire ho gaya
  if (result.status === 401) {
    localStorage.removeItem('token');
  }
  showView('auth');
  if (result.status !== 401) {
    showMessage(result.data.message, 'error');
  }
}

// ---------- Tabs ----------
tabLogin.addEventListener('click', () => switchTab('login'));
tabRegister.addEventListener('click', () => switchTab('register'));

// ---------- Register ----------
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  const result = await apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  btn.disabled = false;

  if (result.ok) {
    registerForm.reset();
    switchTab('login');
    document.getElementById('login-email').value = email;
    showMessage('Registration successful! Ab login karo.', 'success');
  } else {
    showMessage(result.data.message || 'Registration fail ho gaya', 'error');
  }
});

// ---------- Login ----------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const result = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  btn.disabled = false;

  if (result.ok) {
    localStorage.setItem('token', result.data.token);
    loginForm.reset();
    await checkAuth(); // profile API se user ka data lekar dashboard dikhayega
  } else {
    showMessage(result.data.message || 'Login fail ho gaya', 'error');
  }
});

// ---------- Logout ----------
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  userName.textContent = '';
  userEmail.textContent = '';
  switchTab('login');
  showView('auth');
});

// ---------- Page khulte hi ----------
checkAuth();