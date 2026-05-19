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

export default function PatientBilling() {
  const [dbInvoices, setDbInvoices] = useState<any[]>([]);
  const [localMocksCache, setLocalMocksCache] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Tab State inside selected invoice
  const [activeTab, setActiveTab] = useState<'invoice' | 'payments'>('invoice');

  // Payment checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Invoices & Patient credentials
  const loadData = (userId: string) => {
    fetch(`${API}/api/patients/${userId}/invoices`)
      .then(r => r.json())
      .then(d => setDbInvoices(d))
      .catch(() => {});

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
    if (!userStr) {
      window.location.href = '/login';
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    loadData(user.id);
  }, []);

  // Sync back when selection might change
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !currentUser) return;
    setIsProcessing(true);

    // Simulate payment delay
    setTimeout(async () => {
      try {
        if (!selectedInvoice.isMock) {
          // SQLite db invoice payment
          await fetch(`${API}/api/invoices/${selectedInvoice.id}/pay`, { method: 'POST' });
          
          // Re-fetch db invoices
          const freshDb = await fetch(`${API}/api/patients/${currentUser.id}/invoices`).then(r => r.json());
          setDbInvoices(freshDb);
          
          // Update selected invoice reference in state
          const updatedSelected = {
            ...selectedInvoice,
            status: 'PAID',
            payments: [
              {
                date: new Date().toISOString().split('T')[0],
                paymentNum: 'REF-DB',
                reference: 'REF-' + Math.floor(Math.random() * 90000 + 10000),
                mode: 'Credit Card',
                amount: selectedInvoice.amount
              }
            ]
          };
          setSelectedInvoice(updatedSelected);
        } else {
          // Local Mock Invoice payment
          const freshMocks = localMocksCache.map(item => {
            if (item.invoiceNum === selectedInvoice.id) {
              return {
                ...item,
                status: 'PAID',
                payments: [
                  {
                    date: new Date().toISOString().split('T')[0],
                    paymentNum: '59',
                    reference: 'REF-' + Math.floor(Math.random() * 90000 + 10000),
                    mode: 'Credit Card',
                    amount: selectedInvoice.amount
                  }
                ]
              };
            }
            return item;
          });
          setLocalMocksCache(freshMocks);
          localStorage.setItem('hotdoc_mock_invoices', JSON.stringify(freshMocks));

          const updatedSelected = {
            ...selectedInvoice,
            status: 'PAID',
            payments: [
              {
                date: new Date().toISOString().split('T')[0],
                paymentNum: '59',
                reference: 'REF-MOCK-PAY',
                mode: 'Credit Card',
                amount: selectedInvoice.amount
              }
            ]
          };
          setSelectedInvoice(updatedSelected);
        }
      } catch (err) {
        console.error("Payment failed", err);
      } finally {
        setIsProcessing(false);
        setShowCheckoutModal(false);
      }
    }, 1500);
  };

  const triggerPrint = () => {
    window.print();
  };

  // Compile active patient invoices
  const buildCurrentInvoices = () => {
    const list: any[] = [];
    if (!currentUser) return list;

    // 1. Database Invoices
    dbInvoices.forEach((dbInv, idx) => {
      list.push({
        id: dbInv.id,
        isMock: false,
        patientName: currentUser.name,
        patientEmail: currentUser.email,
        patientPhone: currentUser.phone || '555-0200',
        amount: dbInv.amount,
        status: dbInv.status,
        date: dbInv.createdAt ? dbInv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: dbInv.createdAt ? dbInv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        items: [
          { description: 'General Consultation Service', qty: 1, rate: dbInv.amount, amount: dbInv.amount }
        ],
        payments: dbInv.status === 'PAID' ? [
          {
            date: dbInv.updatedAt ? dbInv.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            paymentNum: `PAY-${dbInv.id.slice(0, 4).toUpperCase()}`,
            reference: 'REF-SECURE',
            mode: 'Credit Card',
            amount: dbInv.amount
          }
        ] : []
      });
    });

    // 2. Mock Invoices
    localMocksCache.forEach((tpl, idx) => {
      if (tpl.patientEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        list.push({
          id: tpl.invoiceNum || `INV-MOCK${idx}`,
          isMock: true,
          patientName: currentUser.name,
          patientEmail: currentUser.email,
          patientPhone: currentUser.phone || '555-0200',
          amount: tpl.amount,
          status: tpl.status,
          date: tpl.date,
          dueDate: tpl.dueDate,
          items: tpl.items,
          payments: tpl.payments
        });
      }
    });

    return list;
  };

  const allInvoices = buildCurrentInvoices();

  // Search Filter
  const filteredInvoices = allInvoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    const idMatch = inv.id.toLowerCase().includes(q);
    const statusMatch = inv.status.toLowerCase().includes(q);
    const descMatch = inv.items?.some((i: any) => i.description.toLowerCase().includes(q));
    return idMatch || statusMatch || descMatch;
  });

  // Sorting
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'date') {
      comp = a.date.localeCompare(b.date);
    } else if (sortBy === 'amount') {
      comp = a.amount - b.amount;
    } else if (sortBy === 'status') {
      comp = a.status.localeCompare(b.status);
    }
    return sortOrder === 'desc' ? -comp : comp;
  });

  // Aggregates
  const totalOutstanding = allInvoices
    .filter(i => i.status !== 'PAID' && i.status !== 'VOIDED')
    .reduce((sum, i) => sum + i.amount, 0);

  const unpaidCount = allInvoices.filter(i => i.status !== 'PAID' && i.status !== 'VOIDED').length;

  return (
    <>
      <style>{`
        /* Zoho Split Panel Container styling matching Doctor */
        .zoho-container {
          display: flex;
          height: calc(100vh - 160px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          font-family: 'Open Sans', 'Inter', sans-serif;
          margin-top: 16px;
        }

        .zoho-list-panel {
          width: 320px;
          border-right: 1px solid #cbd5e1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
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
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
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

        /* Flat card styling for patient list on left side */
        .zoho-flat-card {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          transition: background 0.15s;
        }

        .zoho-flat-card:hover {
          background: #f8fafc;
        }

        .zoho-flat-card.active {
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

        /* Print Media queries to only print the sheet */
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
          }
          #customize-btn-box {
            display: none !important;
          }
        }
      `}</style>

      {/* KPI Strip */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Billing & Invoices</div>
          <div className="page-subtitle">View invoices, print receipts, and complete balances.</div>
        </div>
      </div>

      <div className="kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
        <div className="kpi-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kpi-label" style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding Balance</div>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, color: totalOutstanding > 0 ? '#ef4444' : '#0f172a', marginTop: '4px' }}>
            ${totalOutstanding.toFixed(2)}
          </div>
        </div>
        <div className="kpi-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kpi-label" style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unpaid Invoices</div>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, color: unpaidCount > 0 ? '#3b82f6' : '#0f172a', marginTop: '4px' }}>
            {unpaidCount}
          </div>
        </div>
        <div className="kpi-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kpi-label" style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paid Invoices</div>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
            {allInvoices.filter(i => i.status === 'PAID').length}
          </div>
        </div>
      </div>

      <div className="zoho-container">
        {/* LEFT COLUMN: LIST DIRECTLY (NO PATIENT DROPDOWNS) */}
        <div className="zoho-list-panel">
          <div className="zoho-list-header">
            <div className="zoho-list-title-bar">
              <div className="zoho-list-title">
                My Statements
              </div>
            </div>

            <div className="zoho-search-wrapper">
              <span className="zoho-search-icon-inline">🔍</span>
              <input 
                type="text" 
                className="zoho-search-input" 
                placeholder="Search invoice, status, desc..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sorting Tab bar */}
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

          <div className="zoho-list-scroll">
            {sortedInvoices.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No statements found matching your parameters.
              </div>
            ) : (
              sortedInvoices.map((inv) => {
                const isActive = selectedInvoice?.id === inv.id;
                const matchesEmail = inv.patientEmail.toLowerCase() === currentUser?.email?.toLowerCase();
                if (!matchesEmail) return null;

                return (
                  <div 
                    key={inv.id} 
                    className={`zoho-flat-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setActiveTab('invoice');
                    }}
                  >
                    <div>
                      <span className="zoho-nested-id">📄 {inv.id.slice(0, 10)}</span>
                      <span className="zoho-nested-date">{new Date(inv.date).toLocaleDateString()}</span>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                        {inv.items?.[0]?.description || 'General Service'}
                      </div>
                    </div>
                    <div className="zoho-nested-right">
                      <span className="zoho-nested-amount">${inv.amount.toFixed(2)}</span>
                      <span className={`zoho-badge ${inv.status.toLowerCase().replace(' ', '_')}`}>
                        {inv.status}
                      </span>
                    </div>
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
                  
                  {/* Action Icons */}
                  <div className="zoho-action-icons">
                    <button className="zoho-icon-btn" title="Print Receipt" onClick={triggerPrint}>🖨️</button>
                    <button className="zoho-icon-btn" title="Download Statement" onClick={triggerPrint}>📄</button>
                  </div>

                  {/* Payment checkout triggers */}
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'VOIDED' ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCheckoutModal(true)}
                      style={{ background: '#3b82f6', borderColor: '#3b82f6', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      💳 Secure Pay
                    </button>
                  ) : (
                    <button 
                      className={`btn ${selectedInvoice.status === 'VOIDED' ? 'btn-danger' : 'btn-success'}`}
                      disabled
                      style={{ color: 'white', opacity: 1, borderRadius: '4px' }}
                    >
                      {selectedInvoice.status === 'VOIDED' ? 'Voided' : '✓ Settled'}
                    </button>
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
                      🛡️ Secure Copy
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
                          📅 Invoice generated on {new Date(selectedInvoice.date).toLocaleDateString()} at 10:00 AM
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
              <h3>No Statement Selected</h3>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Please select a statement invoice from the left ledger to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- SECURE CHECKOUT MODAL --- */}
      {showCheckoutModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => !isProcessing && setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="modal-title text-slate-800" style={{ fontSize: '16px', fontWeight: 700 }}>Secure Checkout</h3>
                <p className="modal-desc" style={{ fontSize: '12px', color: '#64748b' }}>Stripe Mock Secure Payment Gateway</p>
              </div>
              <button 
                onClick={() => !isProcessing && setShowCheckoutModal(false)} 
                className="text-slate-400 hover:text-slate-600"
                disabled={isProcessing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="zoho-modal-form">
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Invoice Reference:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedInvoice.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '6px', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                  <span>Total Amount Due:</span>
                  <span style={{ color: '#2563eb' }}>${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Holder Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  defaultValue={currentUser?.name} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="4242 4242 4242 4242" 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 form-group">
                  <label className="form-label">Expiration</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="MM/YY" 
                  />
                </div>
                <div className="flex-1 form-group">
                  <label className="form-label">CVC Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="123" 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCheckoutModal(false)} 
                  disabled={isProcessing} 
                  className="btn flex-1"
                  style={{ borderRadius: '4px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="btn btn-primary flex-1"
                  style={{ background: '#3b82f6', borderColor: '#3b82f6', color: 'white', borderRadius: '4px' }}
                >
                  {isProcessing ? 'Processing Securely...' : `Pay $${selectedInvoice.amount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
