const storedUser = localStorage.getItem("user");
const dashboardUser = storedUser ? JSON.parse(storedUser) : null;
const dashboardRole = document.body.dataset.role;
const dateLabel = document.getElementById("dashboard-date");
const userNameLabel = document.getElementById("dashboard-user-name");
const userRoleLabel = document.getElementById("dashboard-user-role");
const profileNameLabel = document.getElementById("dashboard-profile-name");
const profileRoleLabel = document.getElementById("dashboard-profile-role");
const logoutButton = document.getElementById("dashboard-logout");

const dashboardRoutes = {
  user: "/dashboard/user/",
  worker: "/dashboard/worker/",
  admin: "/dashboard/admin/"
};

if (!dashboardUser || !dashboardUser.role) {
  window.location.replace("/login/user");
}

if (dashboardUser && dashboardRole && dashboardUser.role !== dashboardRole) {
  const nextRoute = dashboardRoutes[dashboardUser.role] || "/login/user";
  window.location.replace(nextRoute);
}

if (dateLabel) {
  dateLabel.textContent = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full"
  }).format(new Date());
}

if (userNameLabel && dashboardUser) {
  userNameLabel.textContent = dashboardUser.name || "Account";
}

if (userRoleLabel && dashboardUser) {
  userRoleLabel.textContent = `${dashboardUser.role} account`;
}

if (profileNameLabel && dashboardUser) {
  profileNameLabel.textContent = dashboardUser.name || "Assigned field worker";
}

if (profileRoleLabel && dashboardUser) {
  profileRoleLabel.textContent = `${dashboardUser.role} account`;
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace(`/login/${dashboardRole || "user"}`);
  });
}
