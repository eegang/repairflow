import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ClientDashboard from "../pages/ClientDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import TechnicianDashboard from "../pages/TechnicianDashboard";
import ClientRequestsPage from "../pages/ClientRequestsPage";
import NewRequestPage from "../pages/NewRequestPage";
import RequestDetailPage from "../pages/RequestDetailPage";
import ManagerRequestsPage from "../pages/ManagerRequestsPage";
import TechnicianRequestsPage from "../pages/TechnicianRequestsPage";
import ManagerUsersPage from "../pages/ManagerUsersPage";

function PrivateRoute({ children, allowedRole }: { children: ReactElement; allowedRole: string }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== allowedRole) {
    const routeMap: Record<string, string> = {
      client: "/client/dashboard",
      manager: "/manager/dashboard",
      technician: "/technician/dashboard",
    };
    return <Navigate to={user ? routeMap[user.role] || "/login" : "/login"} />;
  }
  
  return children;
}

function SessionBootstrap() {
  const { isAuthenticated, token, user, setUser, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    let cancelled = false;

    authApi
      .getMe()
      .then((me) => {
        if (!cancelled && JSON.stringify(me) !== JSON.stringify(user)) {
          setUser(me);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          logout();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, logout, setUser, token, user]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionBootstrap />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/client/dashboard"
          element={
            <PrivateRoute allowedRole="client">
              <ClientDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/requests"
          element={
            <PrivateRoute allowedRole="client">
              <ClientRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/requests/new"
          element={
            <PrivateRoute allowedRole="client">
              <NewRequestPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/requests/:id"
          element={
            <PrivateRoute allowedRole="client">
              <RequestDetailPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute allowedRole="manager">
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/requests"
          element={
            <PrivateRoute allowedRole="manager">
              <ManagerRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/requests/:id"
          element={
            <PrivateRoute allowedRole="manager">
              <RequestDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/users"
          element={
            <PrivateRoute allowedRole="manager">
              <ManagerUsersPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/technician/dashboard"
          element={
            <PrivateRoute allowedRole="technician">
              <TechnicianDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/technician/requests"
          element={
            <PrivateRoute allowedRole="technician">
              <TechnicianRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/technician/requests/:id"
          element={
            <PrivateRoute allowedRole="technician">
              <RequestDetailPage />
            </PrivateRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

