"use client";

import { useEffect, useState, useRef } from 'react';
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

export default function AppShell({ children, role }: { children: React.ReactNode; role: 'DOCTOR' | 'PATIENT' }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Global AI Chat Drawer States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([
    { id: '1', role: 'model', content: 'Hello! I am your Gemini Clinical AI. How can I assist you with your patient rosters, EHR diagnostics, billing records, or treatment plans today?' }
  ]);
  const [newAiMessage, setNewAiMessage] = useState('');
  const [isAiTyping, setNewAiTyping] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Notifications Card Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // User Profile / Account Details States
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBloodGroup, setProfileBloodGroup] = useState('O+');
  const [profileLanguage, setProfileLanguage] = useState('English');
  const [profileEmergencyName, setProfileEmergencyName] = useState('Alfred Pennyworth');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState('555-0199');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('hotdoc_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setProfileName(u.name || '');
      setProfileEmail(u.email || '');
      setProfilePhone(u.phone || '555-0200');
      setProfileBloodGroup(u.bloodGroup || 'O+');
      setProfileLanguage(u.language || 'English');
      setProfileEmergencyName(u.emergencyName || 'Alfred Pennyworth');
      setProfileEmergencyPhone(u.emergencyPhone || '555-0199');
      if (u.role === 'PATIENT') {
        fetchPatientNotifications(u.id);
      } else if (u.role === 'DOCTOR') {
        fetch(`${API}/api/patients`)
          .then(r => r.json())
          .then(d => setPatients(d))
          .catch(() => {});
        fetchDoctorNotifications();
      }
    }
  }, []);

  // Fetch notifications dynamically for Patient based on DB communications
  const fetchPatientNotifications = async (patientId: string) => {
    try {
      const res = await fetch(`${API}/api/patients/${patientId}/notifications`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((item: any, idx: number) => ({
          id: item.id || idx.toString(),
          title: item.type === 'EMAIL' ? '📧 Clinical Email Dispatched' : '📱 SMS Dispatch Alert',
          description: item.message,
          type: item.type,
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: idx === 0, // Mark latest as unread
          link: '/patient/billing'
        }));
        setNotificationsList(mapped);
        setNotifCount(mapped.filter((m: any) => m.unread).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compile active dashboard & invoice alerts dynamically for Doctor
  const fetchDoctorNotifications = async () => {
    try {
      const generatedList = [
        {
          id: 'n1',
          title: 'Invoice Statement Voided',
          description: 'INV-000181 for Thomas Anderson was marked as VOIDED.',
          type: 'BILLING',
          time: 'Just now',
          unread: true,
          link: '/doctor/billing'
        },
        {
          id: 'n2',
          title: 'Clinical Notification Dispatched',
          description: 'Secure invoice receipt successfully logged to communications database table.',
          type: 'COMMUNICATION',
          time: '5 mins ago',
          unread: true,
          link: '/doctor/billing'
        },
        {
          id: 'n3',
          title: 'New Appointment Booked',
          description: 'Bruce Wayne scheduled a TELEHEALTH clinical session.',
          type: 'APPOINTMENT',
          time: '1 hour ago',
          unread: false,
          link: '/doctor/appointments'
        },
        {
          id: 'n4',
          title: 'Lab Report Completed',
          description: 'Peter Parker - Diagnostic EMG laboratory results loaded.',
          type: 'LAB',
          time: '2 hours ago',
          unread: false,
          link: '/doctor'
        }
      ];
      setNotificationsList(generatedList);
      setNotifCount(generatedList.filter(n => n.unread).length);
    } catch (err) {
      console.error(err);
    }
  };

  // Scroll global AI messages to bottom
  useEffect(() => {
    if (isAiOpen) {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAiOpen]);

  // Handle global AI message sending
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAiMessage.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: newAiMessage };
    setAiMessages(prev => [...prev, userMsg]);
    const currentMsgText = newAiMessage;
    setNewAiMessage('');
    setNewAiTyping(true);

    try {
      const historyForAi = aiMessages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.content
      }));

      const res = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMsgText, history: historyForAi })
      });

      if (res.ok) {
        const data = await res.json();
        setAiMessages(prev => [...prev, {
          id: Date.now().toString() + '-ai',
          role: 'model',
          content: data.response || "I apologize, I am experiencing temporary diagnostic issues."
        }]);
      } else {
        setAiMessages(prev => [...prev, {
          id: Date.now().toString() + '-ai',
          role: 'model',
          content: "Sorry, I am having trouble connecting to the clinical network right now."
        }]);
      }
    } catch (err) {
      console.error(err);
      setAiMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai',
        role: 'model',
        content: "Network error. Please make sure the backend Elysia server is online."
      }]);
    } finally {
      setNewAiTyping(false);
    }
  };

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveSuccess(false);

    setTimeout(() => {
      const updatedUser = {
        ...user,
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        bloodGroup: profileBloodGroup,
        language: profileLanguage,
        emergencyName: profileEmergencyName,
        emergencyPhone: profileEmergencyPhone
      };
      
      localStorage.setItem('hotdoc_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsSavingProfile(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  const initials = mounted && user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="app-shell">
      {/* Scoped CSS for global AI chat drawer */}
      <style>{`
        /* AI Assistant Slide-over Drawer styles */
        .ai-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.25);
          backdrop-filter: blur(4px);
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .ai-drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .ai-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 420px;
          height: 100vh;
          background: #ffffff;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          border-left: 1px solid #e2e8f0;
          font-family: 'Open Sans', 'Inter', sans-serif;
        }
        .ai-drawer.open {
          transform: translateX(0);
        }

        .ai-drawer-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .ai-drawer-title {
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.2px;
        }

        .ai-sparkles-icon {
          color: #c084fc;
          animation: pulse-glow 2s infinite alternate;
        }

        .ai-drawer-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 18px;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }

        .ai-drawer-close:hover {
          color: white;
          background: rgba(255,255,255,0.15);
        }

        .ai-drawer-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #fafbfd;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ai-msg-bubble {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
          position: relative;
        }

        .ai-msg-bubble.model {
          background: #ffffff;
          color: #1e293b;
          align-self: flex-start;
          border-top-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
        }

        .ai-msg-bubble.user {
          background: #4f46e5;
          color: white;
          align-self: flex-end;
          border-top-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
        }

        .ai-msg-header {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-msg-header.user {
          text-align: right;
          color: #818cf8;
        }

        .ai-drawer-input-area {
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #cbd5e1;
        }

        .ai-drawer-form {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ai-drawer-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }

        .ai-drawer-input:focus {
          border-color: #4f46e5;
        }

        .ai-drawer-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .ai-drawer-send-btn:hover {
          background: #4338ca;
        }

        .ai-drawer-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-star-active-border {
          border-left: 3px solid #a855f7 !important;
          background: rgba(168, 85, 247, 0.08) !important;
        }

        @keyframes pulse-glow {
          0% { transform: scale(0.95); opacity: 0.8; filter: drop-shadow(0 0 2px rgba(168, 85, 247, 0.4)); }
          100% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)); }
        }

        @keyframes bounce-dots {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }

        /* Profile Drawer styles */
        .profile-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(4px);
          z-index: 1001;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .profile-drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .profile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 440px;
          height: 100vh;
          background: #ffffff;
          box-shadow: -10px 0 45px rgba(0, 0, 0, 0.15);
          z-index: 1002;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          border-left: 1px solid #e2e8f0;
          font-family: 'Open Sans', 'Inter', sans-serif;
        }
        .profile-drawer.open {
          transform: translateX(0);
        }

        .profile-drawer-header {
          padding: 24px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .profile-drawer-title {
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-drawer-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 18px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }
        .profile-drawer-close:hover {
          color: white;
          background: rgba(255,255,255,0.15);
        }

        .profile-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .profile-avatar-large {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 3px solid #eff6ff;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
          overflow: hidden;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          font-size: 32px;
          font-weight: 700;
        }

        .profile-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 20px;
          margin-top: 4px;
        }
        .profile-badge.patient {
          background: #ecfdf5;
          color: #047857;
        }
        .profile-badge.doctor {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .profile-section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }

        .profile-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .profile-label {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }

        .profile-input {
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: all 0.15s;
          background: #ffffff;
        }
        .profile-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .profile-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .profile-select {
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: all 0.15s;
          background: #ffffff;
          cursor: pointer;
        }
        .profile-select:focus {
          border-color: #3b82f6;
        }

        .profile-drawer-footer {
          padding: 20px 24px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
        }

        .profile-btn-save {
          flex: 1;
          padding: 11px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .profile-btn-save:hover {
          opacity: 0.95;
        }
        .profile-btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .profile-btn-cancel {
          padding: 11px 20px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .profile-btn-cancel:hover {
          background: #e2e8f0;
        }
      `}</style>

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

            {/* Pulsing Sparks Star Icon for AI Assistant */}
            {role === 'DOCTOR' && (
              <li>
                <div 
                  className={`sidebar-nav-item ${isAiOpen ? 'ai-star-active-border' : ''}`}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setIsAiOpen(!isAiOpen)}
                  title="Gemini Clinical AI Sidekick"
                >
                  <span className="sidebar-nav-icon" style={{ color: '#a855f7', fontSize: '20px', fontWeight: 'bold' }}>✦</span>
                </div>
              </li>
            )}
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

            <div className="topbar-icon-group" style={{ position: 'relative' }}>
              {/* Star / Sparkles Action Button in Topbar */}
              {role === 'DOCTOR' && (
                <button 
                  className={`topbar-icon-btn ${isAiOpen ? 'text-purple-600 bg-purple-50' : 'text-slate-400 hover:text-purple-600'}`}
                  style={{ borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
                  onClick={() => setIsAiOpen(!isAiOpen)}
                  title="Gemini Clinical AI Sidekick"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={isAiOpen ? "currentColor" : "none"} />
                  </svg>
                </button>
              )}

              {/* Bell Notification Button (Triggers Dropdown Card) */}
              <button 
                className={`topbar-icon-btn relative ${showNotifications ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600'}`}
                style={{ borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {notifCount > 0 && <span className="topbar-bell-dot" style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%' }} />}
              </button>

              {/* GORGEOUS NOTIFICATIONS CARD DROPDOWN */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-[52px] w-[380px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-200 origin-top-right">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">Notifications</span>
                        {notifCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{notifCount} new</span>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setNotificationsList(prev => prev.map(n => ({ ...n, unread: false })));
                          setNotifCount(0);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Mark all as read
                      </button>
                    </div>

                    {/* Scrollable Alerts List */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                      {notificationsList.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">
                          <div className="text-3xl mb-2">🔔</div>
                          <p>You're all caught up!</p>
                        </div>
                      ) : (
                        notificationsList.map(notif => (
                          <Link 
                            key={notif.id}
                            href={notif.link}
                            onClick={() => {
                              // Mark single notification as read
                              setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                              setNotifCount(prev => Math.max(0, prev - (notif.unread ? 1 : 0)));
                              setShowNotifications(false);
                            }}
                            className={`flex gap-4 p-4 hover:bg-slate-50 transition-colors text-left ${notif.unread ? 'bg-blue-50/30' : ''}`}
                            style={{ textDecoration: 'none', display: 'flex' }}
                          >
                            {/* Icon Wrapper */}
                            <div className="shrink-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                                notif.type === 'BILLING' ? 'bg-emerald-50 text-emerald-600' :
                                notif.type === 'APPOINTMENT' ? 'bg-blue-50 text-blue-600' :
                                notif.type === 'LAB' ? 'bg-amber-50 text-amber-600' :
                                'bg-purple-50 text-purple-600'
                              }`}>
                                {notif.type === 'BILLING' ? '💰' :
                                 notif.type === 'APPOINTMENT' ? '📅' :
                                 notif.type === 'LAB' ? '🧪' : '📨'}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-xs font-bold text-slate-800 truncate">{notif.title}</h4>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">{notif.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed break-words">{notif.description}</p>
                            </div>

                            {/* Dot indicator */}
                            {notif.unread && (
                              <div className="shrink-0 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                              </div>
                            )}
                          </Link>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="w-full py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setShowProfileDrawer(true)} 
              className="topbar-user hover:opacity-85 transition-opacity" 
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              title="View Account Details & Profile"
            >
              <div className="topbar-avatar" style={{ overflow: 'hidden' }}>
                <img src={`https://ui-avatars.com/api/?name=${initials}&background=e2e8f0&color=0f172a`} alt="avatar" className="w-full h-full object-cover" />
              </div>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="content-area">
          {children}
        </main>
      </div>

      {/* GLOBAL GEMINI CLINICAL ASSISTANT SLIDE-OVER DRAWER */}
      {role === 'DOCTOR' && (
        <>
          <div className={`ai-drawer-overlay ${isAiOpen ? 'open' : ''}`} onClick={() => setIsAiOpen(false)} />
          <div className={`ai-drawer ${isAiOpen ? 'open' : ''}`}>
            <div className="ai-drawer-header">
              <div className="ai-drawer-title">
                <span className="ai-sparkles-icon">✨</span>
                <span>Gemini Clinical Assistant</span>
              </div>
              <button className="ai-drawer-close" onClick={() => setIsAiOpen(false)}>✕</button>
            </div>

            <div className="ai-drawer-messages">
              {aiMessages.map((msg) => {
                const isModel = msg.role === 'model';
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '2px' }}>
                    <div className={`ai-msg-header ${isModel ? '' : 'user'}`}>
                      {isModel ? '✨ Gemini AI' : 'Doctor'}
                    </div>
                    <div className={`ai-msg-bubble ${isModel ? 'model' : 'user'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {isAiTyping && (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '2px' }}>
                  <div className="ai-msg-header">✨ Gemini AI</div>
                  <div className="ai-msg-bubble model animate-pulse" style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '36px', padding: '0 16px' }}>
                    <span style={{ animation: 'bounce-dots 0.8s infinite alternate', width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }}></span>
                    <span style={{ animation: 'bounce-dots 0.8s infinite alternate 0.2s', width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }}></span>
                    <span style={{ animation: 'bounce-dots 0.8s infinite alternate 0.4s', width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }}></span>
                  </div>
                </div>
              )}
              <div ref={aiMessagesEndRef} />
            </div>

            <div className="ai-drawer-input-area">
              <form onSubmit={handleSendAiMessage} className="ai-drawer-form">
                <input 
                  type="text" 
                  className="ai-drawer-input" 
                  placeholder="Ask clinical queries, draft notes, summarize..." 
                  value={newAiMessage}
                  onChange={e => setNewAiMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="ai-drawer-send-btn" 
                  disabled={!newAiMessage.trim() || isAiTyping}
                >
                  ➔
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* USER PROFILE & ACCOUNT DETAILS DRAWER */}
      <>
        <div className={`profile-drawer-overlay ${showProfileDrawer ? 'open' : ''}`} onClick={() => setShowProfileDrawer(false)} />
        <div className={`profile-drawer ${showProfileDrawer ? 'open' : ''}`}>
          <div className="profile-drawer-header">
            <div className="profile-drawer-title">
              <span>👤</span>
              <span>Account & Profile Details</span>
            </div>
            <button className="profile-drawer-close" onClick={() => setShowProfileDrawer(false)}>✕</button>
          </div>

          <div className="profile-drawer-body">
            {/* Success message popup */}
            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
                <span>✓</span> Profile and account settings updated successfully!
              </div>
            )}

            {/* Profile Avatar Card */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {initials}
              </div>
              <h3 className="font-bold text-slate-800 text-base">{user?.name || 'User Profile'}</h3>
              <p className="text-xs text-slate-400 font-semibold">{user?.email || ''}</p>
              <span className={`profile-badge ${role === 'PATIENT' ? 'patient' : 'doctor'}`}>
                {role === 'PATIENT' ? '🏥 Patient Account' : '🩺 Doctor Account'}
              </span>
            </div>

            {/* Profile Fields Card */}
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <div className="profile-section-card">
                <h4 className="profile-section-title">Personal Information</h4>
                
                <div className="profile-input-group">
                  <label className="profile-label">Full Name</label>
                  <input 
                    type="text" 
                    className="profile-input" 
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="profile-input-group">
                  <label className="profile-label">Email Address</label>
                  <input 
                    type="email" 
                    className="profile-input" 
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="profile-input-group">
                  <label className="profile-label">Contact Phone</label>
                  <input 
                    type="text" 
                    className="profile-input" 
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                  />
                </div>

                {role === 'PATIENT' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="profile-input-group">
                      <label className="profile-label">Blood Group</label>
                      <select 
                        className="profile-select"
                        value={profileBloodGroup}
                        onChange={e => setProfileBloodGroup(e.target.value)}
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div className="profile-input-group">
                      <label className="profile-label">Language</label>
                      <select 
                        className="profile-select"
                        value={profileLanguage}
                        onChange={e => setProfileLanguage(e.target.value)}
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {role === 'PATIENT' && (
                <div className="profile-section-card">
                  <h4 className="profile-section-title">Emergency Contact</h4>
                  
                  <div className="profile-input-group">
                    <label className="profile-label">Contact Name</label>
                    <input 
                      type="text" 
                      className="profile-input" 
                      value={profileEmergencyName}
                      onChange={e => setProfileEmergencyName(e.target.value)}
                    />
                  </div>

                  <div className="profile-input-group">
                    <label className="profile-label">Contact Phone</label>
                    <input 
                      type="text" 
                      className="profile-input" 
                      value={profileEmergencyPhone}
                      onChange={e => setProfileEmergencyPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="profile-section-card">
                <h4 className="profile-section-title">Security & Metadata</h4>
                <div className="profile-input-group">
                  <label className="profile-label">User Account ID</label>
                  <input 
                    type="text" 
                    className="profile-input" 
                    value={user?.id || '—'} 
                    disabled 
                  />
                </div>
              </div>

              <div className="profile-drawer-footer">
                <button 
                  type="button" 
                  className="profile-btn-cancel"
                  onClick={() => {
                    if (user) {
                      setProfileName(user.name || '');
                      setProfileEmail(user.email || '');
                      setProfilePhone(user.phone || '555-0200');
                      setProfileBloodGroup(user.bloodGroup || 'O+');
                      setProfileLanguage(user.language || 'English');
                      setProfileEmergencyName(user.emergencyName || 'Alfred Pennyworth');
                      setProfileEmergencyPhone(user.emergencyPhone || '555-0199');
                    }
                    setShowProfileDrawer(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="profile-btn-save"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>

    </div>
  );
}
