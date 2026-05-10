import { HeartPulse } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

export default function PatientNavBar() {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/patient/" },
    { name: "My Surgeries", path: "/patient/surgeries" },
    { name: "Chat with Doctor", path: "/patient/chat" },
    { name: "Appointments", path: "/patient/appointments" },
    { name: "Profile", path: "/patient/profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <nav className="sticky top-4 z-50 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-r from-slate-900/95 via-blue-950/95 to-slate-900/95 border border-white/10 shadow-2xl rounded-3xl px-6 py-4">
          <div className="container mx-auto flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <HeartPulse className="text-white" size={22} />
              </div>

              <div>
                <span className="text-white text-xl font-bold">
                  MediCore
                </span>
              </div>
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
                        : "text-blue-100 hover:bg-white/10"
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

      {/* Child routes render here */}
      <Outlet />
    </div>
  );
}