import Link from 'next/link';

export default function Home() {
  return (
    <div className="hero-page">
      <div className="hero-title">ClinAssist AI</div>
      <div className="hero-desc">Comprehensive Healthcare Scheduling & Management</div>
      <div className="btn-group">
        <Link href="/login/doctor" className="btn btn-primary">Doctor Login</Link>
        <Link href="/login/patient" className="btn">Patient Login</Link>
      </div>
    </div>
  );
}
