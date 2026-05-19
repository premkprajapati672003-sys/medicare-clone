"use client";

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://127.0.0.1:3002';

// Rich Database-Aligned Mock Encounters
const MOCK_PATIENT_HISTORY: Record<string, any[]> = {
  'neo@example.com': [
    {
      id: 'mock-e1',
      title: 'Endocrine Consultation & Thyroid Evaluation',
      date: '2018-09-08',
      time: '10:00 AM',
      type: 'TELEHEALTH',
      notes: 'Patient reports mild improvements in energy levels but continues to experience cold intolerance and dry skin. Levothyroxine dosage reviewed. Complete blood count and lipid panels ordered to check metabolic parameters. Heart rate stable at 68 bpm. Advised active exercise and low-glycemic dietary regime.',
      procedures: ['Blood Panel', 'Lipid Test'],
      prescribed: [
        { medication: 'Levothyroxine (Synthroid)', dosage: '50 mcg daily', repeats: 5 }
      ],
      invoice: {
        invoiceNum: 'INV-000181',
        amount: 1400.00,
        status: 'SENT',
        date: '2018-09-08',
        dueDate: '2018-09-24',
        items: [
          { description: 'Clinical EMG Support System', qty: 2, rate: 400.00, amount: 800.00 },
          { description: 'Rosewood Frame Orthosis Support', qty: 1, rate: 600.00, amount: 600.00 }
        ]
      }
    },
    {
      id: 'mock-e2',
      title: 'Initial Thyroid Intake & Diagnostics',
      date: '2018-08-20',
      time: '02:30 PM',
      type: 'IN_PERSON',
      notes: 'Initial clinical presentation of fatigue, weight fluctuations, and unexplained brain fog. Physical exam of neck reveals minor thyroid enlargement (goiter). Serum TSH level significantly elevated at 8.2 mIU/L, confirming primary hypothyroidism. Initiated hormone replacement therapy with Levothyroxine 50 mcg.',
      procedures: ['TSH Receptor Antibody Serum Test'],
      prescribed: [
        { medication: 'Levothyroxine (Synthroid)', dosage: '50 mcg daily', repeats: 6 }
      ],
      invoice: {
        invoiceNum: 'INV-000170',
        amount: 250.00,
        status: 'PAID',
        date: '2018-08-20',
        dueDate: '2018-09-04',
        items: [
          { description: 'Specialist Endocrinal Consultation', qty: 1, rate: 250.00, amount: 250.00 }
        ]
      }
    }
  ],
  'batman@example.com': [
    {
      id: 'mock-e3',
      title: 'Emergency Trauma Consultation',
      date: '2018-09-02',
      time: '11:15 PM',
      type: 'IN_PERSON',
      notes: 'Patient presented following a high-impact fall during training. Significant localized bruising and pain over right lateral thoracic wall. Deep breaths elicit acute discomfort. Clinical palpation indicates severe tenderness on ribs 7-9. Oblique chest X-ray confirms hairline fracture of the 7th rib. Lung fields are clear. No pneumothorax. Prescribed Ibuprofen 600mg for pain control and ordered absolute rest.',
      procedures: ['Oblique Thoracic X-Ray Scan'],
      prescribed: [
        { medication: 'Ibuprofen (Advil)', dosage: '600 mg every 8 hours as needed', repeats: 2 }
      ],
      invoice: {
        invoiceNum: 'INV-000180',
        amount: 80.00,
        status: 'PENDING APPROVAL',
        date: '2018-09-02',
        dueDate: '2018-09-17',
        items: [
          { description: 'Emergency Trauma Consultation Fee', qty: 1, rate: 80.00, amount: 80.00 }
        ]
      }
    },
    {
      id: 'mock-e4',
      title: 'Orthopedic Rehabilitation Follow-Up',
      date: '2018-05-04',
      time: '09:00 AM',
      type: 'IN_PERSON',
      notes: 'Routine clinical review of previous right shoulder subluxation. Passive range of motion in abduction is fully restored to 180 degrees. Mild tenderness remains on terminal internal rotation. Completed clinical ultrasound of rotator cuff showing intact supraspinatus tendon with resolving subdeltoid bursitis. Continue rehabilitation exercises.',
      procedures: ['Musculoskeletal Ultrasound Scan'],
      prescribed: [],
      invoice: {
        invoiceNum: 'INV-000151',
        amount: 2097.00,
        status: 'PAID',
        date: '2018-05-04',
        dueDate: '2018-05-19',
        items: [
          { description: 'Comprehensive Joint Ultrasound Scan', qty: 1, rate: 1200.00, amount: 1200.00 },
          { description: 'Orthopedic Physical Rehabilitation Session', qty: 3, rate: 299.00, amount: 897.00 }
        ]
      }
    }
  ]
};

