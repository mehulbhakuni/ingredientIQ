import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home    from "./pages/Home";
import Login   from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Scan    from "./pages/Scan";
import Result  from "./pages/Result";
import History from "./pages/History";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile"  element={<Protected><Profile /></Protected>} />
        <Route path="/scan"     element={<Protected><Scan /></Protected>} />
        <Route path="/result"   element={<Protected><Result /></Protected>} />
        <Route path="/history"  element={<Protected><History /></Protected>} />
      </Routes>
    </Layout>
  );
}
