/* ============================================================
   auth.js — RetroZone Authentication Module
   ------------------------------------------------------------
   Handles:
     - Switching between Sign In / Register forms on login.html
     - Registering new users into localStorage
     - Logging users in (validates against stored users)
     - Session handling (current logged-in user)
     - Logout
     - Route-guard helper for pages that require a session

   STORAGE SCHEMA (localStorage)
   ------------------------------------------------------------
   "rz_users"   -> JSON array of user records:
                   [{ id, username, email, password, createdAt }]
   "rz_session" -> JSON object of the logged-in user (no password):
                   { id, username, email, createdAt }

   ⚠️ NOTE ON SECURITY
   ------------------------------------------------------------
   This is a client-side demo auth system. Passwords are stored
   in plain text inside localStorage, which is readable by anyone
   with access to the browser (and is per-browser, not synced
   across devices). This is fine for prototyping the UI/UX flow,
   but it is NOT secure and should NOT be used for real users or
   in production. A real implementation needs a server, password
   hashing (e.g. bcrypt), and HTTP-only session cookies or tokens.
   ============================================================ */

const USERS_KEY   = "rz_users";
const SESSION_KEY = "rz_session";

/* ----------------------------------------------------------
   STORAGE HELPERS
   ---------------------------------------------------------- */

/** Read all registered users from localStorage. */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist the full users array to localStorage. */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Get the currently logged-in user (or null). */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist the active session (user without password). */
function setSession(user) {
  const { password, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

/** Clear the active session. */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/* ----------------------------------------------------------
   ROUTE GUARD — call this on any page that requires a login
   ---------------------------------------------------------- */
export function requireAuth(redirectTo = "login.html") {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

/* ----------------------------------------------------------
   VALIDATION HELPERS
   ---------------------------------------------------------- */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setFieldError(errId, message) {
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = message || "";
}

function setFieldInvalid(inputEl, invalid) {
  if (inputEl) inputEl.classList.toggle("error", !!invalid);
}

function clearFormErrors(form) {
  if (!form) return;
  form.querySelectorAll(".field-error").forEach(el => { el.textContent = ""; });
  form.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
}

/* ----------------------------------------------------------
   REGISTER — creates a new user record
   ---------------------------------------------------------- */
function registerUser({ username, email, password }) {
  const users = loadUsers();

  const emailTaken = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailTaken) {
    return { ok: false, field: "register-email", message: "An account with this email already exists." };
  }

  const usernameTaken = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (usernameTaken) {
    return { ok: false, field: "register-username", message: "This username is already taken." };
  }

  const newUser = {
    id: "user-" + Date.now(),
    username,
    email,
    password, // plain text — demo only, see security note above
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  setSession(newUser);

  return { ok: true, user: newUser };
}

/* ----------------------------------------------------------
   LOGIN — validates credentials against stored users
   ---------------------------------------------------------- */
function loginUser({ email, password }) {
  const users = loadUsers();
  const match = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!match) {
    return { ok: false, field: "login-email", message: "No account found with this email." };
  }
  if (match.password !== password) {
    return { ok: false, field: "login-password", message: "Incorrect password. Please try again." };
  }

  setSession(match);
  return { ok: true, user: match };
}

/* ----------------------------------------------------------
   PAGE INIT — wires up login.html
   ---------------------------------------------------------- */
function initAuthPage() {
  const signInForm   = document.getElementById("signin-form");
  const registerForm = document.getElementById("register-form");
  const tabSignIn     = document.getElementById("tab-signin");
  const tabRegister   = document.getElementById("tab-register");

  if (!signInForm && !registerForm) return; // not on login.html

  // If already logged in, skip straight to profile
  if (getCurrentUser()) {
    window.location.href = "profile.html";
    return;
  }

  /* --- Tab switching between Sign In / Register --- */
  function showSignIn() {
    signInForm?.classList.remove("hidden");
    registerForm?.classList.add("hidden");
    tabSignIn?.classList.add("active");
    tabRegister?.classList.remove("active");
    clearFormErrors(signInForm);
  }

  function showRegister() {
    registerForm?.classList.remove("hidden");
    signInForm?.classList.add("hidden");
    tabRegister?.classList.add("active");
    tabSignIn?.classList.remove("active");
    clearFormErrors(registerForm);
  }

  tabSignIn?.addEventListener("click", showSignIn);
  tabRegister?.addEventListener("click", showRegister);

  // Links inside each form for switching ("Don't have an account? Register")
  document.getElementById("go-to-register")?.addEventListener("click", (e) => {
    e.preventDefault();
    showRegister();
  });
  document.getElementById("go-to-signin")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSignIn();
  });

  /* --- Sign In submit --- */
  signInForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(signInForm);

    const emailEl    = document.getElementById("login-email");
    const passwordEl = document.getElementById("login-password");

    const email    = emailEl?.value.trim() || "";
    const password = passwordEl?.value || "";

    let valid = true;
    if (!isValidEmail(email)) {
      setFieldError("err-login-email", "Please enter a valid email address.");
      setFieldInvalid(emailEl, true);
      valid = false;
    }
    if (password.length === 0) {
      setFieldError("err-login-password", "Please enter your password.");
      setFieldInvalid(passwordEl, true);
      valid = false;
    }
    if (!valid) return;

    const result = loginUser({ email, password });
    if (!result.ok) {
      const inputEl = document.getElementById(result.field);
      setFieldInvalid(inputEl, true);
      const errId = result.field === "login-email" ? "err-login-email" : "err-login-password";
      setFieldError(errId, result.message);
      return;
    }

    window.location.href = "profile.html";
  });

  /* --- Register submit --- */
  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(registerForm);

    const usernameEl = document.getElementById("register-username");
    const emailEl     = document.getElementById("register-email");
    const passwordEl  = document.getElementById("register-password");
    const confirmEl   = document.getElementById("register-confirm");

    const username = usernameEl?.value.trim() || "";
    const email     = emailEl?.value.trim() || "";
    const password  = passwordEl?.value || "";
    const confirm   = confirmEl?.value || "";

    let valid = true;

    if (username.length < 3) {
      setFieldError("err-register-username", "Username must be at least 3 characters.");
      setFieldInvalid(usernameEl, true);
      valid = false;
    }
    if (!isValidEmail(email)) {
      setFieldError("err-register-email", "Please enter a valid email address.");
      setFieldInvalid(emailEl, true);
      valid = false;
    }
    if (password.length < 6) {
      setFieldError("err-register-password", "Password must be at least 6 characters.");
      setFieldInvalid(passwordEl, true);
      valid = false;
    }
    if (confirm !== password) {
      setFieldError("err-register-confirm", "Passwords do not match.");
      setFieldInvalid(confirmEl, true);
      valid = false;
    }
    if (!valid) return;

    const result = registerUser({ username, email, password });
    if (!result.ok) {
      const inputEl = document.getElementById(result.field);
      setFieldInvalid(inputEl, true);
      const errId = "err-" + result.field;
      setFieldError(errId, result.message);
      return;
    }

    window.location.href = "profile.html";
  });
}

/* ----------------------------------------------------------
   PAGE INIT — wires up logout button on any page that has one
   (e.g. profile.html). Safe to run on every page.
   ---------------------------------------------------------- */
function initLogoutButton() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", () => {
    logout();
    window.location.href = "login.html";
  });
}

/* ----------------------------------------------------------
   BOOTSTRAP
   ---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initAuthPage();
  initLogoutButton();
});
