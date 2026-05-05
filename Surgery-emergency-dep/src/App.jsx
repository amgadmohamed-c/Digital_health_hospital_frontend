import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import SignIn from "./auth/signin";
import SignUp from "./auth/signup";
import AdminDashboard from "./admin/adminDashBoard";

function App() {

   const router = createBrowserRouter([{
    path: "/signin",
    element: <SignIn />
  }, {
  path: "/signup",
  element: <SignUp />
  
  } , {
    path: "/admin/dashboard",
    element: <AdminDashboard />
  }
   ])


  return (
    <RouterProvider router={router} />
   )
}
export default App

