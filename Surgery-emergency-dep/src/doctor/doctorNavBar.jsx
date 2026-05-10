import { Stethoscope } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

export default function DoctorNavBar() {
  const location = useLocation();

  const navLinks = [
    { name: "Home",     path: "/doctor/" },
    { name: "Appointments",  path: "/doctor/appointments" },
    {name : "patientChat" ,  path: "/doctor/chat"},
    { name: "Availability",  path: "/doctor/availability" },
    { name: "Surgeries",     path: "/doctor/surgeries" },
    { name: "Profile",       path: "/doctor/profile" },
    
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <nav className="sticky top-4 z-50 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-r from-slate-900/95 via-violet-950/95 to-slate-900/95 border border-white/10 shadow-2xl rounded-3xl px-6 py-4">
          <div className="container mx-auto flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                <Stethoscope className="text-white" size={22} />
              </div>
              <span className="text-white text-xl font-bold">MediCore</span>
            </div>

            <div className="flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-5 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-white text-slate-900"
                        : "text-violet-100 hover:bg-white/10"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}