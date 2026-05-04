import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import SignIn from "./auth/signin";

function App() {

   const router = createBrowserRouter([{
    path: "/signin",
    element: <SignIn />
  }
   ])


  return (
    <RouterProvider router={router} />
   )
}
export default App