export default function DoctorEHR({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any>({ records: [], prescriptions: [], appointments: [], labOrders: [], invoices: [] });
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'documents'>('timeline');
  const [standaloneDocs, setStandaloneDocs] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  // Medication Routine Modal States
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<any>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: 'Once daily',
    timings: 'Morning',
    instructions: 'Take after food',
    repeatsAllowed: '0'
  });

  const fetchHistory = async () => {
    try {
      const r = await fetch(`${API}/api/patients/${patientId}/history`);
      if (r.ok) {
        const d = await r.json();
        setHistory(d);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    fetch(`${API}/api/patients`)
      .then(r => r.json())
      .then(patients => {
        if (!patients) return;
        const p = patients.find((p: any) => p.id === patientId);
        setPatient(p);
      })
      .catch(() => {});
    
    fetchHistory();
    fetch(`${API}/api/patients/${patientId}/documents`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setStandaloneDocs(d || []))
      .catch(() => {});
  }, [patientId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch(`${API}/api/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      const sizeStr = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB';
      const type = uploadData.type.includes('image') ? 'image' : uploadData.type.includes('video') ? 'video' : uploadData.type.includes('audio') ? 'audio' : 'document';

      const docRes = await fetch(`${API}/api/patients/${patientId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploaderId: currentUser.id,
          name: uploadData.name,
          url: uploadData.url,
          size: sizeStr,
          type
        })
      });
      const savedDoc = await docRes.json();
      setStandaloneDocs(prev => [savedDoc, ...prev]);
    } catch (err) {
      console.error('Document upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to parse Delimited Dosage strings
  const parseDosage = (dosageStr: string) => {
    if (!dosageStr) return { dosage: '—', frequency: 'Once daily', timings: 'Morning', instructions: 'Take after food' };
    if (dosageStr.includes('|')) {
      const parts = dosageStr.split('|').map(s => s.trim());
      return {
        dosage: parts[0] || '—',
        frequency: parts[1] || 'Once daily',
        timings: parts[2] || 'Morning',
        instructions: parts[3] || 'Take after food'
      };
    }
    return {
      dosage: dosageStr,
      frequency: 'Once daily',
      timings: 'Morning',
      instructions: 'Take after food'
    };
  };

  // Submitting Medication Add or Edit
  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !patient) return;

    const combinedDosage = `${prescriptionForm.dosage} | ${prescriptionForm.frequency} | ${prescriptionForm.timings} | ${prescriptionForm.instructions}`;

    const url = editingPrescription ? `${API}/api/prescriptions/${editingPrescription.id}` : `${API}/api/prescriptions`;
    const method = editingPrescription ? 'PUT' : 'POST';

    const body = editingPrescription ? {
      medicationName: prescriptionForm.medicationName,
      dosage: combinedDosage,
      repeatsAllowed: parseInt(prescriptionForm.repeatsAllowed) || 0
    } : {
      patientId: patient.id,
      doctorId: currentUser.id,
      medicationName: prescriptionForm.medicationName,
      dosage: combinedDosage,
      repeatsAllowed: parseInt(prescriptionForm.repeatsAllowed) || 0
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      fetchHistory();
      setShowPrescriptionModal(false);
      setEditingPrescription(null);
      setPrescriptionForm({
        medicationName: '',
        dosage: '',
        frequency: 'Once daily',
        timings: 'Morning',
        instructions: 'Take after food',
        repeatsAllowed: '0'
      });
    }
  };

  const handleEditClick = (p: any) => {
    const details = parseDosage(p.dosage);
    setEditingPrescription(p);
    setPrescriptionForm({
      medicationName: p.medicationName,
      dosage: details.dosage,
      frequency: details.frequency,
      timings: details.timings,
      instructions: details.instructions,
      repeatsAllowed: p.repeatsAllowed.toString()
    });
    setShowPrescriptionModal(true);
  };

  const handlePrescriptionDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medication routine?')) return;
    const res = await fetch(`${API}/api/prescriptions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchHistory();
    }
  };

  if (!patient) return <div className="empty-state">Loading EHR...</div>;

  // Compile Dynamic Database Encounters
  const dbEncounters = (history.records || []).map((rec: any) => {
    const apt = (history.appointments || []).find((a: any) => a.id === rec.appointmentId);
    const inv = (history.invoices || []).find((i: any) => i.appointmentId === rec.appointmentId);
    
    const matchingLabs = (history.labOrders || [])
      .filter((l: any) => l.patientId === patientId)
      .flatMap((l: any) => l.procedures || []);

    const dateStr = apt ? new Date(apt.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const timeStr = apt ? new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
    
    return {
      id: rec.id,
      title: 'Clinical Consultation Encounter',
      date: dateStr,
      time: timeStr,
      type: apt ? apt.appointmentType : 'IN_PERSON',
      notes: rec.clinicalNotes,
      procedures: matchingLabs.length > 0 ? matchingLabs : [],
      prescribed: (history.prescriptions || []).map((p: any) => ({
        medication: p.medicationName,
        dosage: parseDosage(p.dosage).dosage,
        repeats: `${p.repeatsAllowed} repeats`
      })),
      invoice: inv ? {
        invoiceNum: `INV-${inv.id.slice(0, 6).toUpperCase()}`,
        amount: inv.amount,
        status: inv.status,
        date: dateStr,
        dueDate: dateStr,
        items: [{ description: 'General Consultation Service', qty: 1, rate: inv.amount, amount: inv.amount }]
      } : null
    };
  });

  // Pull Mock Encounters if available
  const mockEncounters = MOCK_PATIENT_HISTORY[patient.email] || [];

  // Combine & Sort by Date (Descending)
  const allEncounters = [...dbEncounters, ...mockEncounters].sort((a, b) => b.date.localeCompare(a.date));

  // Search Filter Implementation
  const filteredEncounters = allEncounters.filter(enc => {
    const q = searchQuery.toLowerCase();
    const notesMatch = enc.notes?.toLowerCase().includes(q);
    const titleMatch = enc.title?.toLowerCase().includes(q);
    const procMatch = enc.procedures?.some((p: string) => p.toLowerCase().includes(q));
    const medMatch = enc.prescribed?.some((p: any) => p.medication.toLowerCase().includes(q));
    const invMatch = enc.invoice?.invoiceNum.toLowerCase().includes(q);
    return notesMatch || titleMatch || procMatch || medMatch || invMatch;
  });

  // Extract documents/attachments
  const documents = history.records
    .filter((r: any) => r.attachments && r.attachments.length > 0)
    .flatMap((r: any, idx: number) => 
      r.attachments.map((att: string, aIdx: number) => ({
        id: `${r.id}-${aIdx}`,
        name: att || `Attachment ${idx + 1}`,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
        icon: att?.includes('.pdf') ? '📄' : att?.includes('.png') || att?.includes('.img') ? '🖼️' : '📊'
      }))
    );

  // Compile combined real + mock prescriptions
  const combinedPrescriptions = [
    ...(history.prescriptions || []),
    ...mockEncounters.flatMap((enc: any, idx: number) => 
      (enc.prescribed || []).map((p: any, pIdx: number) => ({
        id: `mock-rx-${idx}-${pIdx}`,
        medicationName: p.medication,
        dosage: p.dosage,
        repeatsAllowed: p.repeats || 0,
        isMock: true
      }))
    )
  ];

  return (
    <>
      {/* Scoped CSS styling for Visit Cards and absolute-positioned CRM Invoice Sheet Modals */}
      <style>{`
        .search-timeline-bar {
          margin-bottom: 24px;
          display: flex;
          gap: 12px;
          width: 100%;
          max-width: 800px;
        }

        .search-timeline-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 13px;
          outline: none;
          background: #ffffff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-timeline-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Timeline Card Structure */
        .timeline-card-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 800px;
        }

        .visit-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }

        .visit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
        }

        .visit-header {
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .visit-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .badge-telehealth {
          background: #e0e7ff;
          color: #4f46e5;
        }

        .badge-inperson {
          background: #d1fae5;
          color: #065f46;
        }

        .visit-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .visit-notes {
          font-size: 13.5px;
          color: #334155;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .visit-details-group {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 6px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .detail-item.diagnostic {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #b45309;
        }

        .detail-item.prescribed {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          color: #15803d;
        }

        .detail-item.invoice-ref {
          background: #edf2f7;
          border: 1px solid #e2e8f0;
          color: #2b6cb0;
          cursor: pointer;
          transition: background 0.15s;
        }

        .detail-item.invoice-ref:hover {
          background: #e2e8f0;
        }

        /* Zoho Sheet Invoice Modal Overlay */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .invoice-sheet {
          background: #ffffff;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 8px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          padding: 50px 60px;
          font-family: 'Open Sans', 'Inter', sans-serif;
        }

        .invoice-sheet-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #64748b;
          transition: background 0.15s;
        }

        .invoice-sheet-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Diagonal Ribbon */
        .sheet-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 120px;
          overflow: hidden;
          pointer-events: none;
        }

        .sheet-ribbon-text {
          position: absolute;
          top: 30px;
          left: -30px;
          width: 180px;
          text-align: center;
          transform: rotate(-45deg);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          color: white;
          padding: 4px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-transform: uppercase;
        }

        .ribbon-sent { background: #3b82f6; }
        .ribbon-paid { background: #10b981; }
        .ribbon-voided { background: #ef4444; }
        .ribbon-pending { background: #f59e0b; }

        .invoice-sheet-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 24px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 32px;
          margin-bottom: 32px;
        }

        .invoice-table th {
          background: #1e293b;
          color: white;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          text-transform: uppercase;
        }

        .invoice-table td {
          padding: 16px 14px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #334155;
        }

        .summary-row {
          display: flex;
          justify-content: flex-end;
          gap: 40px;
          font-size: 13px;
          color: #334155;
          margin-bottom: 8px;
        }
      `}</style>

      {/* Main Page Layout */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-title">Electronic Health Record</div>
          <div className="page-subtitle">{patient.name} • ID: {patient.id.slice(0, 8)}</div>
        </div>
        <button className="btn btn-outline" onClick={() => router.push('/doctor/patients')}>
          ← Back to Registry
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Clinical Timeline</button>
        <button className={`tab-btn ${activeTab === 'medications' ? 'active' : ''}`} onClick={() => setActiveTab('medications')}>Medications</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents & Scans</button>
      </div>

      {/* 1. Clinical Timeline Tab */}
      {activeTab === 'timeline' && (
        <div style={{ width: '100%' }}>
          {/* Search Filter Bar */}
          <div className="search-timeline-bar">
            <input 
              type="text" 
              className="search-timeline-input" 
              placeholder="🔍 Search clinical notes, studied procedures, medications, or invoice ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn btn-outline" onClick={() => setSearchQuery('')}>Clear</button>
            )}
          </div>

          {filteredEncounters.length === 0 ? (
            <div className="card" style={{ maxWidth: '800px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm font-semibold">No encounters match your search query.</p>
            </div>
          ) : (
            <div className="timeline-card-grid">
              {filteredEncounters.map(enc => (
                <div key={enc.id} className="visit-card">
                  {/* Card Header */}
                  <div className="visit-header">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{enc.title}</h3>
                      <span className="text-[11px] text-slate-400 font-semibold">{new Date(enc.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {enc.time}</span>
                    </div>
                    <span className={`visit-badge ${enc.type === 'TELEHEALTH' ? 'badge-telehealth' : 'badge-inperson'}`}>
                      {enc.type === 'TELEHEALTH' ? '🎥 Telehealth' : '🏥 In Person'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="visit-body">
                    <p className="visit-notes">{enc.notes}</p>

                    {/* Detailed Groups (Procedures, Prescriptions, Clickable Invoice) */}
                    <div className="visit-details-group">
                      {/* Studied Procedures */}
                      {enc.procedures && enc.procedures.length > 0 && (
                        <div className="detail-item diagnostic" title="Studied/examined clinical labs">
                          <span>🧪 Studied:</span>
                          <span className="font-bold">{enc.procedures.join(', ')}</span>
                        </div>
                      )}

                      {/* Prescribed Items */}
                      {enc.prescribed && enc.prescribed.length > 0 && (
                        <div className="detail-item prescribed" title="Prescribed medications">
                          <span>💊 Prescribed:</span>
                          <span className="font-bold">
                            {enc.prescribed.map((p: any) => `${p.medication} (${p.dosage})`).join('; ')}
                          </span>
                        </div>
                      )}

                      {/* Invoice Reference Badge */}
                      {enc.invoice && (
                        <div 
                          className="detail-item invoice-ref" 
                          onClick={() => setActiveInvoice(enc.invoice)}
                          title="Click to view associated invoice sheet"
                        >
                          <span>💰 Invoiced:</span>
                          <span className="font-bold underline">{enc.invoice.invoiceNum} (${enc.invoice.amount.toFixed(2)})</span>
                          <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                            enc.invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            enc.invoice.status === 'VOIDED' ? 'bg-rose-100 text-rose-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{enc.invoice.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Medications Tab (CONVERTED TO CARDS WITH ADD, EDIT & DELETE ROUTINES) */}
      {activeTab === 'medications' && (
        <div style={{ maxWidth: '900px' }}>
          {/* Header Action Row */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Active Medication Routines</h3>
              <p className="text-xs text-slate-500">Configure daily clinical regimens and synced refills for {patient.name}.</p>
            </div>
            <button 
              onClick={() => {
                setEditingPrescription(null);
                setPrescriptionForm({
                  medicationName: '',
                  dosage: '',
                  frequency: 'Once daily',
                  timings: 'Morning',
                  instructions: 'Take after food',
                  repeatsAllowed: '0'
                });
                setShowPrescriptionModal(true);
              }}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              + Add Medication Routine
            </button>
          </div>

          {combinedPrescriptions.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">💊</div>
              <p className="text-sm font-semibold">No active medication routines prescribed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combinedPrescriptions.map((p: any) => {
                const details = parseDosage(p.dosage);
                return (
                  <div 
                    key={p.id} 
                    className="border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#312e81] transition-all bg-white relative flex flex-col justify-between" 
                    style={{ minHeight: '220px' }}
                  >
                    <div>
                      {/* Top Header: Pill Icon and Status */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
                          💊
                        </div>
                        <div className="flex items-center gap-1">
                          {p.isMock && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">
                              MOCK
                            </span>
                          )}
                          <span className="status-badge scheduled text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ACTIVE
                          </span>
                        </div>
                      </div>

                      {/* Medication Regimen Info */}
                      <h4 className="font-bold text-slate-800 text-base mb-1">{p.medicationName}</h4>
                      
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-400">Dosage:</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">{details.dosage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-400">Frequency:</span>
                          <span>{details.frequency}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-400">Timings:</span>
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium text-[10px]">☀️ {details.timings}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-400">Instructions:</span>
                          <span className="italic text-slate-500">🥣 {details.instructions}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions and Refills row */}
                    <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {p.repeatsAllowed} refills left
                      </span>
                      
                      {!p.isMock && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditClick(p)} 
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handlePrescriptionDelete(p.id)} 
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Documents Tab */}
      {activeTab === 'documents' && (
        <div style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifycontent: 'flex-end', marginBottom: '16px' }}>
            <label className={`btn btn-primary ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isUploading ? 'Uploading...' : '+ Upload Document'}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="doc-grid">
            {standaloneDocs.length === 0 && documents.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No documents or attachments found for this patient.</div>
            ) : (
              <>
                {standaloneDocs.map((doc: any) => (
                  <a href={`${API}${doc.url}`} target="_blank" rel="noopener noreferrer" key={doc.id} className="doc-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="doc-icon">{doc.type === 'image' ? '🖼️' : '📄'}</div>
                    <div className="doc-name" title={doc.name}>{doc.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {doc.size} • {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </a>
                ))}
                {documents.map((doc: any) => (
                  <div key={doc.id} className="doc-card">
                    <div className="doc-icon">{doc.icon}</div>
                    <div className="doc-name" title={doc.name}>{doc.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>{doc.date}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* GORGEOUS CLICKABLE ZOHO INVOICE MODAL SHEET */}
      {activeInvoice && (
        <div className="invoice-modal-overlay" onClick={() => setActiveInvoice(null)}>
          <div className="invoice-sheet" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button className="invoice-sheet-close" onClick={() => setActiveInvoice(null)}>✕</button>

            {/* Diagonal Ribbon */}
            <div className="sheet-ribbon">
              <div className={`sheet-ribbon-text ${
                activeInvoice.status === 'PAID' ? 'ribbon-paid' :
                activeInvoice.status === 'VOIDED' ? 'ribbon-voided' :
                activeInvoice.status === 'SENT' ? 'ribbon-sent' : 'ribbon-pending'
              }`}>
                {activeInvoice.status}
              </div>
            </div>

            {/* Zoho Header */}
            <div className="invoice-sheet-header">
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>HOTDOC CLINICAL</h1>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>54 Zahir Heights, Harmada, India</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 300, color: '#64748b' }}>INVOICE</h2>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '8px' }}>{activeInvoice.invoiceNum}</p>
              </div>
            </div>

            {/* Bill To & Terms */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Bill To</p>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{patient.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{patient.email}</p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{patient.phone || '555-0200'}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                <p style={{ marginBottom: '6px' }}><strong>Invoice Date:</strong> {activeInvoice.date}</p>
                <p style={{ marginBottom: '6px' }}><strong>Terms:</strong> Net 15</p>
                <p><strong>Due Date:</strong> {activeInvoice.dueDate}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Item & Description</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Rate</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeInvoice.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>${item.rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="summary-row">
                <span style={{ color: '#64748b' }}>Sub Total</span>
                <span style={{ fontWeight: 600, width: '100px', textAlign: 'right' }}>${activeInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="summary-row" style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <span>Total</span>
                <span style={{ width: '100px', textAlign: 'right' }}>${activeInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="summary-row" style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb', background: '#f8fafc', padding: '12px 20px', borderRadius: '8px', marginTop: '8px' }}>
                <span>Balance Due</span>
                <span style={{ width: '100px', textAlign: 'right' }}>
                  ${activeInvoice.status === 'PAID' ? '0.00' : activeInvoice.status === 'VOIDED' ? '0.00' : activeInvoice.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '48px', borderTop: '1px solid #f1f5f9', paddingTop: '24px', fontSize: '11px', color: '#94a3b8' }}>
              Thank you for choosing HotDoc Clinical Services. If you have any billing inquiries, please contact billings@hotdoc.com.
            </div>
          </div>
        </div>
      )}

      {/* MEDICATION ROUTINE ADD / EDIT MODAL */}
      {showPrescriptionModal && (
        <div className="modal-overlay">
          <div className="modal-content bg-white" style={{ maxWidth: '480px' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="modal-title">{editingPrescription ? 'Edit Medication Regimen' : 'New Medication Regimen'}</h3>
                <p className="modal-desc text-xs">Configure timings, dosages, and custom routines</p>
              </div>
              <button 
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setEditingPrescription(null);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePrescriptionSubmit}>
              <div className="form-group mb-3">
                <label className="form-label" style={{ fontSize: '11px' }}>Medication Name</label>
                <input 
                  type="text" 
                  className="form-control text-xs" 
                  required
                  placeholder="e.g. Metformin HCL, Levothyroxine"
                  value={prescriptionForm.medicationName}
                  onChange={e => setPrescriptionForm(prev => ({ ...prev, medicationName: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="form-label" style={{ fontSize: '11px' }}>Regimen Dosage</label>
                  <input 
                    type="text" 
                    className="form-control text-xs" 
                    required
                    placeholder="e.g. 50 mcg, 500 mg"
                    value={prescriptionForm.dosage}
                    onChange={e => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="form-label" style={{ fontSize: '11px' }}>Frequency</label>
                  <select 
                    className="form-control text-xs"
                    value={prescriptionForm.frequency}
                    onChange={e => setPrescriptionForm(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times a day">Three times daily</option>
                    <option value="Every 8 hours as needed">Every 8 hours as needed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="form-label" style={{ fontSize: '11px' }}>Target Timings</label>
                  <select 
                    className="form-control text-xs"
                    value={prescriptionForm.timings}
                    onChange={e => setPrescriptionForm(prev => ({ ...prev, timings: e.target.value }))}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Morning & Night">Morning & Night</option>
                    <option value="Breakfast / Lunch / Dinner">Breakfast / Lunch / Dinner</option>
                    <option value="Bedtime only">Bedtime only</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="form-label" style={{ fontSize: '11px' }}>Refills Allowed</label>
                  <input 
                    type="number" 
                    className="form-control text-xs" 
                    required
                    min="0"
                    value={prescriptionForm.repeatsAllowed}
                    onChange={e => setPrescriptionForm(prev => ({ ...prev, repeatsAllowed: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ fontSize: '11px' }}>Special Instructions</label>
                <select 
                  className="form-control text-xs"
                  value={prescriptionForm.instructions}
                  onChange={e => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
                >
                  <option value="Take before food">Take before food (empty stomach)</option>
                  <option value="Take after food">Take after food</option>
                  <option value="Take with meals">Take with meals</option>
                  <option value="Avoid dairy products">Avoid dairy products</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setEditingPrescription(null);
                  }}
                  className="btn flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 text-xs py-2"
                >
                  Save Regimen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
