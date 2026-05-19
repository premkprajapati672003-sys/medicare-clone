"use client";

import { useEffect, useState, useRef } from 'react';

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

export default function PatientRecords() {
  const [history, setHistory] = useState<any>({ records: [], prescriptions: [], appointments: [], labOrders: [], invoices: [] });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'documents'>('timeline');
  const [standaloneDocs, setStandaloneDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login/patient'; return; }
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
    safeFetch(`${API}/api/patients/${user.id}/documents`).then(d => setStandaloneDocs(d || []));
  }, []);

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

      const docRes = await fetch(`${API}/api/patients/${currentUser.id}/documents`, {
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

  if (!currentUser) return <div className="empty-state">Loading records...</div>;

  // Compile Dynamic Database Encounters
  const dbEncounters = (history.records || []).map((rec: any) => {
    const apt = (history.appointments || []).find((a: any) => a.id === rec.appointmentId);
    const inv = (history.invoices || []).find((i: any) => i.appointmentId === rec.appointmentId);
    
    // Check if there are lab orders matching this patient
    const matchingLabs = (history.labOrders || [])
      .filter((l: any) => l.patientId === currentUser.id)
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
        dosage: p.dosage,
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
  const mockEncounters = MOCK_PATIENT_HISTORY[currentUser.email] || [];

  // Combine & Sort by Date (Descending)
  const allEncounters = [...dbEncounters, ...mockEncounters].sort((a, b) => b.date.localeCompare(a.date));

  // Combined Prescriptions / Medications
  const dbPrescriptions = (history.prescriptions || []).map((p: any) => ({
    id: p.id,
    medicationName: p.medicationName,
    dosage: p.dosage,
    repeatsAllowed: p.repeatsAllowed,
    status: 'ACTIVE'
  }));

  const mockPrescriptions = mockEncounters.flatMap((enc: any) => 
    (enc.prescribed || []).map((p: any, idx: number) => ({
      id: `${enc.id}-rx-${idx}`,
      medicationName: p.medication,
      dosage: p.dosage,
      repeatsAllowed: p.repeats || 0,
      status: 'ACTIVE'
    }))
  );

  const allPrescriptions = [...dbPrescriptions, ...mockPrescriptions];

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

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-title">Electronic Health Record</div>
          <div className="page-subtitle">{currentUser.name} • ID: {currentUser.id.slice(0, 8)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Clinical Timeline</button>
        <button className={`tab-btn ${activeTab === 'medications' ? 'active' : ''}`} onClick={() => setActiveTab('medications')}>Medications</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents & Scans</button>
      </div>

      {/* 1. Clinical Timeline */}
      {activeTab === 'timeline' && (
        <div style={{ width: '100%' }}>
          {/* Search Filter Bar */}
          <div className="search-timeline-bar">
            <input 
              type="text" 
              className="search-timeline-input" 
              placeholder="🔍 Search your timeline notes, study procedures, medications, or invoice ID..."
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
              <p className="text-sm font-semibold">No medical encounters match your search query.</p>
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

                    {/* Detailed Groups */}
                    <div className="visit-details-group">
                      {/* Studied Procedures */}
                      {enc.procedures && enc.procedures.length > 0 && (
                        <div className="detail-item diagnostic" title="Procedures studied during your visit">
                          <span>🧪 Studied:</span>
                          <span className="font-bold">{enc.procedures.join(', ')}</span>
                        </div>
                      )}

                      {/* Prescribed Items */}
                      {enc.prescribed && enc.prescribed.length > 0 && (
                        <div className="detail-item prescribed" title="Medications prescribed to you">
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
                          title="Click to view full invoice details"
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

      {/* 2. Medications */}
      {activeTab === 'medications' && (
        <div className="data-table-wrapper" style={{ maxWidth: '900px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Repeats Left</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allPrescriptions.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No active prescriptions.</td></tr>
              ) : (
                allPrescriptions.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.medicationName}</td>
                    <td>{p.dosage}</td>
                    <td>{p.repeatsAllowed}</td>
                    <td><span className="status-badge scheduled">{p.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Documents */}
      {activeTab === 'documents' && (
        <div style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <label className={`btn btn-primary ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isUploading ? 'Uploading...' : '+ Upload Document'}
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="doc-grid">
            {standaloneDocs.length === 0 && documents.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No documents or attachments found.</div>
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
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{currentUser.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{currentUser.email}</p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{currentUser.phone || '555-0200'}</p>
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
    </>
  );
}
