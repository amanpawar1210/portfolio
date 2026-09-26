import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Home, { LoadingScreen } from "./pages/Home";
import ProjectPage from "./pages/ProjectPage";
import NotFound from "./pages/NotFound";
import { PortfolioProvider, ThemeProvider, ToastProvider } from "./lib/context";

// The studio is private and much heavier — keep it out of the public bundle.
const OwnerLogin = lazy(() => import("./pages/OwnerLogin"));
const Studio = lazy(() => import("./pages/Studio"));

function PublicLayout() {
  return <PortfolioProvider><Outlet/></PortfolioProvider>;
}

const router = createBrowserRouter([
  { element: <PublicLayout/>, children: [
    { path: "/", element: <Home/> },
    { path: "/work/:id", element: <ProjectPage/> },
  ] },
  { path: "/owner-login", element: <Suspense fallback={<LoadingScreen/>}><OwnerLogin/></Suspense> },
  { path: "/studio", element: <Suspense fallback={<LoadingScreen/>}><Studio/></Suspense> },
  { path: "*", element: <NotFound/> },
]);

export default function App() {
  return <ThemeProvider><ToastProvider><RouterProvider router={router}/></ToastProvider></ThemeProvider>;
}
