"use client";

import { useEffect, useState, useRef } from 'react';

const API = 'http://127.0.0.1:3002';

// Clean Zoho Mock templates that we will dynamically align with actual SQLite patients
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
    patientEmail: 'superman@example.com',
    invoiceNum: 'INV-000179',
    amount: 40.00,
    status: 'DRAFT',
    date: '2018-09-08',
    dueDate: '2018-09-23',
    items: [
      { description: 'Clinical Ophthalmic Vision Assessment', qty: 1, rate: 40.00, amount: 40.00 }
    ],
    payments: []
  },
  {
    patientEmail: 'wonderwoman@example.com',
    invoiceNum: 'INV-000149',
    amount: 800.00,
    status: 'PAID',
    date: '2018-04-04',
    dueDate: '2018-04-19',
    items: [
      { description: 'Cardiology ECG Diagnostic Test', qty: 80, rate: 10.00, amount: 800.00 }
    ],
    payments: [
      { date: '2018-04-04', paymentNum: '60', reference: 'REF-14920', mode: 'Cash', amount: 800.00 }
    ]
  },
  {
    patientEmail: 'spiderman@example.com',
    invoiceNum: 'INV-000150',
    amount: 33.00,
    status: 'DRAFT',
    date: '2018-05-04',
    dueDate: '2018-05-19',
    items: [
      { description: 'Dermatological Treatment Fee', qty: 1, rate: 33.00, amount: 33.00 }
    ],
    payments: []
  },
  {
    patientEmail: 'ironman@example.com',
    invoiceNum: 'INV-000148',
    amount: 71.00,
    status: 'DRAFT',
    date: '2018-04-04',
    dueDate: '2018-04-19',
    items: [
      { description: 'Cardiological Consultation Fee', qty: 1, rate: 71.00, amount: 71.00 }
    ],
    payments: []
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

export default function DoctorBilling() {
  const [dbInvoices, setDbInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [appointmentsMap, setAppointmentsMap] = useState<Record<string, any>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Custom Local Cache to support edit/deletion/voiding/cloning of Zoho Mock Invoices
  const [localMocksCache, setLocalMocksCacheState] = useState<any[]>([]);
  const setLocalMocksCache = (newMocks: any[] | ((prev: any[]) => any[])) => {
    if (typeof newMocks === 'function') {
      setLocalMocksCacheState(prev => {
        const res = newMocks(prev);
        localStorage.setItem('hotdoc_mock_invoices', JSON.stringify(res));
        return res;
      });
    } else {
      setLocalMocksCacheState(newMocks);
      localStorage.setItem('hotdoc_mock_invoices', JSON.stringify(newMocks));
    }
  };

  // Expand / Collapse dropdown states for each patient card
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modals & Action Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  // Manual Creation Fields
  const [newInvoicePatientId, setNewInvoicePatientId] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceDesc, setNewInvoiceDesc] = useState('Consultation Session');
  const [newInvoiceStatus, setNewInvoiceStatus] = useState('SENT');
  const [newInvoiceDate, setNewInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Invoice Fields
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDate, setEditDate] = useState('');

  // Email Invoice Fields
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Tab State inside selected invoice
  const [activeTab, setActiveTab] = useState<'invoice' | 'payments' | 'history'>('invoice');

  // Attachment upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Invoices, Patients & Appointments
  const loadData = () => {
    fetch(`${API}/api/invoices`)
      .then(r => r.json())
      .then(d => setDbInvoices(d))
      .catch(() => {});

    fetch(`${API}/api/patients`)
      .then(r => r.json())
      .then(d => {
        setPatientsList(d);
        const pMap: Record<string, any> = {};
        d.forEach((p: any) => pMap[p.id] = p);
        setPatients(pMap);
        
        // Initialize default expanded state
        const expanded: Record<string, boolean> = {};
        d.forEach((p: any) => {
          expanded[p.id] = true;
        });
        setExpandedPatients(prev => ({ ...expanded, ...prev }));
      })
      .catch(() => {});

    const userStr = localStorage.getItem('hotdoc_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      fetch(`${API}/api/doctors/${u.id}/all-appointments`)
        .then(r => r.json())
        .then((d: any[]) => {
          const aMap: Record<string, any> = {};
          d.forEach(apt => {
            aMap[apt.id] = apt;
          });
          setAppointmentsMap(aMap);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadData();
    const stored = localStorage.getItem('hotdoc_mock_invoices');
    if (stored) {
      setLocalMocksCacheState(JSON.parse(stored));
    } else {
      setLocalMocksCacheState(ZOHO_MOCK_TEMPLATES);
      localStorage.setItem('hotdoc_mock_invoices', JSON.stringify(ZOHO_MOCK_TEMPLATES));
    }
  }, []);

  // Construct current invoices based on dynamic template mapping + SQLite invoices
  const buildCurrentInvoices = () => {
    const list: any[] = [];

    // 1. Map actual SQLite database invoices
    dbInvoices.forEach(dbInv => {
      const patient = patients[dbInv.patientId] || {};
      const apt = appointmentsMap[dbInv.appointmentId] || {};
      
      const invoiceDate = apt.startTime 
        ? new Date(apt.startTime).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      const dDate = new Date(invoiceDate);
      dDate.setDate(dDate.getDate() + 15);
      const dueDate = dDate.toISOString().split('T')[0];

      const isPaid = dbInv.status === 'PAID';

      list.push({
        id: `INV-${dbInv.id.slice(0, 6).toUpperCase()}`,
        dbId: dbInv.id, 
        patientId: dbInv.patientId,
        patientName: patient.name || 'Unknown Patient',
        patientEmail: patient.email || '',
        patientPhone: patient.phone || '',
        amount: dbInv.amount,
        status: dbInv.status, // KEEP EXACT DB STATUS (UNPAID, PAID, VOIDED, etc.)
        date: invoiceDate,
        dueDate: dueDate,
        items: [
          { description: 'General Consultation', qty: 1, rate: dbInv.amount, amount: dbInv.amount }
        ],
        payments: isPaid ? [
          { 
            date: invoiceDate, 
            paymentNum: '62', 
            reference: 'REF-PAY-' + dbInv.id.slice(0, 4).toUpperCase(), 
            mode: dbInv.paymentMethod || 'Credit Card', 
            amount: dbInv.amount 
          }
        ] : [],
        attachments: dbInv.paymentMethod === 'ATTACHED' ? [{ name: 'Medical_Support_Details.pdf', url: '#' }] : []
      });
    });

    // 2. Map and align mock cache templates to actual DB users
    localMocksCache.forEach((tpl, idx) => {
      const patient = patientsList.find(p => p.email === tpl.patientEmail);
      if (patient) {
        list.push({
          id: tpl.invoiceNum || `INV-MOCK${idx}`,
          isMock: true, // Tag mock invoice
          patientId: patient.id,
          patientName: patient.name,
          patientEmail: patient.email,
          patientPhone: patient.phone || '555-0200',
          amount: tpl.amount,
          status: tpl.status,
          date: tpl.date,
          dueDate: tpl.dueDate,
          items: tpl.items,
          payments: tpl.payments,
          attachments: tpl.payments.length > 0 ? [{ name: 'Payment_Receipt.pdf', url: '#' }] : []
        });
      }
    });

    return list;
  };

  const allInvoices = buildCurrentInvoices();

  // Set default selected invoice on load if none selected
  useEffect(() => {
    if (allInvoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(allInvoices[0]);
    }
  }, [dbInvoices, patientsList, localMocksCache]);

  // Handle Recording Payment / Marking as Paid
  const handleRecordPayment = async (invoice: any) => {
    if (!invoice) return;

    if (invoice.dbId) {
      try {
        const res = await fetch(`${API}/api/invoices/${invoice.dbId}/mark-paid`, { method: 'PUT' });
        if (res.ok) {
          loadData();
          setSelectedInvoice({
            ...invoice,
            status: 'PAID',
            payments: [
              {
                date: new Date().toISOString().split('T')[0],
                paymentNum: '62',
                reference: 'REF-PAY-' + invoice.dbId.slice(0, 4).toUpperCase(),
                mode: 'Credit Card',
                amount: invoice.amount
              }
            ]
          });
        }
      } catch (err) {
        console.error("Failed to mark invoice as paid", err);
      }
    } else {
      // Local Mock invoice
      const updatedMocks = localMocksCache.map(item => {
        if (item.invoiceNum === invoice.id) {
          return {
            ...item,
            status: 'PAID',
            payments: [
              {
                date: new Date().toISOString().split('T')[0],
                paymentNum: '59',
                reference: 'REF-' + Math.floor(Math.random() * 90000 + 10000),
                mode: 'Cash',
                amount: invoice.amount
              }
            ]
          };
        }
        return item;
      });
      setLocalMocksCache(updatedMocks);
      setSelectedInvoice({
        ...invoice,
        status: 'PAID',
        payments: [
          {
            date: new Date().toISOString().split('T')[0],
            paymentNum: '59',
            reference: 'REF-MOCK-PAY',
            mode: 'Cash',
            amount: invoice.amount
          }
        ]
      });
    }
  };

  // Submit New Invoice Manual Creation
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoicePatientId || !newInvoiceAmount) return;

    try {
      const response = await fetch(`${API}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: newInvoicePatientId,
          amount: parseFloat(newInvoiceAmount),
          status: newInvoiceStatus,
          paymentMethod: newInvoiceStatus === 'PAID' ? 'Credit Card' : null
        })
      });

      if (response.ok) {
        setNewInvoicePatientId('');
        setNewInvoiceAmount('');
        setNewInvoiceDesc('Consultation Session');
        setShowCreateModal(false);
        loadData();
      }
    } catch (err) {
      console.error("Failed to create manual invoice", err);
    }
  };

  // Open Edit Modal
  const openEditDialog = () => {
    if (!selectedInvoice) return;
    setEditAmount(selectedInvoice.amount.toString());
    setEditDesc(selectedInvoice.items[0]?.description || 'Clinical Consultation');
    setEditStatus(selectedInvoice.status);
    setEditDate(selectedInvoice.date);
    setShowEditModal(true);
  };

  // Submit Invoice Edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(editAmount) || 0;

    if (selectedInvoice.dbId) {
      // Backend edit
      try {
        const response = await fetch(`${API}/api/invoices/${selectedInvoice.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amt,
            status: editStatus,
            paymentMethod: editStatus === 'PAID' ? 'Credit Card' : null
          })
        });

        if (response.ok) {
          setShowEditModal(false);
          loadData();
          setSelectedInvoice(prev => ({
            ...prev,
            amount: amt,
            status: editStatus,
            items: [{ description: editDesc, qty: 1, rate: amt, amount: amt }]
          }));
        }
      } catch (err) {
        console.error("Failed to update database invoice", err);
      }
    } else {
      // Mock local edit
      const updatedMocks = localMocksCache.map(item => {
        if (item.invoiceNum === selectedInvoice.id) {
          return {
            ...item,
            amount: amt,
            status: editStatus,
            date: editDate,
            items: [{ description: editDesc, qty: 1, rate: amt, amount: amt }]
          };
        }
        return item;
      });
      setLocalMocksCache(updatedMocks);
      setSelectedInvoice(prev => ({
        ...prev,
        amount: amt,
        status: editStatus,
        date: editDate,
        items: [{ description: editDesc, qty: 1, rate: amt, amount: amt }]
      }));
      setShowEditModal(false);
    }
  };

  // Delete Selected Invoice
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this invoice?");
    if (!confirmDelete) return;

    if (selectedInvoice.dbId) {
      // Delete in DB
      try {
        const res = await fetch(`${API}/api/invoices/${selectedInvoice.dbId}`, { method: 'DELETE' });
        if (res.ok) {
          loadData();
          setSelectedInvoice(null);
        }
      } catch (err) {
        console.error("Failed to delete database invoice", err);
      }
    } else {
      // Delete local mock
      const updatedMocks = localMocksCache.filter(item => item.invoiceNum !== selectedInvoice.id);
      setLocalMocksCache(updatedMocks);
      setSelectedInvoice(null);
    }
    setShowMoreDropdown(false);
  };

  // Void Selected Invoice
  const handleVoidInvoice = async () => {
    if (!selectedInvoice) return;

    if (selectedInvoice.dbId) {
      try {
        await fetch(`${API}/api/invoices/${selectedInvoice.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'VOIDED' })
        });
        loadData();
        setSelectedInvoice(prev => ({ ...prev, status: 'VOIDED' }));
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = localMocksCache.map(i => i.invoiceNum === selectedInvoice.id ? { ...i, status: 'VOIDED' } : i);
      setLocalMocksCache(updated);
      setSelectedInvoice(prev => ({ ...prev, status: 'VOIDED' }));
    }
    setShowMoreDropdown(false);
  };

  // Clone Selected Invoice
  const handleCloneInvoice = async () => {
    if (!selectedInvoice) return;
    
    const nextInvoiceNum = `INV-${Math.floor(Math.random() * 900000 + 100000)}`;

    if (selectedInvoice.dbId) {
      try {
        const response = await fetch(`${API}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedInvoice.patientId,
            amount: selectedInvoice.amount,
            status: selectedInvoice.status
          })
        });
        if (response.ok) {
          loadData();
          alert("Invoice Cloned and Saved to DB successfully!");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const cloned = {
        patientEmail: selectedInvoice.patientEmail,
        invoiceNum: nextInvoiceNum,
        amount: selectedInvoice.amount,
        status: selectedInvoice.status,
        date: new Date().toISOString().split('T')[0],
        dueDate: selectedInvoice.dueDate,
        items: [...selectedInvoice.items],
        payments: []
      };
      setLocalMocksCache([cloned, ...localMocksCache]);
      alert("Invoice Cloned locally successfully!");
    }
    setShowMoreDropdown(false);
  };

  // Trigger Native Print Dialog
  const triggerPrint = () => {
    window.print();
  };

  // Open Email Modal and Prefill Values
  const openEmailDialog = () => {
    if (!selectedInvoice) return;
    setEmailTo(selectedInvoice.patientEmail);
    setEmailSubject(`Invoice ${selectedInvoice.id} from HotDoc Clinical Portal`);
    setEmailBody(
      `Dear ${selectedInvoice.patientName},\n\nWe have generated a clinical billing statement ${selectedInvoice.id} for your recent medical consultation.\n\n- Invoice Amount: $${selectedInvoice.amount.toFixed(2)}\n- Invoice Date: ${new Date(selectedInvoice.date).toLocaleDateString()}\n- Terms: Net 15 days\n- Due Date: ${new Date(selectedInvoice.dueDate).toLocaleDateString()}\n\nYou can review, verify, and settle this invoice immediately on your Patient Billing dashboard.\n\nWarm regards,\nDr. Meredith Grey\nHotDoc Clinical Portal`
    );
    setEmailSentSuccess(false);
    setShowEmailModal(true);
  };

  // Send Email Action - Saves Persistent Notification in communications Table!
  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await fetch(`${API}/api/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedInvoice.patientId,
          type: 'EMAIL',
          message: `Emailed invoice statement ${selectedInvoice.id} for $${selectedInvoice.amount.toFixed(2)} to ${emailTo}.`
        })
      });

      if (res.ok) {
        setEmailSentSuccess(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSentSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to post email log to DB", err);
    }
  };

  // Trigger File Input Attachment Upload
  const handleAttachmentUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Upload Attachment via /api/upload and add to invoice
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedInvoice) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        const newAttachment = { name: data.name, url: `${API}${data.url}` };
        
        // Link attachment to active state
        setSelectedInvoice(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));

        // Persist link back in local mock if appropriate
        if (selectedInvoice.isMock) {
          const updatedMocks = localMocksCache.map(i => {
            if (i.invoiceNum === selectedInvoice.id) {
              return { ...i, attachments: [...(i.attachments || []), newAttachment] };
            }
            return i;
          });
          setLocalMocksCache(updatedMocks);
        } else {
          // Keep active locally
          alert("File uploaded successfully and attached to active clinical sheet.");
        }
      }
    } catch (err) {
      console.error("File upload failed", err);
    }
  };

  // Toggle Collapse / Expand Group dropdown inside Card list
  const togglePatientDropdown = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  // --- FILTERING & GROUPING ---

  // 1. Filter raw list based on query
  const searchedInvoices = allInvoices.filter(inv => {
    const query = searchQuery.toLowerCase();
    return (
      inv.patientName.toLowerCase().includes(query) ||
      inv.id.toLowerCase().includes(query) ||
      inv.amount.toString().includes(query) ||
      inv.status.toLowerCase().includes(query)
    );
  });

  // 2. Group into Patient Profiles
  const groupInvoicesByPatient = (invoicesList: any[]) => {
    const groups: Record<string, {
      patientId: string;
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      totalBilled: number;
      totalOutstanding: number;
      invoices: any[];
    }> = {};

    invoicesList.forEach(inv => {
      const pid = inv.patientId;
      if (!groups[pid]) {
        groups[pid] = {
          patientId: pid,
          patientName: inv.patientName,
          patientEmail: inv.patientEmail,
          patientPhone: inv.patientPhone,
          totalBilled: 0,
          totalOutstanding: 0,
          invoices: []
        };
      }
      
      groups[pid].invoices.push(inv);
      groups[pid].totalBilled += inv.amount;
      if (inv.status !== 'PAID' && inv.status !== 'VOIDED') {
        groups[pid].totalOutstanding += inv.amount;
      }
    });

    return Object.values(groups);
  };

  const patientProfiles = groupInvoicesByPatient(searchedInvoices);

  // 3. Sort Patient Profiles
  const sortedPatientProfiles = [...patientProfiles].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      const latestA = Math.max(...a.invoices.map((i: any) => new Date(i.date).getTime()));
      const latestB = Math.max(...b.invoices.map((i: any) => new Date(i.date).getTime()));
      comparison = latestA - latestB;
    } else if (sortBy === 'name') {
      comparison = a.patientName.localeCompare(b.patientName);
    } else if (sortBy === 'amount') {
      comparison = a.totalBilled - b.totalBilled;
    } else if (sortBy === 'status') {
      // Status weight prioritizes accounts receivable: SENT/UNPAID > PENDING APPROVAL > DRAFT > PAID/VOIDED
      const getStatusWeight = (invs: any[]) => {
        const weights = invs.map((i: any) => {
          const st = i.status.toUpperCase();
          if (st === 'SENT' || st === 'UNPAID') return 4;
          if (st === 'PENDING APPROVAL') return 3;
          if (st === 'DRAFT') return 2;
          return 1;
        });
        return Math.max(...weights);
      };
      comparison = getStatusWeight(a.invoices) - getStatusWeight(b.invoices);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return (
    <>
      {/* High-density media print stylesheet for browser printing of JUST the invoice card */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-sheet, #print-invoice-sheet * {
            visibility: visible;
          }
          #print-invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          .zoho-detail-header, .zoho-icon-btn, .zoho-tabs-wrapper, .btn, #customize-btn-box {
            display: none !important;
          }
        }

        .zoho-container {
          display: flex;
          height: calc(100vh - var(--topbar-height) - 40px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          font-family: 'Open Sans', 'Inter', sans-serif;
        }

        /* --- LEFT SIDEBAR GROUPED PANEL --- */
        .zoho-list-panel {
          width: 390px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          background: #fdfdfd;
          flex-shrink: 0;
        }

        .zoho-list-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .zoho-list-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .zoho-list-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .zoho-list-title::after {
          content: '▾';
          font-size: 11px;
          color: #64748b;
        }

        .zoho-search-wrapper {
          position: relative;
          margin-bottom: 10px;
        }

        .zoho-search-input {
          width: 100%;
          padding: 7px 10px 7px 32px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: 12px;
          color: #334155;
          background: #f8fafc;
        }

        .zoho-search-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: #ffffff;
        }

        .zoho-search-icon-inline {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 13px;
        }

        .zoho-sort-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          margin-top: 8px;
        }

        .zoho-sort-options {
          display: flex;
          gap: 8px;
        }

        .zoho-sort-btn {
          cursor: pointer;
          font-weight: 500;
          transition: color 0.15s;
        }

        .zoho-sort-btn.active {
          color: #3b82f6;
          font-weight: 600;
        }

        .zoho-list-scroll {
          flex: 1;
          overflow-y: auto;
          background: #fafbfd;
        }

        /* Grouped Patient Profile Card styling */
        .zoho-profile-card {
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }

        .zoho-profile-card-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.15s;
          user-select: none;
        }

        .zoho-profile-card-header:hover {
          background: #f8fafc;
        }

        .zoho-profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #eff6ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #bfdbfe;
        }

        .zoho-profile-info {
          flex: 1;
          min-width: 0;
        }

        .zoho-profile-name {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .zoho-profile-meta {
          font-size: 11px;
          color: #64748b;
          margin-top: 1px;
        }

        .zoho-profile-chevron {
          font-size: 12px;
          color: #94a3b8;
          transition: transform 0.2s;
          padding: 4px;
        }

        .zoho-profile-chevron.open {
          transform: rotate(180deg);
        }

        /* Nested Invoices Dropdown Menu */
        .zoho-nested-invoices {
          background: #fcfdfe;
          border-top: 1px solid #f1f5f9;
        }

        .zoho-nested-card {
          padding: 10px 16px 10px 48px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.12s;
        }

        .zoho-nested-card:last-child {
          border-bottom: none;
        }

        .zoho-nested-card:hover {
          background: #f1f5f9;
        }

        .zoho-nested-card.active {
          background: #eff6ff;
          border-right: 4px solid #3b82f6;
        }

        .zoho-nested-id {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
        }

        .zoho-nested-date {
          font-size: 11px;
          color: #64748b;
          margin-left: 6px;
        }

        .zoho-nested-right {
          text-align: right;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .zoho-nested-amount {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .zoho-badge {
          display: inline-block;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .zoho-badge.paid { background: #dcfce7; color: #15803d; }
        .zoho-badge.sent { background: #dbeafe; color: #1d4ed8; }
        .zoho-badge.draft { background: #f1f5f9; color: #475569; }
        .zoho-badge.voided { background: #fef2f2; color: #ef4444; }
        .zoho-badge.pending_approval { background: #fef3c7; color: #b45309; }

        /* --- RIGHT DETAIL PANEL --- */
        .zoho-detail-panel {
          flex: 1;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .zoho-detail-header {
          padding: 12px 24px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .zoho-detail-id {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .zoho-detail-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .zoho-action-icons {
          display: flex;
          border-right: 1px solid #e2e8f0;
          padding-right: 12px;
          gap: 4px;
        }

        .zoho-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          font-size: 13px;
          transition: all 0.15s;
        }

        .zoho-icon-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .zoho-detail-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        /* --- PAPER INVOICE SHEET --- */
        .zoho-invoice-sheet {
          background: #ffffff;
          width: 100%;
          max-width: 800px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          position: relative;
          padding: 40px;
          min-height: 650px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .zoho-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          transform: rotate(-45deg) translate(-29%, -30%);
          width: 130px;
          text-align: center;
          font-size: 9px;
          font-weight: 700;
          color: white;
          padding: 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .zoho-ribbon.paid { background: #22c55e; }
        .zoho-ribbon.sent { background: #3b82f6; }
        .zoho-ribbon.draft { background: #64748b; }
        .zoho-ribbon.voided { background: #ef4444; }
        .zoho-ribbon.pending { background: #f59e0b; }

        .zoho-sheet-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          position: relative;
        }

        .zoho-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .zoho-brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 22px;
          font-weight: 700;
        }

        .zoho-brand-details h2 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .zoho-brand-details p {
          font-size: 11px;
          color: #64748b;
          margin: 2px 0 0 0;
          line-height: 1.4;
        }

        .zoho-sheet-right-block {
          text-align: right;
        }

        .zoho-sheet-right-block h1 {
          font-size: 28px;
          font-weight: 400;
          color: #334155;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .zoho-balance-due-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 8px 16px;
          text-align: right;
          min-width: 140px;
        }

        .zoho-balance-due-label {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .zoho-balance-due-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }

        .zoho-billing-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 12px;
          line-height: 1.6;
        }

        .zoho-bill-to {
          width: 50%;
        }

        .zoho-bill-to h4 {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 6px 0;
        }

        .zoho-bill-to-name {
          font-weight: 700;
          color: #3b82f6;
          font-size: 13px;
        }

        .zoho-invoice-metadata {
          text-align: right;
          display: grid;
          grid-template-columns: auto auto;
          gap: 6px 16px;
          justify-content: end;
        }

        .zoho-meta-label {
          color: #64748b;
          text-align: right;
        }

        .zoho-meta-value {
          font-weight: 600;
          color: #0f172a;
          text-align: left;
        }

        /* Items Table */
        .zoho-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 12px;
        }

        .zoho-items-table th {
          background: #1e1b4b; 
          color: white;
          font-weight: 600;
          padding: 8px 12px;
          text-align: left;
        }

        .zoho-items-table th:nth-child(1) { width: 30px; text-align: center; }
        .zoho-items-table th:nth-child(3) { width: 50px; text-align: center; }
        .zoho-items-table th:nth-child(4) { width: 80px; text-align: right; }
        .zoho-items-table th:nth-child(5) { width: 80px; text-align: right; }

        .zoho-items-table td {
          border-bottom: 1px solid #cbd5e1;
          padding: 12px;
          color: #334155;
        }

        .zoho-items-table td:nth-child(1) { text-align: center; color: #94a3b8; }
        .zoho-items-table td:nth-child(3) { text-align: center; }
        .zoho-items-table td:nth-child(4) { text-align: right; }
        .zoho-items-table td:nth-child(5) { text-align: right; font-weight: 500; }

        .zoho-totals-block {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
        }

        .zoho-totals-table {
          width: 250px;
          font-size: 12px;
          line-height: 2;
        }

        .zoho-totals-table td {
          padding: 4px 8px;
        }

        .zoho-totals-table td:nth-child(2) {
          text-align: right;
          font-weight: 600;
          color: #0f172a;
        }

        .zoho-totals-table tr.total-row {
          border-top: 1px solid #e2e8f0;
          font-weight: 700;
          font-size: 13px;
        }

        .zoho-totals-table tr.balance-due-row {
          background: #f8fafc;
          border-top: 2px solid #3b82f6;
          font-weight: 700;
        }

        /* --- TABS SUB-SECTION --- */
        .zoho-tabs-wrapper {
          width: 100%;
          max-width: 800px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          margin-top: 12px;
          overflow: hidden;
        }

        .zoho-tabs-header {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .zoho-tab {
          padding: 10px 16px;
          cursor: pointer;
          border-right: 1px solid #cbd5e1;
          color: #64748b;
          background: #f8fafc;
        }

        .zoho-tab.active {
          background: #ffffff;
          color: #0f172a;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 8px;
          font-weight: 700;
        }

        .zoho-tab-content {
          padding: 16px;
          font-size: 12px;
          color: #334155;
          min-height: 80px;
        }

        .zoho-payment-table {
          width: 100%;
          border-collapse: collapse;
        }

        .zoho-payment-table th {
          text-align: left;
          color: #64748b;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px;
        }

        .zoho-payment-table td {
          padding: 8px;
          border-bottom: 1px solid #f1f5f9;
        }

        .zoho-empty-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #94a3b8;
          text-align: center;
          padding: 40px;
        }

        .zoho-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .zoho-modal-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Actions Dropdown CSS */
        .zoho-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 32px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          z-index: 100;
          min-width: 140px;
          overflow: hidden;
        }

        .zoho-dropdown-item {
          padding: 8px 12px;
          font-size: 12px;
          color: #334155;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }

        .zoho-dropdown-item:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
      `}</style>

      {/* Hidden file input for Attachment upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />

      {/* Zoho Split Panel Container */}
      <div className="zoho-container">
        
        {/* LEFT COLUMN: LIST GROUPED BY PATIENT PROFILE */}
        <div className="zoho-list-panel">
          <div className="zoho-list-header">
            
            <div className="zoho-list-title-bar">
              <div className="zoho-list-title">
                All Invoices
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => setShowCreateModal(true)}
                  style={{ borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>+</span> New
                </button>
                <button className="zoho-icon-btn" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                  ☰
                </button>
              </div>
            </div>

            <div className="zoho-search-wrapper">
              <span className="zoho-search-icon-inline">🔍</span>
              <input 
                type="text" 
                className="zoho-search-input" 
                placeholder="Search patient, ID, or status..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sorting Tab bar including Status option */}
            <div className="zoho-sort-bar">
              <div>Sort by:</div>
              <div className="zoho-sort-options">
                <span 
                  className={`zoho-sort-btn ${sortBy === 'date' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else setSortBy('date');
                  }}
                >
                  Time {sortBy === 'date' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
                <span 
                  className={`zoho-sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else setSortBy('name');
                  }}
                >
                  Name {sortBy === 'name' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
                <span 
                  className={`zoho-sort-btn ${sortBy === 'amount' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else setSortBy('amount');
                  }}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
                <span 
                  className={`zoho-sort-btn ${sortBy === 'status' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'status') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else setSortBy('status');
                  }}
                >
                  Status {sortBy === 'status' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
              </div>
            </div>

          </div>

          {/* Grouped Sidebar Scroll */}
          <div className="zoho-list-scroll">
            {sortedPatientProfiles.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No patient billing accounts found matching query.
              </div>
            ) : (
              sortedPatientProfiles.map((profile) => {
                const isExpanded = expandedPatients[profile.patientId] !== false;
                const initials = profile.patientName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                
                return (
                  <div key={profile.patientId} className="zoho-profile-card">
                    {/* Patient Card Header */}
                    <div 
                      className="zoho-profile-card-header"
                      onClick={(e) => togglePatientDropdown(profile.patientId, e)}
                    >
                      <div className="zoho-profile-avatar">{initials}</div>
                      <div className="zoho-profile-info">
                        <div className="zoho-profile-name">{profile.patientName}</div>
                        <div className="zoho-profile-meta">
                          {profile.invoices.length} {profile.invoices.length === 1 ? 'Invoice' : 'Invoices'} | 
                          <span style={{ color: '#0f172a', fontWeight: 'bold', marginLeft: '4px' }}>
                            ${profile.totalBilled.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className={`zoho-profile-chevron ${isExpanded ? 'open' : ''}`}>
                        ▼
                      </span>
                    </div>

                    {/* Expandable nested invoice list */}
                    {isExpanded && (
                      <div className="zoho-nested-invoices">
                        {profile.invoices.map((inv) => {
                          const isActive = selectedInvoice?.id === inv.id;
                          return (
                            <div 
                              key={inv.id}
                              className={`zoho-nested-card ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setActiveTab('invoice');
                              }}
                            >
                              <div>
                                <span className="zoho-nested-id">📄 {inv.id}</span>
                                <span className="zoho-nested-date">{new Date(inv.date).toLocaleDateString()}</span>
                              </div>
                              <div className="zoho-nested-right">
                                <span className="zoho-nested-amount">${inv.amount.toFixed(2)}</span>
                                <span className={`zoho-badge ${inv.status.toLowerCase().replace(' ', '_')}`}>
                                  {inv.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS AND PHYSICAL CARD VIEW */}
        <div className="zoho-detail-panel">
          {selectedInvoice ? (
            <>
              {/* Toolbar */}
              <div className="zoho-detail-header">
                <span className="zoho-detail-id">{selectedInvoice.id}</span>
                <div className="zoho-detail-actions">
                  
                  {/* Action Icons made fully operational */}
                  <div className="zoho-action-icons">
                    <button className="zoho-icon-btn" title="Edit Invoice" onClick={openEditDialog}>✏️</button>
                    <button className="zoho-icon-btn" title="Save PDF Copy" onClick={triggerPrint}>📄</button>
                    <button className="zoho-icon-btn" title="Print Invoice Statement" onClick={triggerPrint}>🖨️</button>
                    <button className="zoho-icon-btn" title="Send Email Statement" onClick={openEmailDialog}>✉️</button>
                    <button className="zoho-icon-btn" title="Attach Document Details" onClick={handleAttachmentUploadClick}>📎</button>
                  </div>

                  {/* Record Payment */}
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'VOIDED' ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleRecordPayment(selectedInvoice)}
                      style={{ background: '#3b82f6', borderColor: '#3b82f6', color: 'white', borderRadius: '4px' }}
                    >
                      Record Payment
                    </button>
                  ) : (
                    <button 
                      className={`btn ${selectedInvoice.status === 'VOIDED' ? 'btn-danger' : 'btn-success'}`}
                      disabled
                      style={{ color: 'white', opacity: 1, borderRadius: '4px' }}
                    >
                      {selectedInvoice.status === 'VOIDED' ? 'Voided' : '✓ Paid'}
                    </button>
                  )}

                  {/* Actions Dropdown */}
                  <button 
                    className="btn zoho-icon-btn" 
                    onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  >
                    More ▾
                  </button>

                  {showMoreDropdown && (
                    <div className="zoho-dropdown-menu">
                      <div className="zoho-dropdown-item" onClick={handleCloneInvoice}>Clone Invoice</div>
                      <div className="zoho-dropdown-item" onClick={handleVoidInvoice}>Void Invoice</div>
                      <div 
                        className="zoho-dropdown-item" 
                        style={{ color: '#ef4444' }} 
                        onClick={handleDeleteInvoice}
                      >
                        Delete Invoice
                      </div>
                    </div>
                  )}

                  <button 
                    className="zoho-icon-btn" 
                    style={{ color: '#ef4444' }} 
                    onClick={() => setSelectedInvoice(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Document Container */}
              <div className="zoho-detail-scroll">
                
                {/* 1. Zoho Print-Ready Invoice Sheet */}
                <div className="zoho-invoice-sheet" id="print-invoice-sheet">
                  
                  <div className={`zoho-ribbon ${selectedInvoice.status.toLowerCase().split(' ')[0]}`}>
                    {selectedInvoice.status}
                  </div>

                  <div style={{ position: 'absolute', top: '16px', right: '16px' }} id="customize-btn-box">
                    <button className="zoho-icon-btn" style={{ fontSize: '11px', display: 'flex', gap: '4px', padding: '4px 8px' }}>
                      ⚙️ Customize ▾
                    </button>
                  </div>

                  {/* Brand logo header */}
                  <div className="zoho-sheet-top" style={{ marginTop: '20px' }}>
                    <div className="zoho-brand">
                      <div className="zoho-brand-logo">H</div>
                      <div className="zoho-brand-details">
                        <h2>HotDoc Clinical Portal</h2>
                        <p>54 Zahir Heights, Harmada</p>
                        <p>Jabalpur - 128024</p>
                        <p>Madhya Pradesh, India</p>
                      </div>
                    </div>
                    
                    <div className="zoho-sheet-right-block">
                      <h1>INVOICE</h1>
                      <div className="zoho-balance-due-box">
                        <div className="zoho-balance-due-label">Balance Due</div>
                        <div className="zoho-balance-due-value">
                          ${selectedInvoice.status === 'PAID' || selectedInvoice.status === 'VOIDED' ? '0.00' : selectedInvoice.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client details */}
                  <div className="zoho-billing-info">
                    <div className="zoho-bill-to">
                      <h4>Bill To</h4>
                      <p className="zoho-bill-to-name">{selectedInvoice.patientName}</p>
                      {selectedInvoice.patientEmail && <p>{selectedInvoice.patientEmail}</p>}
                      {selectedInvoice.patientPhone && <p>{selectedInvoice.patientPhone}</p>}
                    </div>

                    <div className="zoho-invoice-metadata">
                      <span className="zoho-meta-label">Invoice Date :</span>
                      <span className="zoho-meta-value">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                      
                      <span className="zoho-meta-label">Terms :</span>
                      <span className="zoho-meta-value">Net 15</span>
                      
                      <span className="zoho-meta-label">Due Date :</span>
                      <span className="zoho-meta-value">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="zoho-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item & Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items && selectedInvoice.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{item.description}</td>
                          <td style={{ textAlign: 'center' }}>{item.qty.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>${item.rate.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>${item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Attachment list if uploaded */}
                  {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 && (
                    <div style={{ marginTop: '16px', fontSize: '11px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#64748b' }}>📎 Attached Documents:</span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {selectedInvoice.attachments.map((file: any, index: number) => (
                          <a 
                            key={index} 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', color: '#3b82f6', textDecoration: 'none' }}
                          >
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totals Summary */}
                  <div className="zoho-totals-block">
                    <table className="zoho-totals-table">
                      <tbody>
                        <tr>
                          <td>Sub Total</td>
                          <td>${selectedInvoice.amount.toFixed(2)}</td>
                        </tr>
                        <tr className="total-row">
                          <td>Total</td>
                          <td>${selectedInvoice.amount.toFixed(2)}</td>
                        </tr>
                        <tr className="balance-due-row">
                          <td>Balance Due</td>
                          <td>${selectedInvoice.status === 'PAID' || selectedInvoice.status === 'VOIDED' ? '0.00' : selectedInvoice.amount.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* 2. Zoho Sub-section Tabs */}
                <div className="zoho-tabs-wrapper">
                  <div className="zoho-tabs-header">
                    <div 
                      className={`zoho-tab ${activeTab === 'invoice' ? 'active' : ''}`}
                      onClick={() => setActiveTab('invoice')}
                    >
                      Comments & History
                    </div>
                    <div 
                      className={`zoho-tab ${activeTab === 'payments' ? 'active' : ''}`}
                      onClick={() => setActiveTab('payments')}
                    >
                      Payments ({selectedInvoice.payments?.length || 0})
                    </div>
                  </div>

                  <div className="zoho-tab-content">
                    {activeTab === 'invoice' && (
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '8px' }}>
                          📅 Invoice created on {new Date(selectedInvoice.date).toLocaleDateString()} at 10:00 AM
                        </div>
                        {selectedInvoice.status === 'PAID' ? (
                          <div style={{ color: '#10b981', fontWeight: 600 }}>
                            ✓ Payment received and recorded. Invoice closed.
                          </div>
                        ) : selectedInvoice.status === 'VOIDED' ? (
                          <div style={{ color: '#ef4444', fontWeight: 600 }}>
                            ❌ Invoice marked as VOIDED. No payment is required.
                          </div>
                        ) : (
                          <div style={{ color: '#f59e0b' }}>
                            ⚠️ Awaiting payment. Term duration Net 15 days is currently active.
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'payments' && (
                      <div>
                        {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                          <table className="zoho-payment-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Payment#</th>
                                <th>Reference#</th>
                                <th>Payment Mode</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedInvoice.payments.map((p: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{new Date(p.date).toLocaleDateString()}</td>
                                  <td style={{ color: '#3b82f6', fontWeight: 600 }}>{p.paymentNum}</td>
                                  <td>{p.reference}</td>
                                  <td>{p.mode}</td>
                                  <td style={{ fontWeight: 600 }}>${p.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                            No payment transactions recorded for this invoice yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="zoho-empty-view">
              <span className="zoho-empty-icon">📂</span>
              <h3>No Invoice Selected</h3>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Please select an invoice from the left patient list to view details.</p>
            </div>
          )}
        </div>

      </div>

      {/* --- CREATE MODAL --- */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-title" style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Create New Invoice
            </div>
            <div className="modal-desc" style={{ marginBottom: '16px' }}>
              Manually generate a clinical invoice billing a patient.
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="zoho-modal-form">
              
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select 
                  className="form-control"
                  value={newInvoicePatientId}
                  onChange={e => setNewInvoicePatientId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patientsList.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control"
                  placeholder="e.g. 150.00"
                  value={newInvoiceAmount}
                  onChange={e => setNewInvoiceAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Description</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={newInvoiceDesc}
                  onChange={e => setNewInvoiceDesc(e.target.value)}
                  placeholder="e.g. Clinical Consultation"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={newInvoiceDate}
                  onChange={e => setNewInvoiceDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-control"
                  value={newInvoiceStatus}
                  onChange={e => setNewInvoiceStatus(e.target.value)}
                >
                  <option value="SENT">Sent (Awaiting Payment)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING APPROVAL">Pending Approval</option>
                  <option value="PAID">Paid (Settled)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
                >
                  Save Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
              Edit Invoice {selectedInvoice.id}
            </div>
            <div className="modal-desc" style={{ marginBottom: '16px' }}>
              Modify invoice values and adjust transaction parameters.
            </div>

            <form onSubmit={handleEditSubmit} className="zoho-modal-form">
              
              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Description</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-control"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="SENT">Sent</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING APPROVAL">Pending Approval</option>
                  <option value="PAID">Paid</option>
                  <option value="VOIDED">Voided</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
                >
                  Apply Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- SEND EMAIL MODAL --- */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
              Send Invoice Email
            </div>
            <div className="modal-desc" style={{ marginBottom: '16px' }}>
              Transmit a clinical billing statement to the patient.
            </div>

            {emailSentSuccess ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                ✓ Email dispatched and communication log inserted successfully!
              </div>
            ) : (
              <form onSubmit={handleSendEmailSubmit} className="zoho-modal-form">
                
                <div className="form-group">
                  <label className="form-label">To (Patient Email)</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message Body</label>
                  <textarea 
                    className="form-control"
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '11px' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ flex: 1 }} 
                    onClick={() => setShowEmailModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
                  >
                    Send Email
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
