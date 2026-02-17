import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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


function App() {
  return (
    <BrowserRouter>
      
      <Routes>

        {/* Authentication Route */}
        <Route path="/login" element={<Login />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Supplier Routes */}
        <Route path="/dashboard" element={<SupplierDashboard />} />
        <Route path="/batches" element={<BatchManagement />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/marketplace/incoming-bids" element={<IncomingBids />} />

        {/* Inspector Routes */}
        <Route path="/inspector" element={<InspectorDashboard />} />
        <Route path="/inspection/queue" element={<InspectionQueue />} />
        <Route path="/inspector/analytics" element={<InspectorAnalytics />} />

        {/* Registry Routes */}
        <Route path="/registry/audit-log" element={<RegistryAuditLog />} /> 
        <Route path="/registry/trade-approvals" element={<TradeApprovals />} />
        <Route path="/registry/retirements" element={<RetirementApprovals />} />
        <Route path="/registry/batch-approvals" element={<BatchApprovals />} />
        <Route path="/registry/participants" element={<ParticipantApprovals />} />
        <Route path="/registry" element={<RegistryDashboard />} />

        {/* Optional: direct register page (if needed) */}
        <Route path="/register" element={<RegisterSAF />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
