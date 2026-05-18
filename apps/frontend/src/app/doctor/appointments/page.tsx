"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = 'http://127.0.0.1:3002';

// Diagnostics list
const DIAGNOSTICS = ['Blood Panel', 'X-Ray', 'MRI', 'Urinalysis', 'ECG', 'Ultrasound'];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [patients, setPatients] = useState<any[]>([]);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'schedule' | 'direct-book' | 'results-hub'>('schedule');
  
  // Schedule Form State
  const [schedPatientId, setSchedPatientId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedType, setSchedType] = useState('IN_PERSON');
  const [schedNotes, setSchedNotes] = useState('');

  // Direct-Book Form State
  const [facility, setFacility] = useState('Central City Lab');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [doctorsNote, setDoctorsNote] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [viewingReport, setViewingReport] = useState<any>(null);

  // Mock Data (now replaced with real state)
  const [historicalBookings, setHistoricalBookings] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);

  // Filters for Results Hub
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const doc = JSON.parse(userStr);
    if (doc.role !== 'DOCTOR') { window.location.href = '/login'; return; }
    setDoctorId(doc.id);
    fetchAll(doc.id);
    fetchLabData(doc.id);
    fetch(`${API}/api/patients`).then(r => r.json()).then(d => setPatients(d));
  }, []);

  const fetchAll = async (id: string) => {
    const res = await fetch(`${API}/api/doctors/${id}/all-appointments`);
    const apts = await res.json();
    const patsRes = await fetch(`${API}/api/patients`);
    const pats = await patsRes.json();
    const enriched = apts.map((a: any) => ({ ...a, patientName: pats.find((p: any) => p.id === a.patientId)?.name || 'Unknown' }));
    setAppointments(enriched);
  };

  const fetchLabData = async (id: string) => {
    try {
      const ordersRes = await fetch(`${API}/api/doctors/${id}/lab-orders`);
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        setHistoricalBookings(orders.map((o: any) => ({
          id: o.id.split('-')[0], // Shorten ID for UI
          patient: o.patientName,
          test: (o.procedures || []).join(', '),
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: o.status
        })));
      }

      const resultsRes = await fetch(`${API}/api/doctors/${id}/lab-results`);
      if (resultsRes.ok) {
        const results = await resultsRes.json();
        setLabResults(results.map((r: any) => ({
          id: r.id.split('-')[0],
          patient: r.patientName,
          type: r.reportType,
          status: r.status,
          time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lab: r.sourceLab
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
  const waiting = appointments.filter(a => a.status === 'WAITING').length;
  const inProgress = appointments.filter(a => a.status === 'IN_PROGRESS').length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;

  const handleProcedureToggle = (proc: string) => {
    setSelectedProcedures(prev => 
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || selectedProcedures.length === 0) {
      alert('Patient ID and at least one procedure are required.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await fetch(`${API}/api/lab-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId, // assuming patientId input is the actual user ID or we match it
          doctorId: doctorId,
          facility,
          procedures: selectedProcedures,
          doctorsNote
        })
      });

      setPatientId('');
      setPatientName('');
      setContactNumber('');
      setDoctorsNote('');
      setSelectedProcedures([]);
      
      // Refresh list
      fetchLabData(doctorId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResults = labResults.filter(r => {
    const matchesSearch = r.patient.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-title" style={{ fontSize: '24px' }}>Scheduling Engine</div>
          <div className="page-subtitle" style={{ fontSize: '14px' }}>State-aware appointment calendar</div>
        </div>
      </div>

      {/* Core Four KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between" style={{ minHeight: '110px' }}>
          <div className="font-semibold text-xs text-slate-500 tracking-wider uppercase mb-2">Scheduled</div>
          <div className="text-3xl font-bold text-blue-600">{scheduled}</div>
        </div>
        <div className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between" style={{ minHeight: '110px' }}>
          <div className="font-semibold text-xs text-slate-500 tracking-wider uppercase mb-2">Waiting</div>
          <div className="text-3xl font-bold text-amber-500">{waiting}</div>
        </div>
        <div className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between" style={{ minHeight: '110px' }}>
          <div className="font-semibold text-xs text-slate-500 tracking-wider uppercase mb-2">In Progress</div>
          <div className="text-3xl font-bold text-purple-600">{inProgress}</div>
        </div>
        <div className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between" style={{ minHeight: '110px' }}>
          <div className="font-semibold text-xs text-slate-500 tracking-wider uppercase mb-2">Completed</div>
          <div className="text-3xl font-bold text-emerald-600">{completed}</div>
        </div>
      </div>

      {/* LabConnect Container */}
      <div className="card shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${activeTab === 'schedule' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule Appointment
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${activeTab === 'direct-book' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('direct-book')}
          >
            Lab Intake
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${activeTab === 'results-hub' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('results-hub')}
          >
            Results Hub
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Book New Appointment</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!schedPatientId || !schedDate || !schedTime) { alert('Patient, date and time are required.'); return; }
                  setIsSubmitting(true);
                  try {
                    const start = new Date(`${schedDate}T${schedTime}`);
                    const end = new Date(start.getTime() + 3600000);
                    await fetch(`${API}/api/appointments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patientId: schedPatientId,
                        doctorId,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        appointmentType: schedType
                      })
                    });
                    setSchedPatientId(''); setSchedDate(''); setSchedTime(''); setSchedNotes(''); setSchedType('IN_PERSON');
                    fetchAll(doctorId);
                    alert('Appointment successfully booked!');
                  } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
                }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Patient *</label>
                      <select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={schedPatientId} onChange={(e) => setSchedPatientId(e.target.value)}>
                        <option value="">Select a patient...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Appointment Type</label>
                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={schedType} onChange={(e) => setSchedType(e.target.value)}>
                        <option value="IN_PERSON">In-Person Consultation</option>
                        <option value="TELEHEALTH">Telehealth Video</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Date *</label>
                      <input required type="date" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Time *</label>
                      <input required type="time" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Notes</label>
                    <textarea rows={3} placeholder="Reason for visit..." className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={schedNotes} onChange={(e) => setSchedNotes(e.target.value)}></textarea>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="lg:col-span-2 border-l border-slate-100 pl-8">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200"><h4 className="text-sm font-bold text-slate-800">Upcoming Schedule</h4></div>
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {appointments.filter(a => a.status === 'SCHEDULED').length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">No upcoming appointments.</div>
                    ) : appointments.filter(a => a.status === 'SCHEDULED').map(a => (
                      <div key={a.id} className="p-3 hover:bg-blue-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-slate-800">{a.patientName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${a.appointmentType === 'TELEHEALTH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.appointmentType === 'TELEHEALTH' ? 'Telehealth' : 'In-Person'}</span>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(a.startTime).toLocaleDateString()} • {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'direct-book' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-3">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Lab Intake Form</h3>
                <form onSubmit={handleBook} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Facility Selection</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={facility} onChange={(e) => setFacility(e.target.value)}
                      >
                        <option>Central City Lab</option>
                        <option>Westside Imaging</option>
                        <option>Downtown Diagnostics</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Patient *</label>
                      <select 
                        required
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={patientId} onChange={(e) => { setPatientId(e.target.value); const p = patients.find((pt: any) => pt.id === e.target.value); if (p) { setPatientName(p.name); setContactNumber(p.phone || ''); } }}
                      >
                        <option value="">Select a patient...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
                      <input 
                        type="text" placeholder="John Doe" 
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={patientName} onChange={(e) => setPatientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Contact Number</label>
                      <input 
                        type="tel" placeholder="+1 (555) 000-0000" 
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Diagnostic Catalog *</label>
                    <div className="flex flex-wrap gap-2">
                      {DIAGNOSTICS.map(proc => (
                        <button
                          type="button"
                          key={proc}
                          onClick={() => handleProcedureToggle(proc)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedProcedures.includes(proc) 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {proc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Clinical Directives (Doctor's Note)</label>
                    <textarea 
                      rows={3} placeholder="Add specific instructions or symptoms..." 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      value={doctorsNote} onChange={(e) => setDoctorsNote(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? 'Booking...' : 'Submit Lab Order'}
                  </button>
                </form>
              </div>

              {/* Sidebar Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Wait-Time Intelligence */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Wait-Time Intelligence</h4>
                  <p className="text-xs text-slate-500 mb-4">Real-time volume at {facility}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">~15 mins</div>
                      <div className="text-xs font-medium text-emerald-600">Optimal time to arrive</div>
                    </div>
                  </div>
                </div>

                {/* Historical Activity Log */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800">Recent Bookings</h4>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {historicalBookings.map(b => (
                      <div 
                        key={b.id} 
                        className="p-3 hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onDoubleClick={() => setViewingBooking(b)}
                        title="Double click to view details"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-slate-800">{b.patient}</span>
                          <span className="text-xs text-slate-500">{b.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">{b.test}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            b.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                            b.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results-hub' && (
            <div className="flex flex-col h-full min-h-[500px]">
              {/* Global Filters */}
              <div className="flex flex-wrap gap-4 items-end mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Smart Search</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input 
                      type="text" placeholder="Patient Name or ID..." 
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500"
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-48">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Status Filter</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500"
                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Received">Received (Ready)</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                  </select>
                </div>
                <div className="w-48">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Source Lab</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500">
                    <option>All Labs</option>
                    <option>Central City Lab</option>
                    <option>Westside Imaging</option>
                  </select>
                </div>
              </div>

              {/* Data Grid */}
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Patient Identity</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Report Type</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Source</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No lab results found.</td>
                      </tr>
                    ) : (
                      filteredResults.map(r => (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-slate-50 transition-colors ${r.status === 'Received' ? 'cursor-pointer' : ''}`}
                          onClick={() => r.status === 'Received' && setViewingReport(r)}
                        >
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{r.id}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-blue-600">{r.patient}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{r.type}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">{r.lab}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold ${
                              r.status === 'Received' ? 'bg-emerald-100 text-emerald-700' : 
                              r.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{r.status}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500 text-right">{r.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      
      {/* Read-Only Booking Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Booking Snapshot</h3>
              <button onClick={() => setViewingBooking(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Order ID</div>
                <div className="font-medium text-slate-900">{viewingBooking.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Patient Name</div>
                <div className="font-medium text-slate-900">{viewingBooking.patient}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Procedures Ordered</div>
                <div className="font-medium text-slate-900">{viewingBooking.test}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</div>
                <div className="font-medium text-slate-900">{viewingBooking.status}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Time Created</div>
                <div className="font-medium text-slate-900">{viewingBooking.time}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Res Viewer Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-10" onClick={() => setViewingReport(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{viewingReport.type} Report - {viewingReport.patient}</h3>
                <div className="text-xs text-slate-400 mt-1">Order {viewingReport.id} • {viewingReport.lab}</div>
              </div>
              <button onClick={() => setViewingReport(null)} className="text-white hover:text-red-400 bg-white/10 p-2 rounded-lg transition-colors">Close Viewer ✕</button>
            </div>
            <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center">
              {/* Mock High-Res Viewer Content */}
              <div className="bg-white border border-slate-200 shadow-sm w-full max-w-2xl h-full p-10 flex flex-col text-center justify-center rounded-lg">
                <div className="text-blue-600 mb-4 flex justify-center">
                  <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Finalized Clinical Report</h2>
                <p className="text-slate-500 mb-6">Patient: <span className="font-semibold text-slate-700">{viewingReport.patient}</span></p>
                
                <div className="grid grid-cols-2 gap-4 text-left border-t border-slate-200 pt-6 mt-2">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Biomarker Alpha</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">Normal</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Biomarker Beta</div>
                    <div className="text-lg font-bold text-emerald-600 mt-1">Optimal</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Hematocrit</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">42%</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Glucose</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">92 mg/dL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
