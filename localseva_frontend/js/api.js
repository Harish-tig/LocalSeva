/**
 * API Configuration for Django DRF with JWT Authentication
 */
const API_BASE_URL = "http://127.0.0.1:8000/api/user/";

// JWT Token management
let accessToken = localStorage.getItem("accessToken");
let refreshToken = localStorage.getItem("refreshToken");

// ===== TOKEN MANAGEMENT =====

function saveTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userIsProvider");
}

function isAuthenticated() {
  return !!accessToken;
}

function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function apiRequest(endpoint, method = "GET", data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: getAuthHeaders(),
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized - token expired
    if (
      response.status === 401 &&
      !endpoint.includes("login") &&
      !endpoint.includes("refresh")
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        options.headers["Authorization"] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, options);
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
      // Refresh failed, redirect to login
      clearTokens();
      window.location.href = "index.html";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        // Not JSON response
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

async function refreshAccessToken() {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      saveTokens(data.access, refreshToken);
      return true;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
  }

  return false;
}

async function verifyToken() {
  if (!accessToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}token/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: accessToken }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// ===== AUTHENTICATION =====

async function login(username, password) {
  try {
    console.log(`Attempting login for username: ${username}`);

    const response = await fetch(`${API_BASE_URL}login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.detail || errorData.message || "Invalid credentials";
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Login successful, tokens received");

    saveTokens(data.access, data.refresh);

    // Save user info from login response
    if (data.user) {
      localStorage.setItem("userName", data.user.name || data.user.username);
      localStorage.setItem("userIsProvider", data.user.is_provider || false);
    }

    return { success: true, user: data.user || {} };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

async function signup(username, email, password) {
  try {
    console.log("Signing up user:", { username, email });

    const response = await fetch(`${API_BASE_URL}register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
        password2: password,
      }),
    });

    console.log(`Signup response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        console.log("Signup error data:", errorData);

        if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        }
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Signup successful, data received:", data);

    // Save tokens if provided
    if (data.access && data.refresh) {
      saveTokens(data.access, data.refresh);
      localStorage.setItem("userName", username);
      localStorage.setItem("userIsProvider", false);
    }

    return { success: true, user: data.user || data };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

async function logout() {
  try {
    if (refreshToken) {
      await apiRequest("logout/", "POST", { refresh_token: refreshToken });
    }
  } catch (error) {
    console.log("Logout API call failed");
  } finally {
    clearTokens();
  }
}

// ===== PROFILE FUNCTIONS =====

async function getProfile() {
  try {
    console.log("Fetching profile from API...");

    const response = await fetch(`${API_BASE_URL}profile/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("Profile response status:", response.status);

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to refresh
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          return await getProfile();
        } else {
          clearTokens();
          window.location.href = "index.html";
          throw new Error("Session expired. Please login again.");
        }
      }

      if (response.status === 404) {
        console.log("Profile not found - returning empty profile");
        return {
          username: localStorage.getItem("userName") || "User",
          email: "",
          avatar: null,
          bio: "",
          phone: "",
          location: "Kandivali",
          is_service_provider: false,
        };
      }

      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        // Not JSON response
      }
      throw new Error(`Failed to fetch profile: ${errorMessage}`);
    }

    const profileData = await response.json();
    console.log("Profile data received:", profileData);

    // Update localStorage with profile data
    if (profileData.username) {
      localStorage.setItem("userName", profileData.username);
    }
    if (profileData.is_service_provider !== undefined) {
      localStorage.setItem("userIsProvider", profileData.is_service_provider);
    }

    return profileData;
  } catch (error) {
    console.error("Error in getProfile:", error);
    throw error;
  }
}

