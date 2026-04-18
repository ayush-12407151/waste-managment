const tabButtons = document.querySelectorAll(".tab-button");
const forms = document.querySelectorAll(".auth-form");
const statusMessage = document.getElementById("status-message");

const setStatus = (message, type) => {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetTab = button.dataset.tab;

    tabButtons.forEach((item) => item.classList.remove("active"));
    forms.forEach((form) => form.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(`${targetTab}-form`).classList.add("active");
    setStatus("", "");
  });
});

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
    setStatus(`Welcome back, ${data.user.name}.`, "success");
    form.reset();
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

    setStatus("Account created successfully. You can log in now.", "success");
    form.reset();
    document.querySelector('[data-tab="login"]').click();
  } catch (error) {
    setStatus(error.message, "error");
  }
});
