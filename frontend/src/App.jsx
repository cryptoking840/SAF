import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import InspectionQueue from "./pages/inspector/InspectionQueue";
import InspectorAnalytics from "./pages/inspector/InspectorAnalytics";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import BatchManagement from "./pages/supplier/BatchManagement";
import Certificates from "./pages/supplier/Certificates";
import RegisterSAF from "./pages/supplier/RegisterSAF";
import InspectorDashboard from "./pages/inspector/InspectorDashboard";
import RegistryDashboard from "./pages/registry/RegistryDashboard";
import RegistryAuditLog from "./pages/registry/RegistryAuditLog";
import TradeApprovals from "./pages/registry/TradeApprovals";
import RetirementApprovals from "./pages/registry/RetirementApprovals";
import BatchApprovals from "./pages/registry/BatchApprovals";
import ParticipantApprovals from "./pages/registry/ParticipantApprovals";
import IncomingBids from "./pages/IncomingBids";
import AirlineMarketplace from "./pages/airline/AirlineMarketplace";
import AirlineDashboard from "./pages/airline/AirlineDashboard";
import AirlineMyBids from "./pages/airline/AirlineMyBids";
import AirlineCertificates from "./pages/airline/AirlineCertificates";
import AirlineLayout from "./layout/AirlineLayout";

const routeByOrgType = {
  supplier: "/dashboard",
  airline: "/airline/dashboard",
  trader: "/registry",
  inspector: "/inspector",
  registry: "/registry",
};

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("saf_auth") || "null");
  } catch (_err) {
    return null;
  }
}

function ProtectedRoute({ allowedRoles, children }) {
  const auth = getAuth();
  const role = auth?.organizationType;

  if (!auth || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={routeByOrgType[role] || "/login"} replace />;
  }

  return children;
}

function LoginRoute() {
  const auth = getAuth();
  if (auth?.organizationType) {
    return <Navigate to={routeByOrgType[auth.organizationType] || "/login"} replace />;
  }
  return <Login />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <SupplierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batches"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <BatchManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificates"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <Certificates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <RegisterSAF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/incoming-bids"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <IncomingBids />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <AirlineMarketplace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/airline"
          element={
            <ProtectedRoute allowedRoles={["airline"]}>
              <AirlineLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AirlineDashboard />} />
          <Route path="marketplace" element={<AirlineMarketplace />} />
          <Route path="bids" element={<AirlineMyBids />} />
          <Route path="certificates" element={<AirlineCertificates />} />
        </Route>

        <Route
          path="/inspector"
          element={
            <ProtectedRoute allowedRoles={["inspector"]}>
              <InspectorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspection/queue"
          element={
            <ProtectedRoute allowedRoles={["inspector"]}>
              <InspectionQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/analytics"
          element={
            <ProtectedRoute allowedRoles={["inspector"]}>
              <InspectorAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registry"
          element={
            <ProtectedRoute allowedRoles={["registry", "trader"]}>
              <RegistryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry/audit-log"
          element={
            <ProtectedRoute allowedRoles={["registry", "trader"]}>
              <RegistryAuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry/trade-approvals"
          element={
            <ProtectedRoute allowedRoles={["registry", "trader"]}>
              <TradeApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry/retirements"
          element={
            <ProtectedRoute allowedRoles={["registry", "trader"]}>
              <RetirementApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry/batch-approvals"
          element={
            <ProtectedRoute allowedRoles={["registry", "trader"]}>
              <BatchApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry/participants"
          element={
            <ProtectedRoute allowedRoles={["registry", "trader"]}>
              <ParticipantApprovals />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
