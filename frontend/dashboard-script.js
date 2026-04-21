const storedUser = localStorage.getItem("user");
const dashboardUser = storedUser ? JSON.parse(storedUser) : null;
const dashboardRole = document.body.dataset.role;
const dateLabel = document.getElementById("dashboard-date");
const userNameLabel = document.getElementById("dashboard-user-name");
const userRoleLabel = document.getElementById("dashboard-user-role");
const profileNameLabel = document.getElementById("dashboard-profile-name");
const profileRoleLabel = document.getElementById("dashboard-profile-role");
const logoutButton = document.getElementById("dashboard-logout");
const openRequestsCount = document.getElementById("open-requests-count");
const completedRequestsCount = document.getElementById("completed-requests-count");
const rewardPointsCount = document.getElementById("reward-points-count");
const areaCleanlinessStatus = document.getElementById("area-cleanliness-status");
const userRequestsTableBody = document.getElementById("user-requests-table-body");
const newRequestForm = document.getElementById("new-request-form");
const newRequestStatus = document.getElementById("new-request-status");
const adminTotalRequestsCount = document.getElementById("admin-total-requests-count");
const adminPendingRequestsCount = document.getElementById("admin-pending-requests-count");
const adminInProgressRequestsCount = document.getElementById("admin-in-progress-requests-count");
const adminCompletedRequestsCount = document.getElementById("admin-completed-requests-count");
const adminRequestsTableBody = document.getElementById("admin-requests-table-body");
const adminPendingStatus = document.getElementById("admin-pending-status");
const adminInProgressStatus = document.getElementById("admin-in-progress-status");
const adminCompletedStatus = document.getElementById("admin-completed-status");
const adminTotalRequestsText = document.getElementById("admin-total-requests-text");
const adminPendingRequestsText = document.getElementById("admin-pending-requests-text");
const adminCompletedRequestsText = document.getElementById("admin-completed-requests-text");
const API_BASE_URL = "https://waste-managment-39g8.onrender.com";

const dashboardRoutes = {
  user: "/dashboard/user/",
  worker: "/dashboard/worker/",
  admin: "/dashboard/admin/"
};

const getStoredToken = () => localStorage.getItem("token");

const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
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

if (rewardPointsCount && dashboardUser) {
  rewardPointsCount.textContent = String(dashboardUser.points || 0);
}

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatRequestId = (id) => {
  if (!id) {
    return "--";
  }

  return `REQ-${String(id).slice(-4).toUpperCase()}`;
};

const formatRequestDate = (value) => {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsedDate);
};

const getStatusTone = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "completed") {
    return "green";
  }

  if (normalizedStatus === "in progress") {
    return "blue";
  }

  return "orange";
};

const renderUserRequests = (requests) => {
  if (!userRequestsTableBody) {
    return;
  }

  if (!Array.isArray(requests) || requests.length === 0) {
    userRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="4">No requests found for this account yet.</td>
      </tr>
    `;
    return;
  }

  userRequestsTableBody.innerHTML = requests
    .map((request) => {
      const requestType = request.description || request.location || "Request";
      const requestStatus = request.status || "Pending";

      return `
        <tr>
          <td>${escapeHtml(formatRequestId(request._id))}</td>
          <td>${escapeHtml(requestType)}</td>
          <td><span class="status-pill ${getStatusTone(requestStatus)}">${escapeHtml(requestStatus)}</span></td>
          <td>${escapeHtml(formatRequestDate(request.createdAt))}</td>
        </tr>
      `;
    })
    .join("");
};

const updateUserRequestSummary = (requests) => {
  if (!Array.isArray(requests)) {
    return;
  }

  const completedCount = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "completed"
  ).length;
  const openCount = requests.length - completedCount;

  if (openRequestsCount) {
    openRequestsCount.textContent = String(openCount);
  }

  if (completedRequestsCount) {
    completedRequestsCount.textContent = String(completedCount);
  }

  if (areaCleanlinessStatus) {
    if (requests.length === 0) {
      areaCleanlinessStatus.textContent = "New";
    } else if (openCount === 0) {
      areaCleanlinessStatus.textContent = "High";
    } else if (openCount <= 2) {
      areaCleanlinessStatus.textContent = "Good";
    } else {
      areaCleanlinessStatus.textContent = "Needs attention";
    }
  }
};

const setNewRequestStatus = (message, type = "") => {
  if (!newRequestStatus) {
    return;
  }

  newRequestStatus.textContent = message;
  newRequestStatus.className = `form-status ${type}`.trim();
};

const handleUnauthorizedDashboardResponse = (response) => {
  if (response.status !== 401) {
    return false;
  }

  clearStoredSession();
  window.location.replace(`/login/${dashboardRole || "user"}`);
  return true;
};

const loadUserRequests = async () => {
  if (dashboardRole !== "user" || !userRequestsTableBody) {
    return;
  }

  const token = getStoredToken();

  if (!token) {
    userRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="4">Please log in again to view your requests.</td>
      </tr>
    `;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/requests/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (handleUnauthorizedDashboardResponse(response)) {
      return;
    }

    if (!response.ok) {
      throw new Error(data.msg || data.message || "Unable to load requests");
    }

    const requests = Array.isArray(data.allRequests) ? data.allRequests : [];
    updateUserRequestSummary(requests);
    renderUserRequests(requests);
  } catch (error) {
    userRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="4">${escapeHtml(error.message)}</td>
      </tr>
    `;
  }
};

if (newRequestForm) {
  newRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setNewRequestStatus("Please log in again before submitting a request.", "error");
      window.location.replace("/login/user");
      return;
    }

    const formData = new FormData(newRequestForm);
    const payload = {
      description: String(formData.get("description") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      imageUrl: String(formData.get("imageUrl") || "").trim()
    };

    if (!payload.description || !payload.location) {
      setNewRequestStatus("Description and location are required.", "error");
      return;
    }

    try {
      setNewRequestStatus("Submitting your request...");

      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (handleUnauthorizedDashboardResponse(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error(data.msg || data.message || "Unable to submit request");
      }

      newRequestForm.reset();
      setNewRequestStatus("Request submitted successfully.", "success");
      await loadUserRequests();
    } catch (error) {
      setNewRequestStatus(error.message, "error");
    }
  });
}

const renderAdminRequests = (requests) => {
  if (!adminRequestsTableBody) {
    return;
  }

  if (!Array.isArray(requests) || requests.length === 0) {
    adminRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="4">No requests are available yet.</td>
      </tr>
    `;
    return;
  }

  adminRequestsTableBody.innerHTML = requests
    .slice(0, 8)
    .map((request) => {
      const requestStatus = request.status || "Pending";

      return `
        <tr>
          <td>${escapeHtml(formatRequestId(request._id))}</td>
          <td>${escapeHtml(request.location || "--")}</td>
          <td><span class="status-pill ${getStatusTone(requestStatus)}">${escapeHtml(requestStatus)}</span></td>
          <td>${escapeHtml(request.assignedWorker || "Unassigned")}</td>
        </tr>
      `;
    })
    .join("");
};

