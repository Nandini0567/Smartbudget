const API_BASE_URL = "http://localhost:8080/api";

async function handleResponse(response) {
  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (data && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authService = {
  getUserId() {
    return localStorage.getItem("userId");
  },

  getUser() {
    return {
      userId: localStorage.getItem("userId"),
      name: localStorage.getItem("userName") || "User",
      email: localStorage.getItem("userEmail") || "",
    };
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem("userId"));
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(response);

    if (data && data.userId) {
      localStorage.setItem("userId", String(data.userId));
      if (data.name) localStorage.setItem("userName", data.name);
      if (data.email) localStorage.setItem("userEmail", data.email);
    }

    return data;
  },

  async register(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    return handleResponse(response);
  },

  logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
  },
};

export const dashboardService = {
  async getSummary(userId) {
    const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
    return handleResponse(response);
  },

  async getCategoryExpenses(userId) {
    const response = await fetch(`${API_BASE_URL}/dashboard/${userId}/expenses`);
    return handleResponse(response);
  },

  async getMonthlySummary(userId) {
    const response = await fetch(`${API_BASE_URL}/dashboard/${userId}/monthly-summary`);
    return handleResponse(response);
  },
};

export const incomeService = {
  async getAll(userId) {
    const response = await fetch(`${API_BASE_URL}/incomes/${userId}`);
    return handleResponse(response);
  },

  async create(userId, income) {
    const response = await fetch(`${API_BASE_URL}/incomes/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(income),
    });
    return handleResponse(response);
  },

  async update(incomeId, userId, income) {
    const response = await fetch(`${API_BASE_URL}/incomes/${incomeId}/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(income),
    });
    return handleResponse(response);
  },

  async delete(incomeId, userId) {
    const response = await fetch(`${API_BASE_URL}/incomes/${incomeId}/${userId}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },
};

export const expenseService = {
  async getAll(userId) {
    const response = await fetch(`${API_BASE_URL}/expenses/${userId}`);
    return handleResponse(response);
  },

  async create(userId, expense) {
    const response = await fetch(`${API_BASE_URL}/expenses/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    return handleResponse(response);
  },

  async update(expenseId, userId, expense) {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    return handleResponse(response);
  },

  async delete(expenseId, userId) {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/${userId}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },
};

export const budgetService = {
  async getAll(userId) {
    const response = await fetch(`${API_BASE_URL}/budgets/${userId}`);
    return handleResponse(response);
  },

  async create(userId, budget) {
    const response = await fetch(`${API_BASE_URL}/budgets/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budget),
    });
    return handleResponse(response);
  },

  async update(budgetId, userId, budget) {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budget),
    });
    return handleResponse(response);
  },

  async delete(budgetId, userId) {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/${userId}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },

  async getAnalysis(userId) {
    const response = await fetch(`${API_BASE_URL}/budgets/analysis/${userId}`);
    return handleResponse(response);
  },
};
