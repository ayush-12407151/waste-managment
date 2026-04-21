const tabButtons = document.querySelectorAll(".tab-button");
const forms = document.querySelectorAll(".auth-form");
const statusMessage = document.getElementById("status-message");
const roleButtons = document.querySelectorAll(".role-button");
const loginRoleInput = document.getElementById("login-role");
const signupRoleInput = document.getElementById("signup-role");
const loginTitle = document.getElementById("login-title");
const loginCopy = document.getElementById("login-copy");
const signupTitle = document.getElementById("signup-title");
const signupCopy = document.getElementById("signup-copy");
const dashboardRoutes = {
  user: "/dashboard/user/",
  worker: "/dashboard/worker/",
  admin: "/dashboard/admin/"
};

const roleContent = {
  user: {
    loginTitle: "User login",
    loginCopy: "Use your registered email to continue.",
    signupTitle: "Create user account",
    signupCopy: "Register once to start submitting pickup requests."
  },
  worker: {
    loginTitle: "Worker login",
    loginCopy: "Sign in to manage assigned pickups and update field status.",
    signupTitle: "Create worker account",
    signupCopy: "Register as a worker to receive route and collection assignments."
  },
  admin: {
    loginTitle: "Admin login",
    loginCopy: "Sign in to supervise requests, workers, and cleanup operations.",
    signupTitle: "Create admin account",
    signupCopy: "Create an admin account to manage city-wide waste operations."
  }
};

let activeRole = "user";
const pathnameParts = window.location.pathname.split("/").filter(Boolean);
const roleFromPath =
  pathnameParts[0] === "login" || pathnameParts[0] === "register"
    ? pathnameParts[1]
    : "";
let activeTab = "login";

const setStatus = (message, type) => {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
};

const syncHistory = () => {
  const url = new URL(window.location.href);
  url.pathname = `/${activeTab}/${activeRole}`;
  url.search = "";
  url.hash = activeTab === "signup" ? "#signup-form" : "";
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
};

const activateTab = (targetTab) => {
  activeTab = targetTab;
  tabButtons.forEach((item) => item.classList.remove("active"));
  forms.forEach((form) => form.classList.remove("active"));

  document.querySelector(`[data-tab="${targetTab}"]`).classList.add("active");
  document.getElementById(`${targetTab}-form`).classList.add("active");
  syncHistory();
  setStatus("", "");
};

const syncRoleUI = (role) => {
  const normalizedRole = role === "customer" ? "user" : role;
  const selectedRole = roleContent[normalizedRole] ? normalizedRole : "user";
  activeRole = selectedRole;

  roleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.role === selectedRole);
  });

  if (loginRoleInput) {
    loginRoleInput.value = selectedRole;
  }

  if (signupRoleInput) {
    signupRoleInput.value = selectedRole;
  }

  if (loginTitle) {
    loginTitle.textContent = roleContent[selectedRole].loginTitle;
  }

  if (loginCopy) {
    loginCopy.textContent = roleContent[selectedRole].loginCopy;
  }

  if (signupTitle) {
    signupTitle.textContent = roleContent[selectedRole].signupTitle;
  }

  if (signupCopy) {
    signupCopy.textContent = roleContent[selectedRole].signupCopy;
  }

  syncHistory();
  setStatus("", "");
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
  });
});

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    syncRoleUI(button.dataset.role);
  });
});

const roleFromUrl = new URLSearchParams(window.location.search).get("role");
syncRoleUI(roleFromPath || roleFromUrl || activeRole);

if (window.location.hash === "#signup-form" || pathnameParts[0] === "register") {
  activateTab("signup");
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    setStatus("Logging you in...", "");

    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setStatus(`Welcome back, ${data.user.name}. You are logged in as ${data.user.role}.`, "success");
    form.reset();
    syncRoleUI(activeRole);
    window.setTimeout(() => {
      window.location.replace(dashboardRoutes[data.user.role] || dashboardRoutes.user);
    }, 500);
  } catch (error) {
    setStatus(error.message, "error");
  }
});

document.getElementById("signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    setStatus("Creating your account...", "");

    const response = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "Signup failed");
    }

    setStatus(`${roleContent[activeRole].signupTitle} created successfully. You can log in now.`, "success");
    form.reset();
    syncRoleUI(activeRole);
    activateTab("login");
  } catch (error) {
    setStatus(error.message, "error");
  }
});
