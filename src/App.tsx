import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Users from "./pages/Users";
import ExcelenciaAdmin from "./pages/ExcelenciaAdmin";
import ExcelenciaUser from "./pages/ExcelenciaUser";
import PrivateRoute from "./components/PrivateRoute";
import { useAuthStore } from "./stores/authStore";
import "./index.css";

function Excelencia() {
  const user = useAuthStore((state) => state.user);
  
  if (user?.roleId === 1) {
    return <ExcelenciaAdmin />;
  }
  
  return <ExcelenciaUser />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/excelencia" element={
          <PrivateRoute>
            <Excelencia />
          </PrivateRoute>
        } />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute requiredRoleId={1}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <PrivateRoute requiredRoleId={1}>
              <Users />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}