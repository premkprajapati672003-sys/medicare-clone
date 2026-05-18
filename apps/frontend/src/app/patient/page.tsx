"use client";

import { useEffect, useState } from 'react';

const API = 'http://127.0.0.1:3002';

export default function PatientPortal() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<any>({ records: [], prescriptions: [] });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'billing'>('overview');
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Appointment states
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  // Lab booking states
  const [labFacility, setLabFacility] = useState('Central City Lab');
  const [labProcedure, setLabProcedure] = useState('');
  const [labDoctor, setLabDoctor] = useState('');
  const [labStatus, setLabStatus] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      const safeFetch = async (url: string) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      };

      safeFetch(`${API}/api/patients/${user.id}/history`).then(d => d && setHistory(d));
      safeFetch(`${API}/api/patients/${user.id}/invoices`).then(d => d && setInvoices(d));
      safeFetch(`${API}/api/patients/${user.id}/notifications`).then(d => d && setNotifications(d));
    } else {
      window.location.href = '/login/patient';
    }
    fetch(`${API}/api/doctors`).then(r => r.json()).then(d => setDoctors(d)).catch(() => {});
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!appointmentDate || !appointmentTime) {
      setBookingStatus('Please select date and time.');
      return;
    }
    setBookingStatus('Scheduling...');

    const start = new Date(`${appointmentDate}T${appointmentTime}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

    const res = await fetch(`${API}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        doctorId: selectedDoctor,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        appointmentType: 'IN_PERSON'
      })
    });

    if (res.ok) {
      setBookingStatus('Appointment booked successfully.');
      setSelectedDoctor('');
      setAppointmentDate('');
      setAppointmentTime('');
      fetch(`${API}/api/patients/${currentUser.id}/notifications`).then(r => r.json()).then(d => setNotifications(d));
      setTimeout(() => setBookingStatus(null), 3000);
    } else {
      setBookingStatus('Failed to book.');
    }
  };

  const handleLabBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLabStatus('Requesting...');

    const res = await fetch(`${API}/api/lab-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        doctorId: labDoctor,
        facility: labFacility,
        procedures: [labProcedure],
        doctorsNote: 'Requested by patient'
      })
    });

    if (res.ok) {
      setLabStatus('Lab test requested successfully.');
      setLabProcedure('');
      setLabDoctor('');
      setTimeout(() => setLabStatus(null), 3000);
    } else {
      setLabStatus('Failed to request.');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(async () => {
      await fetch(`${API}/api/invoices/${payingInvoice}/pay`, { method: 'POST' });
      const data = await fetch(`${API}/api/patients/${currentUser.id}/invoices`).then(r => r.json());
      setInvoices(data);
      const notifs = await fetch(`${API}/api/patients/${currentUser.id}/notifications`).then(r => r.json());
      setNotifications(notifs);
      setIsProcessing(false);
      setPayingInvoice(null);
    }, 2000);
  };

  const unpaid = invoices.filter(i => i.status === 'UNPAID').length;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'records', label: 'Health Records' },
    { id: 'billing', label: 'Billing' },
  ] as const;

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif" }}>

      {/* ===== PAGE HEADER ===== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] mb-1">Patient Dashboard</h1>
          <p className="text-sm text-[#64748b]">
            Welcome back, {currentUser?.name || '...'}. Manage your health records and appointments.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('overview')}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Book Appointment
        </button>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Clinical Records</p>
          <p className="text-2xl font-bold text-white">{history.records.length}</p>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Prescriptions</p>
          <p className="text-2xl font-bold text-white">{history.prescriptions.length}</p>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Unpaid Invoices</p>
          <p className={`text-2xl font-bold ${unpaid > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{unpaid}</p>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Notifications</p>
          <p className="text-2xl font-bold text-white">{notifications.length}</p>
        </div>
      </div>

      {/* ===== TAB BAR ===== */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#334155]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-blue-400 border-blue-400'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Notifications */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl">
            <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Recent Notifications</h3>
              <span className="text-xs text-[#64748b]">{notifications.length} total</span>
            </div>
            <div className="divide-y divide-[#334155]">
              {notifications.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-[#64748b]">No notifications yet.</div>
              ) : (
                notifications.slice(0, 5).map((msg: any) => (
                  <div key={msg.id} className="px-6 py-4 flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      msg.type === 'SMS' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {msg.type === 'SMS' ? '💬' : '✉'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-[#e2e8f0] leading-relaxed">{msg.message}</p>
                      <p className="text-xs text-[#64748b] mt-1">{msg.type} • {new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Booking Forms */}
          <div className="flex flex-col gap-6">
            
            {/* Book Appointment */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl">
              <div className="px-6 py-4 border-b border-[#334155]">
                <h3 className="text-sm font-semibold text-[#e2e8f0]">Book Appointment</h3>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleBook}>
                  <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Select Doctor</label>
                  <select
                    className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 mb-5 outline-none focus:border-blue-500 transition-colors"
                    required
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                  >
                    <option value="">-- Choose a doctor --</option>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                  </select>

                  <div className="flex gap-4 mb-5">
                    <div className="flex-1">
                      <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        value={appointmentDate}
                        onChange={e => setAppointmentDate(e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Time</label>
                      <input 
                        type="time" 
                        className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        value={appointmentTime}
                        onChange={e => setAppointmentTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedDoctor || !appointmentDate || !appointmentTime}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-[#334155] disabled:text-[#64748b] text-white py-3 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Book Selected Slot
                  </button>
                </form>
                {bookingStatus && (
                  <div className="mt-4 text-sm font-semibold text-emerald-400">{bookingStatus}</div>
                )}
              </div>
            </div>

            {/* Request Lab Test */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl">
              <div className="px-6 py-4 border-b border-[#334155]">
                <h3 className="text-sm font-semibold text-[#e2e8f0]">Request Lab Test</h3>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleLabBook}>
                  <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Referring Doctor</label>
                  <select
                    className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 mb-4 outline-none focus:border-blue-500 transition-colors"
                    required
                    value={labDoctor}
                    onChange={e => setLabDoctor(e.target.value)}
                  >
                    <option value="">-- Choose a doctor --</option>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                  </select>

                  <div className="flex gap-4 mb-5">
                    <div className="flex-1">
                      <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Facility</label>
                      <select 
                        className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        value={labFacility}
                        onChange={e => setLabFacility(e.target.value)}
                        required
                      >
                        <option value="Central City Lab">Central City Lab</option>
                        <option value="Westside Imaging">Westside Imaging</option>
                        <option value="Downtown Diagnostics">Downtown Diagnostics</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Test</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Blood Test"
                        className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        value={labProcedure}
                        onChange={e => setLabProcedure(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!labDoctor || !labProcedure}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-[#334155] disabled:text-[#64748b] text-white py-3 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Request Lab Test
                  </button>
                </form>
                {labStatus && (
                  <div className="mt-4 text-sm font-semibold text-emerald-400">{labStatus}</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- RECORDS TAB --- */}
      {activeTab === 'records' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl">
          <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#e2e8f0]">Health Records</h3>
            <span className="text-xs text-[#64748b]">{history.records.length} records</span>
          </div>

          {/* Records Table */}
          {history.records.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[#64748b] text-sm">No clinical records on file.</p>
              <p className="text-[#475569] text-xs mt-1">Records will appear here after your first consultation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Record</th>
                    <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Notes</th>
                    <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Attachments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {history.records.map((r: any, i: number) => (
                    <tr key={r.id} className="hover:bg-[#253347] transition-colors">
                      <td className="px-6 py-4 text-sm text-[#e2e8f0] font-medium">Record #{i + 1}</td>
                      <td className="px-6 py-4 text-sm text-[#94a3b8] max-w-md"><p className="line-clamp-2">{r.clinicalNotes}</p></td>
                      <td className="px-6 py-4">
                        {r.attachments && r.attachments.length > 0 && r.attachments[0] ? (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Has attachment</span>
                        ) : (
                          <span className="text-xs text-[#475569]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Prescriptions Section */}
          {history.prescriptions.length > 0 && (
            <>
              <div className="px-6 py-3 border-t border-[#334155]">
                <h4 className="text-xs text-[#64748b] uppercase tracking-wider font-semibold">Active Prescriptions</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#334155]">
                      <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Medication</th>
                      <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Dosage</th>
                      <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Repeats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {history.prescriptions.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#253347] transition-colors">
                        <td className="px-6 py-4 text-sm text-[#e2e8f0] font-medium">{p.medicationName}</td>
                        <td className="px-6 py-4 text-sm text-[#94a3b8]">{p.dosage}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">{p.repeatsAllowed} remaining</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- BILLING TAB --- */}
      {activeTab === 'billing' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl">
          <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#e2e8f0]">Invoices</h3>
            <span className="text-xs text-[#64748b]">{invoices.length} total</span>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[#64748b] text-sm">No invoices on file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Invoice</th>
                    <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Amount</th>
                    <th className="text-left text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Status</th>
                    <th className="text-right text-xs text-[#64748b] uppercase tracking-wider font-medium px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {invoices.map((inv: any, i: number) => (
                    <tr key={inv.id} className="hover:bg-[#253347] transition-colors">
                      <td className="px-6 py-4 text-sm text-[#e2e8f0] font-medium">INV-{String(i + 1).padStart(4, '0')}</td>
                      <td className="px-6 py-4 text-sm text-[#e2e8f0] font-semibold">${inv.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {inv.status === 'PAID' ? '✓ Paid' : '○ Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'UNPAID' ? (
                          <button
                            onClick={() => setPayingInvoice(inv.id)}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-xs text-[#475569]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-white mb-1">Secure Checkout</h2>
            <p className="text-sm text-[#64748b] mb-8">Mock Stripe Payment Gateway</p>
            <form onSubmit={handlePay}>
              <div className="mb-5">
                <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Cardholder</label>
                <input type="text" className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500" required defaultValue={currentUser?.name} />
              </div>
              <div className="mb-5">
                <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Card Number</label>
                <input type="text" className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500" required placeholder="4242 4242 4242 4242" />
              </div>
              <div className="flex gap-4 mb-8">
                <div className="flex-1">
                  <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">Expiry</label>
                  <input type="text" className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500" required placeholder="MM/YY" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[#94a3b8] uppercase tracking-wider mb-2">CVC</label>
                  <input type="text" className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500" required placeholder="123" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setPayingInvoice(null)} disabled={isProcessing} className="flex-1 bg-[#334155] hover:bg-[#475569] text-white py-3 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={isProcessing} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold transition-colors">
                  {isProcessing ? 'Processing...' : 'Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
