"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = 'http://127.0.0.1:3002';

export default function DoctorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [doctorId, setDoctorId] = useState('');
  
  // Popup States
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const doc = JSON.parse(userStr);
    if (doc.role !== 'DOCTOR') { window.location.href = '/login'; return; }
    setDoctorId(doc.id);

    const safeFetch = async (url: string) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    };

    safeFetch(`${API}/api/doctors/${doc.id}/dashboard-stats`).then(d => d && setStats(d));
    safeFetch(`${API}/api/doctors/${doc.id}/patients-analytics`).then(d => d && setAnalytics(d));
      
    // Fetch full lists for popups
    safeFetch(`${API}/api/patients`).then(d => d && setPatientsList(d));
    safeFetch(`${API}/api/doctors/${doc.id}/all-appointments`).then(d => d && setAllAppointments(d));
    safeFetch(`${API}/api/doctors/${doc.id}/lab-results`).then(d => d && setLabResults(d));
  }, []);

  return (
    <>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <div className="page-title" style={{ fontSize: '24px' }}>Dashboard</div>
          <div className="page-subtitle" style={{ fontSize: '14px' }}>Welcome back! Here's what's happening in your medical practice today.</div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Patients */}
        <div onClick={() => setActivePopup('PATIENTS')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Total Patients</div>
              <div className="text-xs text-slate-500">Registered in system</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats?.totalPatients ?? '—'}</div>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div onClick={() => setActivePopup('TODAY')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Today's Appointments</div>
              <div className="text-xs text-slate-500">Scheduled for today</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats?.todayAppointments ?? '—'}</div>
          </div>
        </div>

        {/* Card 3: Total Appointments */}
        <div onClick={() => setActivePopup('ALL')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">All Appointments</div>
              <div className="text-xs text-slate-500">Total across all time</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats?.totalAppointments ?? '—'}</div>
            <div className="text-xs text-slate-500">
              {stats ? `${stats.completedAppointments} completed` : ''}
            </div>
          </div>
        </div>

        {/* Card 4: Pending Lab Results */}
        <div onClick={() => setActivePopup('LABS')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Pending Lab Results</div>
              <div className="text-xs text-slate-500">Awaiting review</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats?.pendingLabs ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Appointments */}
        <div className="card shadow-sm border border-slate-200 rounded-xl" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-slate-800">Recent Appointments</div>
            <Link href="/doctor/appointments" className="px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
              View All
            </Link>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {!stats || stats.recentAppointments.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No appointments found.</div>
            ) : (
              stats.recentAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{apt.patientName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(apt.startTime).toLocaleDateString()} • {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{apt.appointmentType === 'TELEHEALTH' ? 'Telehealth' : 'In-Person'}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                      apt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' :
                      apt.status === 'IN_PROGRESS' ? 'bg-purple-50 text-purple-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Analytics */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Actions */}
          <div className="card shadow-sm border border-slate-200 rounded-xl">
            <div className="text-lg font-bold text-slate-800 mb-4">Quick Actions</div>
            <div className="flex flex-col gap-3">
              <Link href="/doctor/patients" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-slate-400"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div>
                  <span className="text-sm font-medium text-slate-700">View Patients</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1 rounded-md bg-white">{stats?.totalPatients ?? 0} patients</div>
              </Link>
              <Link href="/doctor/appointments" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-rose-400"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                  <span className="text-sm font-medium text-slate-700">Schedule Appointment</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1 rounded-md bg-white">Add</div>
              </Link>
              <Link href="/doctor/messages" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-blue-500"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div>
                  <span className="text-sm font-medium text-slate-700">Messages</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1 rounded-md bg-white">Open</div>
              </Link>
              <Link href="/doctor/billing" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-emerald-500"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                  <span className="text-sm font-medium text-slate-700">Billing & Invoices</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1 rounded-md bg-white">View</div>
              </Link>
            </div>
          </div>

          {/* Patient Analytics Summary */}
          <div className="card shadow-sm border border-slate-200 rounded-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-slate-800">Patient Analytics</div>
            </div>
            {analytics ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Enrollment</div>
                  <div className="text-xl font-bold text-slate-900">{analytics.enrollment}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Active Cases</div>
                  <div className="text-xl font-bold text-slate-900">{analytics.activeCases}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Private Insurance</div>
                  <div className="text-xl font-bold text-blue-600">{analytics.insurance.private}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Medicare</div>
                  <div className="text-xl font-bold text-sky-600">{analytics.insurance.medicare}</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[120px] flex items-center justify-center text-slate-400 text-sm">
                Loading analytics...
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Popups */}
      {activePopup && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setActivePopup(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {activePopup === 'PATIENTS' && 'Total Patients'}
                {activePopup === 'TODAY' && "Today's Appointments"}
                {activePopup === 'ALL' && 'All Appointments'}
                {activePopup === 'LABS' && 'Pending Lab Results'}
              </h3>
              <button onClick={() => setActivePopup(null)} className="text-slate-400 hover:text-slate-600">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {activePopup === 'PATIENTS' && (
                <div className="flex flex-col gap-3">
                  {patientsList.length === 0 ? <p className="text-slate-500 text-center py-4">No patients found.</p> : patientsList.map(p => (
                    <div key={p.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-sm text-slate-500">{p.email} • {p.phone || 'No phone'}</div>
                      </div>
                      <Link href={`/doctor/ehr/${p.id}`} className="text-sm font-semibold text-[#312e81] hover:underline">View EHR</Link>
                    </div>
                  ))}
                </div>
              )}

              {activePopup === 'TODAY' && (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const todayEnd = new Date();
                    todayEnd.setHours(23,59,59,999);
                    const todays = allAppointments.filter(a => {
                      const d = new Date(a.startTime);
                      return d >= today && d <= todayEnd;
                    });
                    
                    if (todays.length === 0) return <p className="text-slate-500 text-center py-4">No appointments for today.</p>;
                    
                    return todays.map(apt => {
                      const patientName = patientsList.find(p => p.id === apt.patientId)?.name || 'Unknown Patient';
                      return (
                        <div key={apt.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="font-bold text-slate-800">{patientName}</div>
                            <div className="text-sm text-slate-500">
                              {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {apt.appointmentType}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${
                            apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                            apt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>{apt.status}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {activePopup === 'ALL' && (
                <div className="flex flex-col gap-3">
                  {allAppointments.length === 0 ? <p className="text-slate-500 text-center py-4">No appointments found.</p> : allAppointments.map(apt => {
                    const patientName = patientsList.find(p => p.id === apt.patientId)?.name || 'Unknown Patient';
                    return (
                      <div key={apt.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800">{patientName}</div>
                          <div className="text-sm text-slate-500">
                            {new Date(apt.startTime).toLocaleDateString()} {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {apt.appointmentType}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${
                          apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                          apt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>{apt.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activePopup === 'LABS' && (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const pending = labResults.filter(r => r.status === 'Pending');
                    if (pending.length === 0) return <p className="text-slate-500 text-center py-4">No pending lab results.</p>;
                    
                    return pending.map(lab => (
                      <div key={lab.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800">{lab.patientName || 'Unknown Patient'}</div>
                          <div className="text-sm text-slate-500">{lab.reportType} • {lab.sourceLab}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide bg-amber-50 text-amber-600">Pending</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button onClick={() => setActivePopup(null)} className="px-5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
