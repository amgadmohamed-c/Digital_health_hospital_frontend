import axios from "axios";

// ─── Token Management ─────────────────────────────────────────────────────────

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRY_KEY = "token_expiry";

// Store token with expiration
export const setTokenData = (accessToken, refreshToken, expiresIn) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresIn);
};

// Clear all token data
export const clearTokenData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Check if token is expired
export const isTokenExpired = () => {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;
  
  // Add 30 seconds buffer to avoid edge cases
  const expiryDate = new Date(expiryTime);
  const now = new Date();
  const bufferMs = 30 * 1000; // 30 seconds buffer
  
  return expiryDate.getTime() - bufferMs <= now.getTime();
};

// Get valid token or refresh if needed
export const getValidToken = async () => {
  let token = localStorage.getItem(TOKEN_KEY);
  
  if (!token || isTokenExpired()) {
    // Try to refresh the token
    token = await refreshAccessToken();
  }
  
  return token;
};

// Refresh the access token
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  
  try {
    const response = await axios.post("http://localhost:8000/reauth", { 
      token: refreshToken 
    });
    
    // Assuming the response structure matches your login response
    const { access_Token, expiresin, refresh_Token } = response.data;
    
    setTokenData(access_Token, refresh_Token || refreshToken, expiresin);
    
    return access_Token;
  } catch (error) {
    // Refresh failed - clear tokens and redirect to login
    clearTokenData();
    throw new Error("Session expired. Please login again.");
  }
};

// ─── Instance Setup with Interceptors ─────────────────────────────────────────

const API_URL = "http://localhost:8000/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  async (config) => {
    // Skip auth endpoints
    const skipAuthPaths = ["/login", "/signup", "/reauth"];
    if (skipAuthPaths.some(path => config.url?.includes(path))) {
      return config;
    }
    
    try {
      const token = await getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Token refresh failed - don't add authorization
      console.error("Failed to get valid token:", error.message);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const newToken = await refreshAccessToken();
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        clearTokenData();
        
        // Emit event for login redirect (can be listened to by your app)
        window.dispatchEvent(new CustomEvent("auth:logout"));
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ─── Auth API with token handling ─────────────────────────────────────────────

export const authAPI = {
  // Register a new patient account
  signup: (userData) => api.post("/signup", userData),
  
  // Login and receive access + refresh tokens
  login: async (credentials) => {
    const response = await api.post("/login", credentials);
    
    // Store tokens from response
    const { access_Token, expiresin, refresh_Token, role } = response.data;
    setTokenData(access_Token, refresh_Token, expiresin);
    
    // Add role to response for convenience
    return { ...response, data: { ...response.data, role } };
  },
  
  // Logout - clear tokens
  logout: () => {
    clearTokenData();
  },
  
  // Manual reauth (if needed)
  reauth: async () => {
    try {
      const newToken = await refreshAccessToken();
      return { access_Token: newToken };
    } catch (error) {
      throw new Error("Reauthentication failed");
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && !isTokenExpired();
  },
  
  // Get token info (for debugging)
  getTokenInfo: () => {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return {
      hasToken: !!localStorage.getItem(TOKEN_KEY),
      hasRefreshToken: !!localStorage.getItem(REFRESH_TOKEN_KEY),
      isExpired: isTokenExpired(),
      expiresAt: expiryTime,
    };
  },
};

// ─── Patient Profile API ────────────────────────────────────────────────────

export const patientAPI = {
  editProfile: (formData) => 
    api.put("/editprofile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMe: () => api.get("/patient/me"),
  getProfileById: (id) => api.get(`/patient/${id}/profile`),
};

// ─── Doctor API ─────────────────────────────────────────────────────────────

export const doctorAPI = {
  getAvailableSlots: (doctorId) => 
    api.get("/available/appointment/slots", { params: { doctorId } }), // Changed from data to params for GET
  bookAppointment: (appointmentData) => api.post("/new/appointment", appointmentData),
  cancelAppointment: (id, appointmentStatus) => 
    api.patch("/cancel/appointment", { id, appintmentStatus: appointmentStatus }),
  setAvailability: (doctorId, availabilityArray) => 
    api.put(`/${doctorId}/availability`, availabilityArray),
  updateVisitData: (appointmentId, visitData) => 
    api.put(`/appointment/${appointmentId}/visit-data`, visitData),
};

// ─── Admin API ──────────────────────────────────────────────────────────────

export const adminAPI = {
  createDoctor: (doctorData) => api.post("/createdoctor", doctorData),
  createNurse: (nurseData) => api.post("/createnurse", nurseData),
  getAllPatients: () => api.get("/get/patients/all"),
  getAllNurses: () => api.get("/get/nurses/all"),  

  getAllDoctors: () => api.get("/get/doctors/all"),
  deleteUser: (id) => api.delete(`/delete/${id}/user`),
};

// ─── Emergency API ──────────────────────────────────────────────────────────

export const emergencyAPI = {
  createCase: (caseData) => api.post("/emergency", caseData),
  getAllCases: () => api.get("/get/all/emergency"),
  getActiveCases: () => api.get("/get/active/emergency"),
  getCriticalCases: () => api.get("/get/critical/emergency"),
  updateStatus: (id, status) => api.patch("/update/emergency/", { id, status }),
};

// ─── Surgery API ────────────────────────────────────────────────────────────

export const surgeryAPI = {
  createSurgery: (surgeryData) => api.post("/create/surgery", surgeryData),
  cancelSurgery: (surgeryId) => api.delete(`/cancel/${surgeryId}`),
  updateNotes: (surgeryId, content) => api.put(`/${surgeryId}/notes`, { content }),
  getTodaySurgeries: () => api.get("/get/today/surgeries"),
};

// ─── Chat API ───────────────────────────────────────────────────────────────

export const chatAPI = {
  getSession: (appointmentId) => api.post("/chat/session", { appointmentId }),
  getMessages: (sessionId) => api.get(`/chat/session/${sessionId}/messages`),
};

// ─── React Hook for Auto-Reauth ──────────────────────────────────────────────

// Optional: React hook for components that need auth state
export const useAutoReauth = () => {
  const [isChecking, setIsChecking] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(authAPI.isAuthenticated());
  
  React.useEffect(() => {
    // Check token on mount
    const checkAuth = async () => {
      setIsChecking(true);
      try {
        if (authAPI.isAuthenticated()) {
          // Token is valid
          setIsAuthenticated(true);
        } else if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
          // Try to refresh
          await refreshAccessToken();
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
    
    // Listen for logout events
    const handleLogout = () => {
      setIsAuthenticated(false);
    };
    
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);
  
  return { isAuthenticated, isChecking, logout: authAPI.logout };
};

export default api;