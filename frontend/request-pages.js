const storedUser = localStorage.getItem("user");
const pageUser = storedUser ? JSON.parse(storedUser) : null;
const pageRole = document.body.dataset.role;
const pageType = document.body.dataset.page;
const pageDateLabel = document.getElementById("dashboard-date");
const pageUserNameLabel = document.getElementById("dashboard-user-name");
const pageUserRoleLabel = document.getElementById("dashboard-user-role");
const pageLogoutButton = document.getElementById("dashboard-logout");
const pageStatusMessage = document.getElementById("page-status-message");
const newRequestForm = document.getElementById("new-request-form");
const userRequestsTableBody = document.getElementById("user-requests-table-body");
const adminRequestsTableBody = document.getElementById("admin-requests-table-body");

const pageRoutes = {
  user: "/dashboard/user/",
  worker: "/dashboard/worker/",
  admin: "/dashboard/admin/"
};

const getStoredToken = () => localStorage.getItem("token");

const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

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

const setPageStatus = (message, type = "") => {
  if (!pageStatusMessage) {
    return;
  }

  pageStatusMessage.textContent = message;
  pageStatusMessage.className = `form-status ${type}`.trim();
};

const handleUnauthorizedResponse = (response) => {
  if (response.status !== 401) {
    return false;
  }

  clearStoredSession();
  window.location.replace(`/login/${pageRole || "user"}`);
  return true;
};

if (!pageUser || !pageUser.role) {
  window.location.replace(`/login/${pageRole || "user"}`);
}

if (pageUser && pageRole && pageUser.role !== pageRole) {
  window.location.replace(pageRoutes[pageUser.role] || "/login/user");
}

if (pageDateLabel) {
  pageDateLabel.textContent = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full"
  }).format(new Date());
}

if (pageUserNameLabel && pageUser) {
  pageUserNameLabel.textContent = pageUser.name || "Account";
}

if (pageUserRoleLabel && pageUser) {
  pageUserRoleLabel.textContent = `${pageUser.role} account`;
}

if (pageLogoutButton) {
  pageLogoutButton.addEventListener("click", () => {
    clearStoredSession();
    window.location.replace(`/login/${pageRole || "user"}`);
  });
}

const loadMyRequestsPage = async () => {
  if (pageType !== "my-requests" || !userRequestsTableBody) {
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
    setPageStatus("Loading your request history...");

    const response = await fetch("/api/requests/my", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (handleUnauthorizedResponse(response)) {
      return;
    }

    if (!response.ok) {
      throw new Error(data.msg || data.message || "Unable to load requests");
    }

    const requests = Array.isArray(data.allRequests) ? data.allRequests : [];

    if (requests.length === 0) {
      userRequestsTableBody.innerHTML = `
        <tr>
          <td colspan="4">No requests found for this account yet.</td>
        </tr>
      `;
      setPageStatus("No requests found yet.", "success");
      return;
    }

    userRequestsTableBody.innerHTML = requests
      .map((request) => `
        <tr>
          <td>${escapeHtml(formatRequestId(request._id))}</td>
          <td>${escapeHtml(request.description || request.location || "Request")}</td>
          <td><span class="status-pill ${getStatusTone(request.status)}">${escapeHtml(request.status || "Pending")}</span></td>
          <td>${escapeHtml(formatRequestDate(request.createdAt))}</td>
        </tr>
      `)
      .join("");

    setPageStatus(`Loaded ${requests.length} request(s).`, "success");
  } catch (error) {
    userRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="4">${escapeHtml(error.message)}</td>
      </tr>
    `;
    setPageStatus(error.message, "error");
  }
};

const loadAdminRequestsPage = async () => {
  if (pageType !== "admin-requests" || !adminRequestsTableBody) {
    return;
  }

  const token = getStoredToken();

  if (!token) {
    adminRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="5">Please log in again to view requests.</td>
      </tr>
    `;
    return;
  }

  try {
    setPageStatus("Loading all requests for admin review...");

    const response = await fetch("/api/requests", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (handleUnauthorizedResponse(response)) {
      return;
    }

    if (!response.ok) {
      throw new Error(data.msg || data.message || "Unable to load admin requests");
    }

    const requests = Array.isArray(data.allRequests) ? data.allRequests : [];

    if (requests.length === 0) {
      adminRequestsTableBody.innerHTML = `
        <tr>
          <td colspan="5">No requests are available yet.</td>
        </tr>
      `;
      setPageStatus("No requests available.", "success");
      return;
    }

    adminRequestsTableBody.innerHTML = requests
      .map((request) => `
        <tr>
          <td>${escapeHtml(formatRequestId(request._id))}</td>
          <td>${escapeHtml(request.description || "--")}</td>
          <td>${escapeHtml(request.location || "--")}</td>
          <td><span class="status-pill ${getStatusTone(request.status)}">${escapeHtml(request.status || "Pending")}</span></td>
          <td>${escapeHtml(request.assignedWorker || "Unassigned")}</td>
        </tr>
      `)
      .join("");

    setPageStatus(`Loaded ${requests.length} request(s).`, "success");
  } catch (error) {
    adminRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="5">${escapeHtml(error.message)}</td>
      </tr>
    `;
    setPageStatus(error.message, "error");
  }
};

if (newRequestForm) {
  newRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setPageStatus("Please log in again before submitting a request.", "error");
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
      setPageStatus("Description and location are required.", "error");
      return;
    }

    try {
      setPageStatus("Submitting request...");

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (handleUnauthorizedResponse(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error(data.msg || data.message || "Unable to submit request");
      }

      newRequestForm.reset();
      setPageStatus(`Request submitted successfully with ID ${formatRequestId(data.reqId)}.`, "success");
    } catch (error) {
      setPageStatus(error.message, "error");
    }
  });
}

loadMyRequestsPage();
loadAdminRequestsPage();
