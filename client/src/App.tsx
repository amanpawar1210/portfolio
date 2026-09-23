import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import OwnerLogin from "./pages/OwnerLogin";
import Studio from "./pages/Studio";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/owner-login" element={<OwnerLogin />} />
        <Route path="/studio" element={<Studio />} />
      </Routes>
    </BrowserRouter>
  );
}
