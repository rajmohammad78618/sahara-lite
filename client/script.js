// ---------- Settings ----------
const API_URL = 'http://localhost:5000/api';

// Logged-in user ki id (checkAuth me set hoti hai)
let currentUserId = null;

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

const requestForm = document.getElementById('request-form');
const requestMessage = document.getElementById('request-message');
const requestsList = document.getElementById('requests-list');

// ---------- Helper functions ----------
function showView(name) {
  loadingView.classList.toggle('hidden', name !== 'loading');
  authView.classList.toggle('hidden', name !== 'auth');
  dashboardView.classList.toggle('hidden', name !== 'dashboard');
}

function setMessage(box, text, type) {
  box.textContent = text;
  box.className = 'message ' + type; // "message error" ya "message success"
}

function clearBox(box) {
  box.textContent = '';
  box.className = 'message';
}

function showMessage(text, type) {
  setMessage(messageBox, text, type);
}

function clearMessage() {
  clearBox(messageBox);
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

// ---------- Request ko fulfilled mark karna ----------
async function fulfillRequest(id, btn) {
  btn.disabled = true;
  clearBox(requestMessage);

  const result = await apiRequest('/requests/' + id + '/fulfill', {
    method: 'PATCH',
  });

  if (result.ok) {
    setMessage(requestMessage, 'Request fulfilled mark ho gayi!', 'success');
    loadRequests();
  } else if (result.status === 401) {
    localStorage.removeItem('token');
    showView('auth');
  } else {
    btn.disabled = false;
    setMessage(requestMessage, result.data.message || 'Request update nahi hui', 'error');
  }
}

// ---------- Request ko delete karna ----------
async function deleteRequest(id, btn) {
  const sure = confirm('Kya tum sach me ye request delete karna chahte ho?');
  if (!sure) {
    return;
  }

  btn.disabled = true;
  clearBox(requestMessage);

  const result = await apiRequest('/requests/' + id, {
    method: 'DELETE',
  });

  if (result.ok) {
    setMessage(requestMessage, 'Request delete ho gayi!', 'success');
    loadRequests();
  } else if (result.status === 401) {
    localStorage.removeItem('token');
    showView('auth');
  } else {
    btn.disabled = false;
    setMessage(requestMessage, result.data.message || 'Request delete nahi hui', 'error');
  }
}

// ---------- Help requests ki list ----------
function renderRequests(requests) {
  requestsList.innerHTML = '';

  if (requests.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-text';
    empty.textContent = 'Abhi koi open request nahi hai.';
    requestsList.appendChild(empty);
    return;
  }

  requests.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'request-item';

    const title = document.createElement('h3');
    title.textContent = r.title;

    const desc = document.createElement('p');
    desc.textContent = r.description;

    const meta = document.createElement('div');
    meta.className = 'request-meta';

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = r.category;
    meta.appendChild(badge);

    if (r.amount > 0) {
      const amount = document.createElement('span');
      amount.textContent = '₹' + r.amount;
      meta.appendChild(amount);
    }

    const by = document.createElement('span');
    const ownerName = r.createdBy && r.createdBy.name ? r.createdBy.name : 'Unknown';
    by.textContent = 'by ' + ownerName;
    meta.appendChild(by);

    const date = document.createElement('span');
    date.textContent = new Date(r.createdAt).toLocaleDateString('en-IN');
    meta.appendChild(date);

    item.appendChild(title);
    item.appendChild(desc);
    item.appendChild(meta);

    // Buttons sirf apni request par dikhenge
    const isMine =
      currentUserId && r.createdBy && r.createdBy._id === currentUserId;

    if (isMine) {
      const actions = document.createElement('div');
      actions.className = 'request-actions';

      const fulfillBtn = document.createElement('button');
      fulfillBtn.type = 'button';
      fulfillBtn.className = 'btn-small btn-fulfill';
      fulfillBtn.textContent = 'Fulfilled';
      fulfillBtn.addEventListener('click', () => fulfillRequest(r._id, fulfillBtn));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-small btn-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteRequest(r._id, deleteBtn));

      actions.appendChild(fulfillBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(actions);
    }

    requestsList.appendChild(item);
  });
}

async function loadRequests() {
  const result = await apiRequest('/requests');

  if (result.ok) {
    renderRequests(result.data.requests);
    return;
  }

  if (result.status === 401) {
    localStorage.removeItem('token');
    showView('auth');
    return;
  }

  requestsList.innerHTML = '';
  const err = document.createElement('p');
  err.className = 'empty-text';
  err.textContent = result.data.message || 'Requests load nahi ho payi';
  requestsList.appendChild(err);
}

// ---------- Check: user logged in hai ya nahi ----------
async function checkAuth() {
  const token = localStorage.getItem('token');

  if (!token) {
    showView('auth');
    return;
  }

  const result = await apiRequest('/auth/profile');

  if (result.ok) {
    userName.textContent = result.data.user.name;
    userEmail.textContent = result.data.user.email;
    currentUserId = result.data.user._id || result.data.user.id;
    showView('dashboard');
    loadRequests();
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

  const result = await apiRequest('/auth/register', {
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

  const result = await apiRequest('/auth/login', {
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

// ---------- Naya help request submit karna ----------
requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearBox(requestMessage);

  const btn = requestForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  const title = document.getElementById('request-title').value.trim();
  const description = document.getElementById('request-description').value.trim();
  const category = document.getElementById('request-category').value;
  const amount = Number(document.getElementById('request-amount').value) || 0;

  const result = await apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify({ title, description, category, amount }),
  });

  btn.disabled = false;

  if (result.ok) {
    requestForm.reset();
    setMessage(requestMessage, 'Request submit ho gayi!', 'success');
    loadRequests();
  } else if (result.status === 401) {
    localStorage.removeItem('token');
    showView('auth');
  } else {
    setMessage(requestMessage, result.data.message || 'Request submit nahi hui', 'error');
  }
});

// ---------- Logout ----------
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  currentUserId = null;
  userName.textContent = '';
  userEmail.textContent = '';
  requestsList.innerHTML = '';
  clearBox(requestMessage);
  switchTab('login');
  showView('auth');
});

// ---------- Page khulte hi ----------
checkAuth();