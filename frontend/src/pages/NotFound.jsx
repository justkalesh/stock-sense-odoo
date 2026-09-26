import { useGo } from '../hooks/useGo';
import { PackageX } from 'lucide-react';

export default function NotFound() {
  const go = useGo();
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <PackageX size={48} className="t3" style={{ margin: "0 auto" }} />
        <div className="mono t3" style={{ fontSize: 32, marginTop: 12 }}>404</div>
        <div className="h-title" style={{ marginTop: 8 }}>This shelf is empty.</div>
        <div className="t2" style={{ marginTop: 4 }}>The page you're looking for doesn't exist or was moved.</div>
        <button type="button" className="btn bp" style={{ marginTop: 20 }} onClick={() => go("dashboard")}>Back to Dashboard</button>
      </div>
    </div>
  );
}
