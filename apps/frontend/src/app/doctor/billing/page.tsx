"use client";

import { useEffect, useState } from 'react';

const API = 'http://127.0.0.1:3002';

export default function DoctorBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/invoices`)
      .then(r => r.json())
      .then(d => setInvoices(d));

    fetch(`${API}/api/patients`)
      .then(r => r.json())
      .then(d => {
        const pMap: Record<string, any> = {};
        d.forEach((p: any) => pMap[p.id] = p);
        setPatients(pMap);
      });
  }, []);

  const markPaid = async () => {
    if (!selectedInvoice) return;
    await fetch(`${API}/api/invoices/${selectedInvoice.id}/mark-paid`, { method: 'PUT' });
    const fresh = await fetch(`${API}/api/invoices`).then(r => r.json());
    setInvoices(fresh);
    setSelectedInvoice(null);
  };

  const totalOutstanding = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-title">Billing & Invoices</div>
          <div className="page-subtitle">Revenue and accounts receivable</div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Outstanding Balance</div>
          <div className="kpi-value" style={{ color: 'var(--status-canceled)' }}>${totalOutstanding.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Collected</div>
          <div className="kpi-value" style={{ color: 'var(--status-completed)' }}>${totalCollected.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending Invoices</div>
          <div className="kpi-value">{invoices.filter(i => i.status === 'UNPAID').length}</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Patient</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No invoices found.</td></tr>
            ) : (
              invoices.map(inv => {
                const patient = patients[inv.patientId];
                return (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{inv.id.slice(0,8).toUpperCase()}</td>
                    <td style={{ fontWeight: 500 }}>{patient?.name || 'Unknown'}</td>
                    <td>Consultation Session</td>
                    <td>${inv.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${inv.status === 'PAID' ? 'completed' : 'canceled'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => setSelectedInvoice(inv)}>View Details</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Drawer */}
      {selectedInvoice && (
        <div className="drawer-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Invoice Details</div>
              <button className="btn btn-sm" onClick={() => setSelectedInvoice(null)}>✕</button>
            </div>
            <div className="drawer-body">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Patient</div>
                <div style={{ fontWeight: 600 }}>{patients[selectedInvoice.patientId]?.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{patients[selectedInvoice.patientId]?.email}</div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Service</span>
                  <span style={{ fontWeight: 600 }}>Amount</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>General Consultation</span>
                  <span>${selectedInvoice.amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '8px', fontWeight: 600, fontSize: '16px' }}>
                  <span>Total</span>
                  <span>${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                <span className={`status-badge ${selectedInvoice.status === 'PAID' ? 'completed' : 'canceled'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                  {selectedInvoice.status}
                </span>
                {selectedInvoice.status === 'PAID' && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Paid via {selectedInvoice.paymentMethod}
                  </div>
                )}
              </div>
            </div>
            <div className="drawer-footer">
              {selectedInvoice.status === 'UNPAID' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn" style={{ flex: 1 }}>Send Reminder</button>
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={markPaid}>Mark as Paid</button>
                </div>
              ) : (
                <button className="btn" style={{ width: '100%' }}>Download Receipt</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
