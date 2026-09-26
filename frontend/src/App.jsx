import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/StoreProvider';
import { Toasts, ConfirmDialog } from './components/ui';
import { AppLayout } from './components/layout';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import OperationList from './pages/operations/OperationList';
import OperationForm from './pages/operations/OperationForm';
import PrintView from './pages/operations/PrintView';
import Adjustments from './pages/Adjustments';
import Stock from './pages/Stock';
import MoveHistory from './pages/MoveHistory';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Warehouses from './pages/settings/Warehouses';
import Locations from './pages/settings/Locations';

function ProtectedRoute({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user } = useStore();
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { toasts, dlg, clearDlg } = useStore();

  return (
    <div className="ss">
      <Routes>
        {/* Auth (guest only) */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

        {/* Print view (own layout, protected) */}
        <Route path="/operations/:id/print" element={<ProtectedRoute><PrintView /></ProtectedRoute>} />

        {/* App shell (protected) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="receipts" element={<OperationList type="RECEIPT" />} />
          <Route path="receipts/new" element={<OperationForm type="RECEIPT" />} />
          <Route path="deliveries" element={<OperationList type="DELIVERY" />} />
          <Route path="deliveries/new" element={<OperationForm type="DELIVERY" />} />
          <Route path="internal" element={<OperationList type="DELIVERY" kind="INTERNAL" />} />
          <Route path="internal/new" element={<OperationForm type="INTERNAL" />} />
          <Route path="operations/:id" element={<OperationForm />} />
          <Route path="adjustments" element={<Adjustments />} />
          <Route path="stock" element={<Stock />} />
          <Route path="move-history" element={<MoveHistory />} />
          <Route path="settings/warehouses" element={<Warehouses />} />
          <Route path="settings/locations" element={<Locations />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* Global overlays — inside .ss */}
      <Toasts list={toasts} />
      {dlg && <ConfirmDialog {...dlg} onClose={clearDlg} />}
    </div>
  );
}