const updateAdminSummary = (requests) => {
  if (!Array.isArray(requests)) {
    return;
  }

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "pending"
  ).length;
  const inProgressRequests = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "in progress"
  ).length;
  const completedRequests = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "completed"
  ).length;

  if (adminTotalRequestsCount) {
    adminTotalRequestsCount.textContent = String(totalRequests);
  }

  if (adminPendingRequestsCount) {
    adminPendingRequestsCount.textContent = String(pendingRequests);
  }

  if (adminInProgressRequestsCount) {
    adminInProgressRequestsCount.textContent = String(inProgressRequests);
  }

  if (adminCompletedRequestsCount) {
    adminCompletedRequestsCount.textContent = String(completedRequests);
  }

  if (adminPendingStatus) {
    adminPendingStatus.textContent = `${pendingRequests} requests are waiting for review or assignment.`;
  }

  if (adminInProgressStatus) {
    adminInProgressStatus.textContent = `${inProgressRequests} requests are currently being processed.`;
  }

  if (adminCompletedStatus) {
    adminCompletedStatus.textContent = `${completedRequests} requests have already been completed.`;
  }

  if (adminTotalRequestsText) {
    adminTotalRequestsText.textContent = `${totalRequests} requests are currently recorded in the system.`;
  }

  if (adminPendingRequestsText) {
    adminPendingRequestsText.textContent = `${pendingRequests} requests are still waiting for action.`;
  }

  if (adminCompletedRequestsText) {
    adminCompletedRequestsText.textContent = `${completedRequests} requests are ready for reporting review.`;
  }
};

const loadAdminDashboard = async () => {
  if (dashboardRole !== "admin") {
    return;
  }

  const token = getStoredToken();

  if (!token) {
    window.location.replace("/login/admin");
    return;
  }

  try {
    const requestsResponse = await fetch(`${API_BASE_URL}/api/requests`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (handleUnauthorizedDashboardResponse(requestsResponse)) {
      return;
    }

    const requestsData = await requestsResponse.json();

    if (!requestsResponse.ok) {
      throw new Error(requestsData.msg || requestsData.message || "Unable to load admin requests");
    }

    const requests = Array.isArray(requestsData.allRequests) ? requestsData.allRequests : [];
    renderAdminRequests(requests);
    updateAdminSummary(requests);
  } catch (error) {
    if (adminRequestsTableBody) {
      adminRequestsTableBody.innerHTML = `
        <tr>
          <td colspan="4">${escapeHtml(error.message)}</td>
        </tr>
      `;
    }

    if (adminPendingStatus) {
      adminPendingStatus.textContent = error.message;
    }
  }
};

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    clearStoredSession();
    window.location.replace(`/login/${dashboardRole || "user"}`);
  });
}

loadUserRequests();
loadAdminDashboard();
