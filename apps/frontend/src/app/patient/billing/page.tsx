"use client";

import { useEffect, useState } from 'react';

const API = 'http://127.0.0.1:3002';

export default function PatientBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const user = JSON.parse(userStr);
    setCurrentUser(user);

    fetch(`${API}/api/patients/${user.id}/invoices`)
      .then(r => r.json())
      .then(d => setInvoices(d));
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsProcessing(true);
    
    // Simulate payment delay
    setTimeout(async () => {
      await fetch(`${API}/api/invoices/${selectedInvoice.id}/pay`, { method: 'POST' });
      const fresh = await fetch(`${API}/api/patients/${currentUser.id}/invoices`).then(r => r.json());
      setInvoices(fresh);
      setIsProcessing(false);
      setSelectedInvoice(null);
    }, 1500);
  };

  const totalOutstanding = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-title">Billing & Payments</div>
          <div className="page-subtitle">Manage your clinic invoices</div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Outstanding Balance</div>
          <div className="kpi-value" style={{ color: totalOutstanding > 0 ? 'var(--status-canceled)' : 'var(--text-primary)' }}>${totalOutstanding.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Unpaid Invoices</div>
          <div className="kpi-value">{invoices.filter(i => i.status === 'UNPAID').length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Paid Invoices</div>
          <div className="kpi-value">{invoices.filter(i => i.status === 'PAID').length}</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Date</th>
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
              invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{inv.id.slice(0,8).toUpperCase()}</td>
                  <td>{new Date().toLocaleDateString()}</td>
                  <td>General Consultation</td>
                  <td style={{ fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${inv.status === 'PAID' ? 'completed' : 'canceled'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => setSelectedInvoice(inv)}>
                      {inv.status === 'UNPAID' ? 'Pay Now' : 'View Receipt'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Drawer */}
      {selectedInvoice && (
        <div className="drawer-overlay" onClick={() => !isProcessing && setSelectedInvoice(null)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ fontWeight: 600, fontSize: '15px' }}>
                {selectedInvoice.status === 'UNPAID' ? 'Secure Checkout' : 'Receipt'}
              </div>
              <button className="btn btn-sm" onClick={() => !isProcessing && setSelectedInvoice(null)} disabled={isProcessing}>✕</button>
            </div>
            <div className="drawer-body">
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

              {selectedInvoice.status === 'UNPAID' ? (
                <form onSubmit={handlePay}>
                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input type="text" className="form-control" required defaultValue={currentUser?.name} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input type="text" className="form-control" required placeholder="4242 4242 4242 4242" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Expiry</label>
                      <input type="text" className="form-control" required placeholder="MM/YY" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">CVC</label>
                      <input type="text" className="form-control" required placeholder="123" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginTop: '16px', padding: '12px' }}>
                    {isProcessing ? 'Processing Securely...' : `Pay $${selectedInvoice.amount.toFixed(2)}`}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <div style={{ fontWeight: 600, fontSize: '18px', color: 'var(--status-completed)' }}>Payment Successful</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Paid via {selectedInvoice.paymentMethod || 'Credit Card'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
