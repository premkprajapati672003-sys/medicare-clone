"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const API = 'http://127.0.0.1:3002';

// 1. Rich Patient Mock Clinical Database Seeds
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

// 2. Default Zoho Billing templates
const ZOHO_MOCK_TEMPLATES = [
  {
    patientEmail: 'neo@example.com',
    invoiceNum: 'INV-000181',
    amount: 1400.00,
    status: 'SENT',
    date: '2018-09-08',
    dueDate: '2018-09-24',
    items: [
      { description: 'Clinical EMG Support System', qty: 2, rate: 400.00, amount: 800.00 },
      { description: 'Rosewood Frame Orthosis Support', qty: 1, rate: 600.00, amount: 600.00 }
    ],
    payments: []
  },
  {
    patientEmail: 'neo@example.com',
    invoiceNum: 'INV-000170',
    amount: 250.00,
    status: 'PAID',
    date: '2018-08-20',
    dueDate: '2018-09-04',
    items: [
      { description: 'Specialist Endocrinal Consultation', qty: 1, rate: 250.00, amount: 250.00 }
    ],
    payments: [
      { date: '2018-08-20', paymentNum: '58', reference: 'REF-81092', mode: 'Credit Card', amount: 250.00 }
    ]
  },
  {
    patientEmail: 'batman@example.com',
    invoiceNum: 'INV-000180',
    amount: 80.00,
    status: 'PENDING APPROVAL',
    date: '2018-09-02',
    dueDate: '2018-09-17',
    items: [
      { description: 'Emergency Trauma Consultation Fee', qty: 1, rate: 80.00, amount: 80.00 }
    ],
    payments: []
  },
  {
    patientEmail: 'batman@example.com',
    invoiceNum: 'INV-000151',
    amount: 2097.00,
    status: 'PAID',
    date: '2018-05-04',
    dueDate: '2018-05-19',
    items: [
      { description: 'Premium Orthopedic Care & Fractured Rib Rehab', qty: 1, rate: 2097.00, amount: 2097.00 }
    ],
    payments: [
      { date: '2018-05-04', paymentNum: '59', reference: 'REF-82910', mode: 'Cash', amount: 2097.00 }
    ]
  },
  {
    patientEmail: 'alice@example.com',
    invoiceNum: 'INV-000160',
    amount: 150.00,
    status: 'PAID',
    date: '2018-06-15',
    dueDate: '2018-06-30',
    items: [
      { description: 'Initial Intake Consultation Fee', qty: 1, rate: 150.00, amount: 150.00 }
    ],
    payments: [
      { date: '2018-06-15', paymentNum: '56', reference: 'REF-39102', mode: 'Credit Card', amount: 150.00 }
    ]
  }
];

const FIXED_SLOTS = [
  { label: '09:00 AM', value: '09:00:00' },
  { label: '10:00 AM', value: '10:00:00' },
  { label: '11:00 AM', value: '11:00:00' },
  { label: '01:00 PM', value: '13:00:00' },
  { label: '02:00 PM', value: '14:00:00' },
  { label: '03:00 PM', value: '15:00:00' },
  { label: '04:00 PM', value: '16:00:00' },
];

