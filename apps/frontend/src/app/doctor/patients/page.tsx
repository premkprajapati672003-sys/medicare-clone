"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://127.0.0.1:3002';

export default function PatientsRegistryPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const router = useRouter();
  
  // Widget states
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [widgets, setWidgets] = useState({
    kpis: true,
    charts: true
  });
  
  // Create Patient states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newPatient, setNewPatient] = useState({
    name: '', email: '', phone: '', age: '', gender: 'Male', department: 'Cardiology', diagnosis: '', inpatientStatus: 'OUTPATIENT', insuranceType: 'Private'
  });

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const doc = JSON.parse(userStr);
    if (doc.role !== 'DOCTOR') { window.location.href = '/login'; return; }

    fetch(`${API}/api/patients`)
      .then(r => r.json()).then(d => setPatients(d));

    fetch(`${API}/api/doctors/${doc.id}/patients-analytics`)
      .then(r => r.json()).then(d => setAnalytics(d));
  }, []);

  const openEHR = (patient: any) => {
    router.push(`/doctor/ehr/${patient.id}`);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create patient');
      }
      const data = await res.json();
      setPatients([data, ...patients]);
      setShowCreateModal(false);
      setNewPatient({ name: '', email: '', phone: '', age: '', gender: 'Male', department: 'Cardiology', diagnosis: '', inpatientStatus: 'OUTPATIENT', insuranceType: 'Private' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute department distribution from real patient data for bar chart
  const deptCounts: Record<string, number> = {};
  patients.forEach(p => {
    const dept = p.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const deptBars = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count: count as number }));
  const maxDeptCount = Math.max(...deptBars.map(d => d.count), 1);

  // Insurance from real analytics
  const totalIns = analytics ? (analytics.insurance.private + analytics.insurance.medicare + analytics.insurance.medicaid + analytics.insurance.uninsured) : 0;
  const privatePct = totalIns > 0 ? (analytics.insurance.private / totalIns) * 100 : 0;
  const medicarePct = totalIns > 0 ? (analytics.insurance.medicare / totalIns) * 100 : 0;
  const medicaidPct = totalIns > 0 ? (analytics.insurance.medicaid / totalIns) * 100 : 0;
  const uninsuredPct = totalIns > 0 ? (analytics.insurance.uninsured / totalIns) * 100 : 0;

  // Status counts from real data
  const inpatientCount = patients.filter(p => p.inpatientStatus === 'INPATIENT').length;
  const outpatientCount = patients.filter(p => p.inpatientStatus !== 'INPATIENT').length;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {patients.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${['bg-blue-100', 'bg-purple-100', 'bg-emerald-100'][i]} z-${30 - i * 10}`}>
                {p.name?.charAt(0) || '?'}
              </div>
            ))}
            {patients.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold z-0 text-slate-500">+{patients.length - 3}</div>
            )}
          </div>
          <button onClick={() => setShowWidgetModal(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Manage Widgets
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {showBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-50 text-white flex items-center justify-center text-xs font-bold">i</div>
            <p className="text-sm font-medium text-emerald-800">Patient registry is live. All data shown is from the database.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBanner(false)} className="text-emerald-700 font-bold hover:text-emerald-900">✕</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="text-sm text-slate-500 font-medium">{patients.length} patients registered</div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-md text-sm font-bold text-white hover:bg-emerald-600 transition-colors shadow-sm">
            <span>+</span> Create New
          </button>
        </div>
      </div>

      {widgets.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* KPI 1 - Patient Enrollment */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Patient Enrollment</h3>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <div className="text-3xl font-bold text-slate-900">{analytics?.enrollment ?? patients.length}</div>
          </div>
          <div className="text-xs text-slate-400">Total registered patients</div>
        </div>

        {/* KPI 2 - Patient Visits */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Patient Visits</h3>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <div className="text-3xl font-bold text-slate-900">{analytics?.visits ?? 0}</div>
          </div>
          <div className="text-xs text-slate-400">Calculated from records</div>
        </div>

        {/* KPI 3 - Active Cases (Inpatient) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Active Cases</h3>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <div className="text-3xl font-bold text-slate-900">{analytics?.activeCases ?? inpatientCount}</div>
          </div>
          <div className="text-xs text-slate-400">Inpatient status</div>
        </div>

        {/* KPI 4 - Inactive Cases (Outpatient) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Inactive Cases</h3>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <div className="text-3xl font-bold text-slate-900">{analytics?.inactiveCases ?? outpatientCount}</div>
          </div>
          <div className="text-xs text-slate-400">Outpatient status</div>
        </div>
        </div>
      )}

      {/* Middle Section: Charts */}
      {widgets.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-6 mb-6">
        {/* Department Distribution Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-500">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M4 20h16v2H4zM6 10h4v8H6zM14 4h4v14h-4z"></path></svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">Patients by Department</h3>
            </div>
          </div>

          <div className="relative h-[220px] flex items-end justify-between px-4 pb-6 mt-4">
            <div className="relative z-10 w-full h-full flex items-end justify-around pl-8">
              {deptBars.length === 0 ? (
                <div className="flex items-center justify-center w-full text-slate-400 text-sm">No department data available</div>
              ) : (
                deptBars.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                    <div className="text-xs font-bold text-slate-700 mb-1">{data.count}</div>
                    <div className="flex items-end gap-1.5 h-[180px]">
                      <div className="w-10 bg-sky-400 rounded-t-sm transition-all hover:opacity-80" style={{ height: `${(data.count / maxDeptCount) * 100}%` }}></div>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 absolute -bottom-6 whitespace-nowrap">{data.dept.length > 12 ? data.dept.slice(0, 12) + '…' : data.dept}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Insurance Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-500">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">Insurance Coverage</h3>
            </div>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <div className="text-3xl font-bold text-slate-900">{totalIns}</div>
            <div className="text-xs text-slate-400 mb-1">total patients</div>
          </div>

          <div className="flex-1 flex items-center justify-between">
            {/* Donut SVG */}
            <div className="relative w-48 h-48 ml-4">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                {totalIns > 0 && (
                  <>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="20" strokeDasharray={`${(privatePct/100)*251} 251`} strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#38bdf8" strokeWidth="20" strokeDasharray={`${(medicarePct/100)*251} 251`} strokeDashoffset={`-${(privatePct/100)*251}`} />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="20" strokeDasharray={`${(medicaidPct/100)*251} 251`} strokeDashoffset={`-${((privatePct+medicarePct)/100)*251}`} />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray={`${(uninsuredPct/100)*251} 251`} strokeDashoffset={`-${((privatePct+medicarePct+medicaidPct)/100)*251}`} />
                  </>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-4 pr-4">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span><span className="text-sm text-slate-600 font-medium">Private</span></div>
                <span className="font-bold text-slate-900 text-sm">{analytics?.insurance?.private ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span><span className="text-sm text-slate-600 font-medium">Medicare</span></div>
                <span className="font-bold text-slate-900 text-sm">{analytics?.insurance?.medicare ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span className="text-sm text-slate-600 font-medium">Medicaid</span></div>
                <span className="font-bold text-slate-900 text-sm">{analytics?.insurance?.medicaid ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span><span className="text-sm text-slate-600 font-medium">Uninsured</span></div>
                <span className="font-bold text-slate-900 text-sm">{analytics?.insurance?.uninsured ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Patient List Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-500">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">Patient List</h3>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input 
                type="text" placeholder="Search Patient.." 
                className="w-full sm:w-64 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 hover:bg-slate-50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" /></th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Patient ID</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Patient name</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Age</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Gender</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Department</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Primary Diagnosis</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500">Status</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-slate-500">Loading patients or no patients registered.</td>
                </tr>
              ) : (
                patients.map((p) => {
                  const initials = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  const id = p.id.replace(/\D/g, '').slice(0, 5) || '00000';
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openEHR(p)}>
                      <td className="py-4 px-4"><input type="checkbox" onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" /></td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">00{id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{initials}</div>
                          <span className="text-sm font-bold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">{p.age ?? '—'}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">{p.gender ?? '—'}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">{p.department ?? '—'}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">{p.diagnosis ?? '—'}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded font-bold tracking-wide ${
                          p.inpatientStatus === 'INPATIENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {p.inpatientStatus ?? '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 hover:text-slate-700 text-center text-lg leading-none cursor-pointer">
                        ⋮
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Widgets Modal */}
      {showWidgetModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWidgetModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Manage Widgets</h3>
              <button onClick={() => setShowWidgetModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-slate-800">KPI Summary</div>
                  <div className="text-sm text-slate-500">Top row statistics (Enrollment, Visits)</div>
                </div>
                <input type="checkbox" className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500" checked={widgets.kpis} onChange={e => setWidgets({...widgets, kpis: e.target.checked})} />
              </label>

              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-slate-800">Analytics Charts</div>
                  <div className="text-sm text-slate-500">Department & Insurance distribution</div>
                </div>
                <input type="checkbox" className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500" checked={widgets.charts} onChange={e => setWidgets({...widgets, charts: e.target.checked})} />
              </label>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowWidgetModal(false)} className="px-5 py-2 bg-emerald-500 rounded-lg text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Patient Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => !isSubmitting && setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Register New Patient</h3>
              <button onClick={() => !isSubmitting && setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600" disabled={isSubmitting}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreatePatient} className="flex-1 overflow-y-auto p-6">
              {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required type="text" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input required type="email" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="text" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input type="number" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" placeholder="45" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select value={newPatient.department} onChange={e => setNewPatient({...newPatient, department: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500">
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={newPatient.inpatientStatus} onChange={e => setNewPatient({...newPatient, inpatientStatus: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500">
                    <option value="OUTPATIENT">Outpatient</option>
                    <option value="INPATIENT">Inpatient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance</label>
                  <select value={newPatient.insuranceType} onChange={e => setNewPatient({...newPatient, insuranceType: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500">
                    <option value="Private">Private</option>
                    <option value="Medicare">Medicare</option>
                    <option value="Medicaid">Medicaid</option>
                    <option value="Uninsured">Uninsured</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Diagnosis (Optional)</label>
                  <input type="text" value={newPatient.diagnosis} onChange={e => setNewPatient({...newPatient, diagnosis: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" placeholder="e.g. Hypertension" />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-emerald-500 rounded-lg text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
