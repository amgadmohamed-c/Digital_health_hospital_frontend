import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import SignIn from "./auth/signin";
import SignUp from "./auth/signup";
import AdminDashboard from "./admin/adminDashBoard";
import PatientDashboard from "./patient/patientDashPage";
import PatientNavBar from "./patient/patientNavBar";
import PatientSurgeries from "./patient/patientSurgeries";
import PatientAppointments from "./patient/patientAppointment";
import { authAPI, refreshAccessToken } from "../src/auth/api"; // adjust path if needed
import PatientProfile from "./patient/patientProfile";
import PatientChat from "./patient/patientChatWithDr";
import DoctorNavBar from "./doctor/doctorNavBar";
import NurseNavBar from "./nurse/nurseNavBar";
import DoctorDashboard from "./doctor/doctorDashPage";
import DoctorAppointments from "./doctor/doctorAppointments";

const router = createBrowserRouter([
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/patient/",
    element: <PatientNavBar />,
    children: [
      { index: true,                    element: <PatientDashboard />    },
      { path: "/patient/surgeries",     element: <PatientSurgeries />    },
      { path: "/patient/appointments",  element: <PatientAppointments /> },
      {path: "/patient/profile",       element: <PatientProfile />      },
      {path: "/patient/chat",          element: <PatientChat />         }
    ],
  },
  {
    path: "/doctor/",
    element: <DoctorNavBar />,
    children: [
      { index: true,                    element: <DoctorDashboard />    },
      {path: "/doctor/appointments",  element: <DoctorAppointments />  },
    ],
  },
  {
    path: "/nurse/",
    element: <NurseNavBar />,
  },
]);

function App() {
  // Block rendering until we know the auth state.
  // This prevents protected routes from firing API calls
  // before the token has been silently refreshed.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ── 1. Silent reauth on page load ──────────────────────────────
    const init = async () => {
      try {
        if (!authAPI.isAuthenticated()) {
          // Token is missing or expired — try to refresh silently
          await refreshAccessToken();
        }
      } catch {
        // Refresh failed (e.g. refresh token also expired).
        // Don't redirect here — let protected routes handle it
        // naturally, or the auth:logout event below will fire.
      } finally {
        setReady(true);
      }
    };

    init();

    // ── 2. Global logout listener ───────────────────────────────────
    // Your response interceptor dispatches "auth:logout" when a
    // mid-session refresh fails (401 that can't be recovered).
    const handleLogout = () => {
      window.location.href = "/signin";
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // Show nothing (or a spinner) while we check the token
  if (!ready) return null;

  return <RouterProvider router={router} />;
}

export default App;