export default function PatientPortal() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  
  // Real-time loaded states from SQLite database
  const [dbHistory, setDbHistory] = useState<any>({ records: [], prescriptions: [], appointments: [], labOrders: [], invoices: [] });
  const [dbInvoices, setDbInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [standaloneDocs, setStandaloneDocs] = useState<any[]>([]);
  
  // Local synchronized invoices
  const [localMocksCache, setLocalMocksCache] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'documents' | 'billing'>('overview');
  
  // Checkout variables
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Appointment states
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  // Fixed slot appointment capacity and waitlist queue states
  const [doctorAppointments, setDoctorAppointments] = useState<any[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [waitlistPromptSlot, setWaitlistPromptSlot] = useState<any>(null);

  // Lab booking states
  const [labFacility, setLabFacility] = useState('Central City Lab');
  const [labProcedure, setLabProcedure] = useState('');
  const [labDoctor, setLabDoctor] = useState('');
  const [labStatus, setLabStatus] = useState<string | null>(null);

  const fetchPatientData = async (userId: string) => {
    const safeFetch = async (url: string) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    };

    safeFetch(`${API}/api/patients/${userId}/history`).then(d => d && setDbHistory(d));
    safeFetch(`${API}/api/patients/${userId}/invoices`).then(d => d && setDbInvoices(d));
    safeFetch(`${API}/api/patients/${userId}/notifications`).then(d => d && setNotifications(d));
    safeFetch(`${API}/api/patients/${userId}/documents`).then(d => setStandaloneDocs(d || []));

    // Sync Zoho Mock Invoices from localStorage
    const stored = localStorage.getItem('hotdoc_mock_invoices');
    if (stored) {
      setLocalMocksCache(JSON.parse(stored));
    } else {
      setLocalMocksCache(ZOHO_MOCK_TEMPLATES);
      localStorage.setItem('hotdoc_mock_invoices', JSON.stringify(ZOHO_MOCK_TEMPLATES));
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchPatientData(user.id);
    } else {
      window.location.href = '/login/patient';
    }
    fetch(`${API}/api/doctors`).then(r => r.json()).then(d => setDoctors(d)).catch(() => {});
  }, []);

  // Fetch target doctor's appointments to verify capacity limits (4 max per hour slot)
  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      setCheckingAvailability(true);
      fetch(`${API}/api/doctors/${selectedDoctor}/appointments`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setDoctorAppointments(data || []);
          setCheckingAvailability(false);
        })
        .catch(() => setCheckingAvailability(false));
    } else {
      setDoctorAppointments([]);
    }
  }, [selectedDoctor, appointmentDate]);

  const getSlotBookingCount = (slotTime: string) => {
    if (!appointmentDate || doctorAppointments.length === 0) return 0;
    return doctorAppointments.filter((apt: any) => {
      const aptDateStr = new Date(apt.startTime).toISOString().split('T')[0];
      const aptTimeStr = new Date(apt.startTime).toTimeString().split(' ')[0].substring(0, 5);
      const targetTimeStr = slotTime.substring(0, 5);
      return aptDateStr === appointmentDate && aptTimeStr === targetTimeStr;
    }).length;
  };

  const handleBook = async (e?: React.FormEvent, customStatus?: 'SCHEDULED' | 'WAITING', targetTime?: string) => {
    if (e) e.preventDefault();
    if (!currentUser || !selectedDoctor || !appointmentDate) return;
    
    const timeToUse = targetTime || appointmentTime;
    if (!timeToUse) {
      setBookingStatus('Please select a time slot.');
      return;
    }

    const slotLabel = FIXED_SLOTS.find(s => s.value === timeToUse)?.label || timeToUse;
    const bookedCount = getSlotBookingCount(timeToUse);

    // If no explicit status given, check if capacity >= 4 to prompt Waitlist
    if (!customStatus && bookedCount >= 4) {
      setWaitlistPromptSlot({ label: slotLabel, value: timeToUse });
      return;
    }

    const finalStatus = customStatus || 'SCHEDULED';
    setBookingStatus(finalStatus === 'WAITING' ? 'Adding to Waitlist...' : 'Scheduling...');

    const start = new Date(`${appointmentDate}T${timeToUse}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await fetch(`${API}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        doctorId: selectedDoctor,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        appointmentType: 'IN_PERSON',
        status: finalStatus
      })
    });

    if (res.ok) {
      setBookingStatus(
        finalStatus === 'WAITING' 
          ? 'Successfully joined priority waiting list!' 
          : 'Appointment scheduled successfully!'
      );
      setSelectedDoctor('');
      setAppointmentDate('');
      setAppointmentTime('');
      setWaitlistPromptSlot(null);
      fetchPatientData(currentUser.id);
      setTimeout(() => setBookingStatus(null), 4000);
    } else {
      setBookingStatus('Failed to save appointment.');
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
    if (!payingInvoice || !currentUser) return;
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        if (!payingInvoice.isMock) {
          // pay SQLite invoice
          await fetch(`${API}/api/invoices/${payingInvoice.id}/pay`, { method: 'POST' });
        } else {
          // pay mock local invoice
          const freshMocks = localMocksCache.map(item => {
            if (item.invoiceNum === payingInvoice.id) {
              return {
                ...item,
                status: 'PAID',
                payments: [
                  {
                    date: new Date().toISOString().split('T')[0],
                    paymentNum: '59',
                    reference: 'REF-' + Math.floor(Math.random() * 90000 + 10000),
                    mode: 'Credit Card',
                    amount: payingInvoice.amount
                  }
                ]
              };
            }
            return item;
          });
          setLocalMocksCache(freshMocks);
          localStorage.setItem('hotdoc_mock_invoices', JSON.stringify(freshMocks));
        }
        
        fetchPatientData(currentUser.id);
      } catch (err) {
        console.error("Secure payment failed", err);
      } finally {
        setIsProcessing(false);
        setPayingInvoice(null);
      }
    }, 1500);
  };

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

  // ==========================================
  // COMPILATION OF MERGED HEALTH HISTORY & DATA
  // ==========================================
  
  // 1. Dynamic Database Consultations & Timelines
  const dbEncounters = (dbHistory.records || []).map((rec: any) => {
    const apt = (dbHistory.appointments || []).find((a: any) => a.id === rec.appointmentId);
    const inv = (dbHistory.invoices || []).find((i: any) => i.appointmentId === rec.appointmentId);
    const matchingLabs = (dbHistory.labOrders || [])
      .filter((l: any) => l.patientId === currentUser?.id)
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
      prescribed: (dbHistory.prescriptions || [])
        .filter((p: any) => p.doctorId === rec.doctorId)
        .map((p: any) => ({
          medicationName: p.medicationName,
          dosage: p.dosage,
          repeatsAllowed: p.repeatsAllowed
        }))
    };
  });

  // 2. Mock Clinical History
  const mockEncounters = currentUser ? (MOCK_PATIENT_HISTORY[currentUser.email] || []) : [];

  // 3. Combined Consultations Sorted by Date Descending
  const allEncounters = [...dbEncounters, ...mockEncounters].sort((a, b) => b.date.localeCompare(a.date));

  // 4. Combined Prescriptions / Medications
  const dbPrescriptions = (dbHistory.prescriptions || []).map((p: any) => ({
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

  // 5. Combined Synced Zoho Invoices
  const buildCurrentInvoices = () => {
    const list: any[] = [];
    if (!currentUser) return list;

    // A. SQLite DB Invoices
    dbInvoices.forEach((dbInv) => {
      list.push({
        id: dbInv.id,
        isMock: false,
        amount: dbInv.amount,
        status: dbInv.status,
        date: dbInv.createdAt ? dbInv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: dbInv.createdAt ? dbInv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        items: [{ description: 'General Consultation Service', qty: 1, rate: dbInv.amount, amount: dbInv.amount }]
      });
    });

    // B. Local Cached Mock Invoices
    localMocksCache.forEach((tpl, idx) => {
      if (tpl.patientEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        list.push({
          id: tpl.invoiceNum || `INV-MOCK${idx}`,
          isMock: true,
          amount: tpl.amount,
          status: tpl.status,
          date: tpl.date,
          dueDate: tpl.dueDate,
          items: tpl.items
        });
      }
    });

    return list;
  };

  const allInvoices = buildCurrentInvoices();
  const unpaidInvoices = allInvoices.filter(i => i.status !== 'PAID' && i.status !== 'VOIDED');
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

  // 6. Files, Diagnostic Scans & Attachments
  const dbAttachments = dbHistory.records
    ?.filter((r: any) => r.attachments && r.attachments.length > 0)
    .flatMap((r: any, idx: number) => 
      r.attachments.map((att: string, aIdx: number) => ({
        id: `${r.id}-${aIdx}`,
        name: att || `Attachment ${idx + 1}`,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
        icon: att?.includes('.pdf') ? '📄' : att?.includes('.png') || att?.includes('.img') ? '🖼️' : '📊',
        size: '850 KB',
        type: 'document'
      }))
    ) || [];

  // Generate beautiful laboratory diagnostic report documents corresponding to clinical procedures order history
  const studyReports = allEncounters
    .filter(enc => enc.procedures && enc.procedures.length > 0)
    .flatMap(enc => 
      enc.procedures.map((proc: string, idx: number) => ({
        id: `${enc.id}-study-${idx}`,
        name: `${proc} Laboratory Diagnostics Report.pdf`,
        date: enc.date,
        size: '148 KB',
        type: 'document',
        icon: '📄'
      }))
    );

  const allDocs = [
    ...standaloneDocs.map(d => ({ ...d, icon: d.type === 'image' ? '🖼️' : '📄' })),
    ...dbAttachments,
    ...studyReports
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'records', label: 'Health Records' },
    { id: 'documents', label: 'Documents & Scans' },
    { id: 'billing', label: 'Billing & Invoices' },
  ] as const;

  return (
    <>
      <style>{`
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 6px;
          margin-bottom: 12px;
        }

        .slot-btn {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 8px 10px;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .slot-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .slot-btn.active {
          border-color: #2563eb;
          background: #eff6ff;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }

        .slot-btn.full {
          border-color: #fef08a;
          background: #fefce8;
        }

        .slot-btn.full:hover:not(:disabled) {
          border-color: #fde047;
          background: #fef9c3;
        }

        .slot-btn.full.active {
          border-color: #ca8a04;
          background: #fef9c3;
        }

        .slot-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f1f5f9;
        }

        .slot-label {
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
        }

        .slot-capacity {
          font-size: 8.5px;
          font-weight: 600;
          color: #64748b;
        }

        .slot-btn.full .slot-capacity {
          color: #a16207;
        }
      `}</style>

      {/* ===== PAGE HEADER ===== */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <div className="page-title" style={{ fontSize: '24px' }}>Patient Portal</div>
          <div className="page-subtitle" style={{ fontSize: '14px' }}>
            Welcome back, {currentUser?.name || '...'}. Manage your records, consults, and clinical documents.
          </div>
        </div>
      </div>

      {/* ===== KPI STRIP (UPDATED & CORRECTED COHERENTLY) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Clinical Records */}
        <div onClick={() => setActiveTab('records')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Clinical Records</div>
              <div className="text-xs text-slate-500">Consultations & timeline</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{allEncounters.length}</div>
          </div>
        </div>

        {/* Card 2: Active Prescriptions */}
        <div onClick={() => setActiveTab('records')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Prescriptions</div>
              <div className="text-xs text-slate-500">Active medications</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{allPrescriptions.length}</div>
          </div>
        </div>

        {/* Card 3: Documents & Scans */}
        <div onClick={() => setActiveTab('documents')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Files & Scans</div>
              <div className="text-xs text-slate-500">Synced reports & files</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="text-3xl font-bold text-slate-900">{allDocs.length}</div>
          </div>
        </div>

        {/* Card 4: Unpaid Invoices */}
        <div onClick={() => setActiveTab('billing')} className="card shadow-sm border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#312e81] hover:shadow-md transition-all cursor-pointer bg-white" style={{ minHeight: '140px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800">Unpaid Invoices</div>
              <div className="text-xs text-slate-500">Pending checkout</div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className={`text-3xl font-bold ${unpaidInvoices.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{unpaidInvoices.length}</div>
          </div>
        </div>
      </div>

      {/* ===== TABS NAVIGATION ===== */}
      <div className="tabs-header" style={{ marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB PANEL: OVERVIEW (INTELLIGENT INTEGRATED SUMMARY COCKPIT) ===== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Summary Cockpit (8 Columns wide) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Outstanding Statements Warning Alert Box */}
            {unpaidInvoices.length > 0 && (
              <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                    <span>🚨</span> Outstanding Statements Due
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    You have <strong>{unpaidInvoices.length} unpaid</strong> clinical statement(s) totalling <strong>${totalOutstanding.toFixed(2)}</strong>. Please settle these to keep your account active.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('billing')}
                  className="btn btn-sm btn-rose text-white shrink-0 self-start md:self-auto"
                  style={{ background: '#e11d48', borderColor: '#e11d48' }}
                >
                  Pay Outstanding Statement
                </button>
              </div>
            )}

            {/* Latest Consultation Quick Summary */}
            <div className="card shadow-sm border border-slate-200 rounded-xl p-5 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-base">Latest Consultation Summary</h3>
                <button onClick={() => setActiveTab('records')} className="text-xs text-indigo-600 hover:underline font-bold">
                  View Full Timeline →
                </button>
              </div>
              
              {allEncounters.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No clinical records found.</p>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-slate-800">{allEncounters[0].title}</h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                      {allEncounters[0].date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {allEncounters[0].notes}
                  </p>
                  
                  {allEncounters[0].procedures && allEncounters[0].procedures.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {allEncounters[0].procedures.map((proc: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                          🧪 Studied: {proc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Active Medications Summary (UPGRADED TO CARDS LAYOUT) */}
            <div className="card shadow-sm border border-slate-200 rounded-xl p-5 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-base">Active Medications & Refills</h3>
                <button onClick={() => setActiveTab('records')} className="text-xs text-indigo-600 hover:underline font-bold">
                  View Refill Details →
                </button>
              </div>

              {allPrescriptions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No active medications prescribed.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPrescriptions.slice(0, 4).map((rx) => {
                    const details = parseDosage(rx.dosage);
                    return (
                      <div key={rx.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50/50 hover:border-indigo-200 transition-colors">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-800">{rx.medicationName}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-1.5 py-0.5 rounded">
                              ☀️ {details.timings}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-2 text-[10px] text-slate-500">
                            <div><strong className="text-slate-600">Dosage:</strong> {details.dosage}</div>
                            <div><strong className="text-slate-600">Frequency:</strong> {details.frequency}</div>
                            <div className="italic mt-1 text-[9px] text-slate-400">🥣 {details.instructions}</div>
                          </div>
                        </div>
                        
                        <div className="border-t border-slate-100 pt-2 mt-3 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                          <span>Refills Left:</span>
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{rx.repeatsAllowed} refills</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Alerts, Quick booking (4 Columns wide) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Book Appointment Card (UPGRADED TO INTERACTIVE SLOTS & WAITLISTING) */}
            <div className="card shadow-sm border border-slate-200 rounded-xl p-5 bg-white">
              <h3 className="text-base font-bold text-slate-800 mb-1">Book Appointment</h3>
              <p className="text-[10px] text-slate-500 mb-3">Choose practitioner and date to view hourly slots.</p>
              
              <form onSubmit={(e) => handleBook(e)}>
                <div className="form-group mb-3">
                  <label className="form-label" style={{ fontSize: '11px' }}>Practitioner</label>
                  <select
                    className="form-control text-xs"
                    required
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                  >
                    <option value="">-- Choose practitioner --</option>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label" style={{ fontSize: '11px' }}>Appointment Date</label>
                  <input 
                    type="date" 
                    className="form-control text-xs"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>

                {selectedDoctor && appointmentDate && (
                  <div className="form-group mb-4">
                    <label className="form-label" style={{ fontSize: '11px' }}>
                      {checkingAvailability ? 'Checking slots...' : 'Hourly slots availability (4 patients max):'}
                    </label>
                    
                    <div className="slot-grid">
                      {FIXED_SLOTS.map((slot) => {
                        const count = getSlotBookingCount(slot.value);
                        const isFull = count >= 4;
                        const isActive = appointmentTime === slot.value;
                        
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setAppointmentTime(slot.value)}
                            className={`slot-btn ${isActive ? 'active' : ''} ${isFull ? 'full' : ''}`}
                          >
                            <span className="slot-label">{slot.label}</span>
                            <span className="slot-capacity">
                              {isFull ? '⚠️ Waitlist' : `Booked: ${count}/4`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedDoctor || !appointmentDate || !appointmentTime}
                  className="w-full btn btn-primary btn-sm py-2"
                >
                  Confirm Slot / Check Waitlist
                </button>
              </form>
              
              {bookingStatus && (
                <div className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-center">
                  {bookingStatus}
                </div>
              )}
            </div>

            {/* Notifications Box */}
            <div className="card shadow-sm border border-slate-200 rounded-xl p-5 bg-white flex flex-col" style={{ maxHeight: '350px' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-800">Recent Alerts</h3>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-500">
                  {notifications.length} total
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">No alerts found.</div>
                ) : (
                  notifications.slice(0, 4).map((msg: any) => (
                    <div key={msg.id} className="flex gap-2 p-2 border border-slate-100 rounded hover:bg-slate-50 transition-colors">
                      <div className="text-xs flex-shrink-0">💬</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-slate-700 leading-normal line-clamp-2">{msg.message}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{new Date(msg.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===== TAB PANEL: HEALTH RECORDS (FULL VISUAL ENCOUNTERS TIMELINE & RX CARDS) ===== */}
      {activeTab === 'records' && (
        <div className="flex flex-col gap-6">
          
          {/* Consultations Card */}
          <div className="card shadow-sm border border-slate-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Consultation Timeline</h3>
            
            {allEncounters.length === 0 ? (
              <div className="empty-state">No clinical consultation logs found.</div>
            ) : (
              <div className="timeline" style={{ paddingLeft: '16px' }}>
                {allEncounters.map((r: any) => (
                  <div key={r.id} className="timeline-item" style={{ position: 'relative', paddingLeft: '24px', paddingBottom: '24px', borderLeft: '2px solid var(--border)' }}>
                    {/* Glowing Accent Dot */}
                    <div className="timeline-dot" style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                    
                    <div className="timeline-content bg-slate-50/50 border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="font-bold text-sm text-slate-800 block">{r.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{r.date} • {r.time || '10:00 AM'}</span>
                        </div>
                        <span className={`visit-badge ${r.type === 'TELEHEALTH' ? 'badge-telehealth' : 'badge-inperson'}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>
                          {r.type === 'TELEHEALTH' ? '🎥 Telehealth' : '🏥 Clinic'}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 text-xs whitespace-pre-wrap leading-relaxed mb-3">{r.notes}</p>
                      
                      {/* Studied Procedures */}
                      {r.procedures && r.procedures.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {r.procedures.map((proc: string, idx: number) => (
                            <span key={idx} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full font-medium">
                              🧪 Diagnostic Report Generated: {proc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Medications Cards Grid (UPGRADED FROM TABLE TO CARDS) */}
          <div className="card shadow-sm border border-slate-200 rounded-xl p-6 bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800">Active Medication Routines</h3>
              <p className="text-xs text-slate-500">Configure timings, dosages, and sync clinical refills in card view.</p>
            </div>
            
            {allPrescriptions.length === 0 ? (
              <div className="empty-state py-12">No active prescriptions on file.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPrescriptions.map((p: any) => {
                  const details = parseDosage(p.dosage);
                  return (
                    <div 
                      key={p.id} 
                      className="border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#312e81] transition-all bg-white relative flex flex-col justify-between" 
                      style={{ minHeight: '200px' }}
                    >
                      <div>
                        {/* Top Row: Pill icon and status badge */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
                            💊
                          </div>
                          <span className="status-badge scheduled text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ACTIVE
                          </span>
                        </div>

                        {/* Medication Details */}
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

                      {/* Bottom Row: Refills remaining */}
                      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Refills Remaining:</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{p.repeatsAllowed} remaining</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ===== TAB PANEL: DOCUMENTS & SCANS (SYNCHRONIZED DIAGNOSTICS SCAN FILE GRID) ===== */}
      {activeTab === 'documents' && (
        <div className="card shadow-sm border border-slate-200 rounded-xl p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Files & Clinical Records</h3>
              <p className="text-xs text-slate-500 mt-0.5">Directly synced with your diagnostic history, uploaded records, and Doctor portal.</p>
            </div>
            
            <label className={`btn btn-primary btn-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {isUploading ? 'Uploading...' : '+ Upload Document'}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} style={{ display: 'none' }} />
            </label>
          </div>

          {allDocs.length === 0 ? (
            <div className="empty-state py-12">No files or Diagnostic attachments found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allDocs.map((doc: any) => (
                <div key={doc.id} className="border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-xl p-4 flex flex-col justify-between bg-slate-50/50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg text-indigo-600 shrink-0">
                      {doc.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-800 truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{doc.size || '120 KB'}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100/80 pt-3 mt-3 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-semibold">{doc.date}</span>
                    {doc.url ? (
                      <a 
                        href={`${API}${doc.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                      >
                        Download ⤓
                      </a>
                    ) : (
                      <span className="text-[10px] text-indigo-400 font-bold cursor-default">Verified Diagnostic ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB PANEL: BILLING & INVOICES (SECURE PAYMENT MOCK CHECKOUT INTEGRATION) ===== */}
      {activeTab === 'billing' && (
        <div className="card shadow-sm border border-slate-200 rounded-xl p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Billing Statement registry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Settle balance statements securely using simulated Stripe processor checkout drawer.</p>
            </div>
            
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Statement Balance</div>
              <div className={`text-2xl font-black ${totalOutstanding > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                ${totalOutstanding.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Statement ID</th>
                  <th>Issued Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Grand Total</th>
                  <th style={{ textAlign: 'center' }}>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>Invoice Actions</th>
                </tr>
              </thead>
              <tbody>
                {allInvoices.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No statements or balance details found.</td></tr>
                ) : (
                  allInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700 }} className="text-slate-800">
                        {inv.isMock ? inv.id : `INV-${inv.id.substring(0, 8).toUpperCase()}`}
                      </td>
                      <td className="text-slate-600 text-xs font-semibold">{inv.date}</td>
                      <td className="text-slate-600 text-xs font-semibold">{inv.dueDate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="text-slate-800">
                        ${inv.amount.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${
                          inv.status === 'PAID' ? 'scheduled' : 
                          inv.status === 'SENT' ? 'in-progress' : 'cancelled'
                        }`} style={{
                          background: inv.status === 'PAID' ? '#dcfce7' : inv.status === 'SENT' ? '#dbeafe' : '#fee2e2',
                          color: inv.status === 'PAID' ? '#15803d' : inv.status === 'SENT' ? '#1d4ed8' : '#b91c1c'
                        }}>
                          {inv.status === 'PAID' ? '✓ Settled / PAID' : inv.status === 'SENT' ? 'Outstanding' : inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="flex justify-center gap-3">
                          {inv.status !== 'PAID' && inv.status !== 'VOIDED' && (
                            <button
                              onClick={() => setPayingInvoice(inv)}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded transition-colors"
                            >
                              Secure Pay 💳
                            </button>
                          )}
                          <span className="text-[11px] text-slate-400 font-semibold cursor-pointer hover:text-indigo-600 hover:underline">
                            Print Statement
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STRIPE PAYMENT SIMULATION DRAWER */}
      {payingInvoice && (
        <div className="modal-overlay">
          <div className="modal-content bg-white" style={{ maxWidth: '400px' }}>
            <h3 className="modal-title flex items-center gap-2">
              <span>💳</span> Secure Stripe Sandbox checkout
            </h3>
            <p className="modal-desc text-xs">
              Settle outstanding Statement <strong>{payingInvoice.id}</strong> total <strong>${payingInvoice.amount.toFixed(2)}</strong>.
            </p>
            
            <form onSubmit={handlePay} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Cardholder Name</label>
                <input type="text" className="form-control text-xs" required defaultValue={currentUser?.name} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Card Number</label>
                <div className="flex gap-2">
                  <input type="text" className="form-control text-xs flex-1" required placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" maxLength={19} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="form-label" style={{ fontSize: '11px' }}>Exp Date</label>
                  <input type="text" className="form-control text-xs" required placeholder="MM/YY" defaultValue="12/28" maxLength={5} />
                </div>
                <div className="flex-1">
                  <label className="form-label" style={{ fontSize: '11px' }}>CVC</label>
                  <input type="password" className="form-control text-xs" required placeholder="123" defaultValue="123" maxLength={3} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  disabled={isProcessing}
                  onClick={() => setPayingInvoice(null)}
                  className="btn flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="btn btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                  style={{ background: '#2563eb', borderColor: '#2563eb' }}
                >
                  {isProcessing ? 'Processing Transaction...' : `Pay $${payingInvoice.amount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIORITY WAITLIST / SLOT CAPACITY REACHED PROMPT MODAL */}
      {waitlistPromptSlot && (
        <div className="modal-overlay">
          <div className="modal-content bg-white" style={{ maxWidth: '440px' }}>
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="modal-title text-amber-800">Primary Booking Capacity Reached</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              The hour slot for <strong>{waitlistPromptSlot.label}</strong> on the selected date is fully booked with 4 existing scheduled patient consultations. 
            </p>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed mb-4">
              <strong>Waitlist Option Available:</strong> You can join the prioritized waiting queue for this slot. If a patient cancels or the physician approves clinical extensions, your booking will be elevated.
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setWaitlistPromptSlot(null)}
                className="btn flex-1 text-xs py-2"
              >
                Choose Another Slot
              </button>
              
              <button 
                type="button"
                onClick={() => handleBook(undefined, 'WAITING', waitlistPromptSlot.value)}
                className="btn btn-primary flex-1 text-xs py-2"
                style={{ background: '#ca8a04', borderColor: '#ca8a04' }}
              >
                Join Waitlist Queue
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
