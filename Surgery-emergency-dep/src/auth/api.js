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

// ─── Auth API ─────────────────────────────────────────────────────────────────

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

// ─── UI / Lookup Data API ─────────────────────────────────────────────────────
// No auth required — used to populate dropdowns, department lists, etc.

export const uiAPI = {
  // GET /fetchdata → { departments, specializations, ... }
  fetchData: () => api.get("/fetchdata"),
};

// ─── Patient Profile API ──────────────────────────────────────────────────────

export const patientAPI = {
  // PUT /editprofile  (multipart: profile image + record files)
  editProfile: (formData) =>
    api.put("/editprofile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // POST /patient/records  (multipart: record files + recordTitle)
  addRecord: (formData) =>
    api.post("/patient/records", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // GET /patient/me  → patient profile read from JWT (no id needed)
  getMe: () => api.get("/patient/me"),

  // GET /patient/:id/profile  → any patient profile by DB id
  getProfileById: (id) => api.get(`/patient/${id}/profile`),

  // GET /patient/:id/appointments  → patient reads own appointments;
  // the backend enforces ownership via JWT so :id is just for the route.
  getMyAppointments: (id) => api.get(`/patient/${id}/appointments`),

  // GET /available/doctors?department=  → open to all authenticated users
  getAvailableDoctors: (department) =>
    api.get("/available/doctors", { params: { department } }),
};

// ─── Doctor API ───────────────────────────────────────────────────────────────

export const doctorAPI = {
  // ── Profile ──────────────────────────────────────────────
  // GET /doctor/me
  getMe: () => api.get("/doctor/me"),

  // GET /doctor/:id/profile
  getProfileById: (id) => api.get(`/doctor/${id}/profile`),

  // PUT /editdoctorprofile  (multipart: profile image)
  editProfile: (formData) =>
    api.put("/editdoctorprofile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ── Appointments & Availability ───────────────────────────
  // POST /available/appointment/slots  → { doctorId }
  getAvailableSlots: (doctorId) =>
    api.post("/available/appointment/slots", { doctorId }),

  // POST /new/appointment
  bookAppointment: (appointmentData) =>
    api.post("/new/appointment", appointmentData),

  // PATCH /cancel/appointment  → { id, appintmentStatus }
  cancelAppointment: (id, appointmentStatus) =>
    api.patch("/cancel/appointment", { id, appintmentStatus: appointmentStatus }),

  // PUT /:doctorId/availability  → array of { dayOfWeek, startTime, endTime }
  setAvailability: (doctorId, availabilityArray) =>
    api.put(`/${doctorId}/availability`, availabilityArray),

  // PUT /appointment/:appointmentId/visit-data  → { diagnosis, notes }
  updateVisitData: (appointmentId, visitData) =>
    api.put(`/appointment/${appointmentId}/visit-data`, visitData),

  // GET /doctor/appointments/me
  getMyAppointments: () => api.get("/doctor/appointments/me"),

  // GET /available/doctors?department=
  getAvailableDoctors: (department) =>
    api.get("/available/doctors", { params: { department } }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminAPI = {
  // POST /createdoctor
  createDoctor: (doctorData) => api.post("/createdoctor", doctorData),

  // POST /createnurse
  createNurse: (nurseData) => api.post("/createnurse", nurseData),

  // GET /get/patients/all
  getAllPatients: () => api.get("/get/patients/all"),

  // GET /get/doctors/all
  getAllDoctors: () => api.get("/get/doctors/all"),

  // GET /get/nurses/all
  getAllNurses: () => api.get("/get/nurses/all"),

  // DELETE /delete/:id/user
  deleteUser: (id) => api.delete(`/delete/${id}/user`),

  // GET /doctor/:id/workload
  getDoctorWorkload: (id) => api.get(`/doctor/${id}/workload`),
};

// ─── Emergency API ────────────────────────────────────────────────────────────

export const emergencyAPI = {
  // POST /emergency
  createCase: (caseData) => api.post("/emergency", caseData),

  // GET /get/all/emergency
  getAllCases: () => api.get("/get/all/emergency"),

  // GET /get/active/emergency
  getActiveCases: () => api.get("/get/active/emergency"),

  // GET /get/critical/emergency
  getCriticalCases: () => api.get("/get/critical/emergency"),

  // PATCH /update/emergency/  → { id, status }
  // status: "WAITING" | "IN_TREATMENT" | "STABLE" | "ADMITTED" | "DISCHARGED"
  updateStatus: (id, status) => api.patch("/update/emergency/", { id, status }),
};

// ─── Surgery API ──────────────────────────────────────────────────────────────

export const surgeryAPI = {
  // POST /create/surgery
  createSurgery: (surgeryData) => api.post("/create/surgery", surgeryData),

  // DELETE /cancel/:surgeryId
  cancelSurgery: (surgeryId) => api.delete(`/cancel/${surgeryId}`),

  // PUT /:surgeryId/notes  → { content }
  updateNotes: (surgeryId, content) =>
    api.put(`/${surgeryId}/notes`, { content }),

  // GET /get/today/surgeries  (staff only)
  getTodaySurgeries: () => api.get("/get/today/surgeries"),

  // GET /get/my/surgeries  (authenticated doctor — reads from JWT)
  getDoctorSurgeries: () => api.get("/get/my/surgeries"),

  // GET /get/surgery/rooms  (staff only)
  getSurgeryRooms: () => api.get("/get/surgery/rooms"),

  // GET /patient/surgeries  (authenticated patient — reads from JWT)
  getPatientSurgeries: () => api.get("/patient/surgeries"),

  // Alias kept for backwards compatibility
  getMyStudentSurgeries: () => api.get("/patient/surgeries"),
};

// ─── Chat API ─────────────────────────────────────────────────────────────────

export const chatAPI = {
  // POST /chat/session  → { appointmentId }
  getSession: (appointmentId) => api.post("/chat/session", { appointmentId }),

  // GET /chat/session/:sessionId/messages
  getMessages: (sessionId) => api.get(`/chat/session/${sessionId}/messages`),
};

// ─── React Hook for Auto-Reauth ───────────────────────────────────────────────

export const useAutoReauth = () => {
  const [isChecking, setIsChecking] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(authAPI.isAuthenticated());
  
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      try {
        if (authAPI.isAuthenticated()) {
          setIsAuthenticated(true);
        } else if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
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
    
    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);
  
  return { isAuthenticated, isChecking, logout: authAPI.logout };
};

export default api;