async function updateProfile(profileData) {
  try {
    console.log("Updating profile with data:", profileData);

    let headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    let body;

    // Check if it's FormData (for file upload) or JSON
    if (profileData instanceof FormData) {
      // For FormData, let browser set Content-Type with boundary
      body = profileData;
    } else {
      // For JSON data
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(profileData);
    }

    const response = await fetch(`${API_BASE_URL}profile/`, {
      method: "PUT",
      headers: headers,
      body: body,
    });

    console.log("Update profile response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Failed to update profile";
      try {
        const errorData = await response.json();
        console.log("Update profile error details:", errorData);

        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "object") {
          // Try to get first error
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === "string") {
            errorMessage = firstError;
          }
        }
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const updatedProfile = await response.json();
    console.log("Profile updated successfully:", updatedProfile);

    // Update localStorage with new data if available
    if (updatedProfile.username) {
      localStorage.setItem("userName", updatedProfile.username);
    }
    if (updatedProfile.is_service_provider !== undefined) {
      localStorage.setItem(
        "userIsProvider",
        updatedProfile.is_service_provider
      );
    }

    return updatedProfile;
  } catch (error) {
    console.error("Error in updateProfile:", error);
    throw error;
  }
}

async function becomeProvider() {
  try {
    console.log("Converting to service provider...");

    const response = await fetch(`${API_BASE_URL}profile/become-provider/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Become provider response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Failed to become service provider";
      try {
        const errorData = await response.json();
        console.log("Become provider error details:", errorData);

        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Successfully became provider:", result);

    // Update localStorage
    localStorage.setItem("userIsProvider", "true");

    return result;
  } catch (error) {
    console.error("Error in becomeProvider:", error);
    throw error;
  }
}

// ===== SERVICES FUNCTIONS =====

async function getProviders(filters = {}) {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    if (filters.category) {
      params.append("category", filters.category);
    }

    if (filters.location) {
      params.append("location", filters.location);
    }

    if (filters.search) {
      params.append("search", filters.search);
    }

    const queryString = params.toString();
    const url = `providers/${queryString ? `?${queryString}` : ""}`;

    const providers = await apiRequest(url);
    return providers;
  } catch (error) {
    console.error("Error fetching providers:", error);
    throw error;
  }
}

async function getProviderById(id) {
  try {
    // Assuming endpoint is /api/user/providers/{id}/
    const provider = await apiRequest(`providers/${id}/`);
    console.log("Fetched provider by ID:", provider);
    return provider;
  } catch (error) {
    console.error("Error fetching provider by ID:", error);
    throw error;
  }
}

async function getServices(filters = {}) {
  try {
    // For compatibility with existing code, we'll use getProviders
    return await getProviders(filters);
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
}

// Get current user info
async function getCurrentUser() {
  try {
    // Since we have the profile endpoint, we can use that
    const profile = await getProfile();
    return profile;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Create a new booking
 */
async function createBooking(bookingData) {
  console.log("=== CREATE BOOKING API CALL ===");
  console.log("Input data (raw):", bookingData);
  console.log("Provider ID in input:", bookingData.provider_id);

  const API_BASE_URL = "http://127.0.0.1:8000/api/user/";
  const endpoint = `${API_BASE_URL}bookings/create/`;

  console.log("API Endpoint:", endpoint);

  try {
    // Get the accessToken from localStorage
    const token = localStorage.getItem("accessToken");

    console.log(
      "Access Token found:",
      token ? "Yes (length: " + token.length + ")" : "No"
    );

    if (!token) {
      console.error("No access token found in localStorage!");
      throw new Error("Authentication required. Please login first.");
    }

    // Handle provider_id - ensure it's a single value
    let providerIdValue = bookingData.provider_id;

    // If it's an array, take the first value
    if (Array.isArray(providerIdValue)) {
      console.warn("⚠️ WARNING: provider_id is an array. Taking first value.");
      providerIdValue = providerIdValue[0];
    }

    // Convert to number if it's a string
    if (providerIdValue && typeof providerIdValue === "string") {
      const num = parseInt(providerIdValue, 10);
      if (!isNaN(num)) {
        providerIdValue = num;
      }
    }

    // Check if providerIdValue is valid
    if (!providerIdValue || providerIdValue === "") {
      console.error(
        "❌ ERROR: provider_id is empty or invalid:",
        providerIdValue
      );
      throw new Error("Provider ID is required and must be valid");
    }

    // Get provider username from bookingData
    const providerUsername = bookingData.provider_username || "";

    // Format the booking data according to API requirements
    // Now sending BOTH provider_id AND service_provider fields
    const formattedData = {
      provider_id: providerIdValue, // Required field
      service_provider: providerIdValue, // Additional field with same value
      description: bookingData.description || "",
      address: bookingData.address || "",
      scheduled_date: bookingData.scheduled_date,
      // Optional fields
      user_notes: bookingData.user_notes || "",
      service_category: bookingData.service_category || "",
    };

    // Add provider_username if available
    if (providerUsername) {
      formattedData.provider_username = providerUsername;
    }

    console.log("Formatted data being sent:", formattedData);

    // Make sure scheduled_date is in ISO format
    if (formattedData.scheduled_date) {
      const date = new Date(formattedData.scheduled_date);
      if (!isNaN(date.getTime())) {
        formattedData.scheduled_date = date.toISOString();
        console.log("Formatted scheduled_date:", formattedData.scheduled_date);
      } else {
        console.error("Invalid date format:", formattedData.scheduled_date);
        throw new Error("Invalid date format");
      }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formattedData),
    });

    console.log("Response status:", response.status);
    console.log("Response status text:", response.statusText);

    let responseData;
    try {
      responseData = await response.json();
      console.log("Response data (JSON):", responseData);
    } catch (e) {
      const text = await response.text();
      console.log("Response text:", text);
      responseData = { text: text };
    }

    if (!response.ok) {
      console.error("❌ API Error - Full response data:", responseData);

      let errorMessage = "Booking failed";
      let fieldErrors = [];

      if (responseData) {
        // Check for field-specific errors
        if (responseData.provider_id) {
          fieldErrors.push(
            `provider_id: ${
              Array.isArray(responseData.provider_id)
                ? responseData.provider_id.join(", ")
                : responseData.provider_id
            }`
          );
        }
        if (responseData.service_provider) {
          fieldErrors.push(
            `service_provider: ${
              Array.isArray(responseData.service_provider)
                ? responseData.service_provider.join(", ")
                : responseData.service_provider
            }`
          );
        }
        if (responseData.description) {
          fieldErrors.push(`description: ${responseData.description}`);
        }
        if (responseData.address) {
          fieldErrors.push(`address: ${responseData.address}`);
        }
        if (responseData.scheduled_date) {
          fieldErrors.push(`scheduled_date: ${responseData.scheduled_date}`);
        }
        if (responseData.non_field_errors) {
          fieldErrors.push(...responseData.non_field_errors);
        }
        if (responseData.detail) {
          errorMessage = responseData.detail;
        }

        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join("; ");
        }
      }

      console.error("API Error details:", errorMessage);

      // Handle specific status codes
      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        if (typeof clearTokens === "function") {
          clearTokens();
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
        alert("Session expired. Please login again.");
        window.location.href = "index.html";
      }

      throw new Error(errorMessage);
    }

    console.log("✅ Booking created successfully:", responseData);
    return responseData;
  } catch (error) {
    console.error("Fetch error in createBooking:", error);
    console.error("Error stack:", error.stack);

    // Handle network errors
    if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw error;
  }
}

// Make sure the api object includes createBooking
if (typeof window.api === "object") {
  window.api.createBooking = createBooking;
} else {
  window.api = {
    createBooking: createBooking,
    // Add other API functions if they don't exist
    getProviders:
      getProviders ||
      function () {
        console.error("getProviders not implemented");
        return Promise.resolve([]);
      },
    getProviderById:
      getProviderById ||
      function () {
        console.error("getProviderById not implemented");
        return Promise.resolve(null);
      },
    // Add other methods as needed
  };
}

/**
 * Get bookings for the current user
 * @returns {Promise} - Array of bookings
 */
async function getBookings() {
  try {
    return await apiRequest("bookings/", "GET");
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
}

// ===== EXPORT API FUNCTIONS =====

window.api = {
  // Authentication
  login,
  signup,
  logout,
  isAuthenticated,
  verifyToken,

  // Token management
  saveTokens,
  clearTokens,
  getAuthHeaders,

  // Profile
  getProfile,
  updateProfile,
  becomeProvider,

  // Services/Providers
  getServices,
  getProviders,
  getProviderById,
  getCurrentUser,

  // Bookings
  createBooking,
  getProviders,
  getProviderById,
  getBookings,
  // Core API function
  apiRequest,
};
