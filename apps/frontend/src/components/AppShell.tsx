"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const API = 'http://127.0.0.1:3002';

const DOCTOR_NAV = [
  { href: '/doctor', label: 'Dashboard', icon: '▦' },
  { href: '/doctor/appointments', label: 'Appointments', icon: '◷' },
  { href: '/doctor/patients', label: 'Patients', icon: '⊕' },
  { href: '/doctor/billing', label: 'Billing', icon: '◈' },
  { href: '/doctor/messages', label: 'Messages', icon: '◉' },
];

const PATIENT_NAV = [
  { href: '/patient', label: 'Dashboard', icon: '▦' },
  { href: '/patient/records', label: 'Health Records', icon: '◷' },
  { href: '/patient/billing', label: 'Billing', icon: '◈' },
  { href: '/patient/messages', label: 'Messages', icon: '◉' },
];

const BOTTOM_NAV = [
  { href: '#', label: 'Help Center', icon: '?' },
  { href: '#', label: 'Settings', icon: '⚙' },
];

export default function AppShell({ children, role }: { children: React.ReactNode; role: 'DOCTOR' | 'PATIENT' }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('hotdoc_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      if (u.role === 'PATIENT') {
        fetch(`${API}/api/patients/${u.id}/notifications`)
          .then(r => r.json())
          .then(d => setNotifCount(d.length))
          .catch(() => {});
      } else if (u.role === 'DOCTOR') {
        fetch(`${API}/api/patients`)
          .then(r => r.json())
          .then(d => setPatients(d))
          .catch(() => {});
      }
    }
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.phone && p.phone.includes(searchQuery)) ||
    (p.id && p.id.includes(searchQuery))
  );

  const navItems = role === 'DOCTOR' ? DOCTOR_NAV : PATIENT_NAV;

  const handleLogout = () => {
    const currentRole = user?.role;
    localStorage.removeItem('hotdoc_user');
    window.location.href = currentRole === 'DOCTOR' ? '/login/doctor' : '/login/patient';
  };

  const initials = mounted && user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon-large">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </div>

        <div className="sidebar-section">
          <ul className="sidebar-nav">
            {navItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <ul className="sidebar-nav">
            <li>
              <span className="sidebar-nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Logout">
                <span className="sidebar-nav-icon text-rose-500 font-bold">⏻</span>
              </span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main content area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search relative">
            <span className="topbar-search-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search patient name, ID, or phone..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              suppressHydrationWarning 
            />
            {showDropdown && searchQuery && role === 'DOCTOR' && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => (
                    <Link 
                      key={p.id} 
                      href={`/doctor/ehr/${p.id}`} 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.email} • {p.phone || 'No phone'}</div>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center">No patients found.</div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            {role === 'DOCTOR' && (
              <>
                <Link href="/doctor/appointments" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add Schedule
                </Link>
              </>
            )}

            <div className="topbar-icon-group">
              <button className="topbar-icon-btn" suppressHydrationWarning>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </button>
              <button className="topbar-icon-btn relative" suppressHydrationWarning>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {notifCount > 0 && <span className="topbar-bell-dot" />}
              </button>
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar" style={{ overflow: 'hidden' }}>
                <img src={`https://ui-avatars.com/api/?name=${initials}&background=e2e8f0&color=0f172a`} alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
