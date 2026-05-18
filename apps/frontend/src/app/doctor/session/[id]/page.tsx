"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://127.0.0.1:3002';

export default function DoctorSession({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;
  const router = useRouter();

  const [appointment, setAppointment] = useState<any>(null);
  const [history, setHistory] = useState<any>({ records: [], prescriptions: [] });
  const [doctor, setDoctor] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);

  // SOAP Notes
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('');

  // Quick Action State
  const [rxMed, setRxMed] = useState('');
  const [rxDose, setRxDose] = useState('');
  const [labPanel, setLabPanel] = useState('');
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const doc = JSON.parse(userStr);
    setDoctor(doc);

    // Mark as IN_PROGRESS
    fetch(`${API}/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });

    fetch(`${API}/api/appointments/${appointmentId}`)
      .then(r => r.json())
      .then(apt => {
        setAppointment(apt);
        // Fetch patient details
        fetch(`${API}/api/patients`).then(r => r.json()).then(patients => {
          const p = patients.find((p: any) => p.id === apt.patientId);
          setPatient(p);
        });
        return fetch(`${API}/api/patients/${apt.patientId}/history`);
      })
      .then(r => r.json())
      .then(d => setHistory(d))
      .catch(console.error);
  }, [appointmentId]);

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedNotes = `[S] ${subjective}\n[O] ${objective}\n[A] ${assessment}\n[P] ${plan}`;
    await fetch(`${API}/api/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        clinicalNotes: combinedNotes,
        attachments: null
      })
    });
    
    // Auto complete appointment when signing note
    await fetch(`${API}/api/appointments/${appointmentId}/complete`, { method: 'PUT' });
    router.push('/doctor/appointments');
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxMed || !rxDose) return;
    await fetch(`${API}/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: appointment.patientId,
        doctorId: doctor.id,
        medicationName: rxMed,
        dosage: rxDose,
        repeatsAllowed: 0
      })
    });
    setRxMed(''); setRxDose('');
    setStatusMsg('Prescription added.');
    setTimeout(() => setStatusMsg(''), 3000);
    // Refresh history
    const d = await fetch(`${API}/api/patients/${appointment.patientId}/history`).then(r => r.json());
    setHistory(d);
  };

  const handleOrderLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labPanel) return;
    await fetch(`${API}/api/lab-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: appointment.patientId,
        doctorId: doctor.id,
        facility: 'Internal Lab',
        procedures: labPanel,
        doctorsNote: 'Ordered during consultation'
      })
    });
    setLabPanel('');
    setStatusMsg(`Ordered ${labPanel}`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleBookFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp) return;
    
    const start = new Date();
    if (followUp === '1w') start.setDate(start.getDate() + 7);
    else if (followUp === '2w') start.setDate(start.getDate() + 14);
    else if (followUp === '1m') start.setMonth(start.getMonth() + 1);
    else if (followUp === '3m') start.setMonth(start.getMonth() + 3);
    
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    await fetch(`${API}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: appointment.patientId,
        doctorId: doctor.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        appointmentType: 'IN_PERSON'
      })
    });
    setFollowUp('');
    setStatusMsg('Follow-up scheduled.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (!appointment || !patient) return <div className="empty-state">Loading clinical session...</div>;

  const initials = patient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Active Consultation</div>
          <div className="page-subtitle">
            <span className="status-badge in_progress">IN PROGRESS</span>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn" onClick={() => router.push('/doctor/appointments')}>← Calendar</button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'var(--status-completed-bg)', color: '#065f46', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          {statusMsg}
        </div>
      )}

      {/* Strict 12-Column Grid */}
      <div className="grid-cols-12" style={{ alignItems: 'start' }}>
        
        {/* LEFT PANEL: Patient Context */}
        <div className="col-span-3 card" style={{ position: 'sticky', top: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="avatar avatar-purple" style={{ width: '48px', height: '48px', fontSize: '18px' }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{patient.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {patient.id.slice(0,6)} {patient.age ? `• ${patient.age} yrs` : ''}</div>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div className="form-label">Latest Vitals</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No vitals recorded yet. Record during consultation.</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div className="form-label">Active Allergies</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None recorded</div>
          </div>

          <div>
            <div className="form-label">Current Medications</div>
            {history.prescriptions.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No active meds.</div>
            ) : (
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {history.prescriptions.map((p: any) => (
                  <li key={p.id} style={{ marginBottom: '4px' }}><strong>{p.medicationName}</strong> {p.dosage}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* CENTER PANEL: SOAP Note */}
        <div className="col-span-6 card">
          <div className="card-title" style={{ marginBottom: '16px' }}>Clinical SOAP Note</div>
          <form onSubmit={handleSaveNotes}>
            <div className="soap-section">
              <div className="soap-label soap-label-s">S — Subjective (Patient complaints)</div>
              <textarea className="form-control" rows={3} value={subjective} onChange={e => setSubjective(e.target.value)} required />
            </div>
            <div className="soap-section">
              <div className="soap-label soap-label-o">O — Objective (Observations, Vitals)</div>
              <textarea className="form-control" rows={3} value={objective} onChange={e => setObjective(e.target.value)} required />
            </div>
            <div className="soap-section">
              <div className="soap-label soap-label-a">A — Assessment (Diagnosis)</div>
              <textarea className="form-control" rows={2} value={assessment} onChange={e => setAssessment(e.target.value)} required />
            </div>
            <div className="soap-section">
              <div className="soap-label soap-label-p">P — Plan (Treatment, Next Steps)</div>
              <textarea className="form-control" rows={2} value={plan} onChange={e => setPlan(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '8px' }}>Complete & Sign Note</button>
          </form>
        </div>

        {/* RIGHT PANEL: Quick Actions */}
        <div className="col-span-3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>+ New Prescription</div>
            <form onSubmit={handlePrescribe}>
              <div className="form-group">
                <input type="text" className="form-control" placeholder="Search medication..." value={rxMed} onChange={e => setRxMed(e.target.value)} required />
              </div>
              <div className="form-group">
                <input type="text" className="form-control" placeholder="Dosage (e.g., 50mg daily)" value={rxDose} onChange={e => setRxDose(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Add Rx</button>
            </form>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>+ Order Lab Test</div>
            <form onSubmit={handleOrderLab}>
              <select className="form-control" style={{ marginBottom: '8px' }} value={labPanel} onChange={e => setLabPanel(e.target.value)} required>
                <option value="">Select lab panel...</option>
                <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel</option>
                <option value="Complete Blood Count">Complete Blood Count</option>
                <option value="Lipid Panel">Lipid Panel</option>
              </select>
              <button type="submit" className="btn btn-sm" style={{ width: '100%' }}>Order Lab</button>
            </form>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>+ Book Follow-up</div>
            <form onSubmit={handleBookFollowUp}>
              <select className="form-control" style={{ marginBottom: '8px' }} value={followUp} onChange={e => setFollowUp(e.target.value)} required>
                <option value="">Select timeframe...</option>
                <option value="1w">In 1 week</option>
                <option value="2w">In 2 weeks</option>
                <option value="1m">In 1 month</option>
                <option value="3m">In 3 months</option>
              </select>
              <button type="submit" className="btn btn-sm" style={{ width: '100%' }}>Schedule</button>
            </form>
          </div>

        </div>

      </div>
    </>
  );
}
