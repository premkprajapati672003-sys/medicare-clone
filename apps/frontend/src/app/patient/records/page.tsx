"use client";

import { useEffect, useState, useRef } from 'react';

const API = 'http://127.0.0.1:3002';

export default function PatientRecords() {
  const [history, setHistory] = useState<any>({ records: [], prescriptions: [] });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'documents'>('timeline');
  const [standaloneDocs, setStandaloneDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-title">Electronic Health Record</div>
          <div className="page-subtitle">{currentUser.name} • ID: {currentUser.id.slice(0,8)}</div>
        </div>
      </div>

      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Clinical Timeline</button>
        <button className={`tab-btn ${activeTab === 'medications' ? 'active' : ''}`} onClick={() => setActiveTab('medications')}>Medications</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents & Scans</button>
      </div>

      {activeTab === 'timeline' && (
        <div className="card" style={{ maxWidth: '800px' }}>
          {history.records.length === 0 ? (
            <div className="empty-state">No clinical history found.</div>
          ) : (
            <div className="timeline">
              {history.records.map((r: any) => (
                <div key={r.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Consultation</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Doctor ID: {r.doctorId.slice(0,6)}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {r.clinicalNotes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              {history.prescriptions.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No active prescriptions.</td></tr>
              ) : (
                history.prescriptions.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.medicationName}</td>
                    <td>{p.dosage}</td>
                    <td>{p.repeatsAllowed}</td>
                    <td><span className="status-badge scheduled">ACTIVE</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'documents' && (
        <div style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <label className={`btn btn-primary ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isUploading ? 'Uploading...' : '+ Upload Document'}
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="doc-grid">
            {standaloneDocs.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No documents or attachments found.</div>
            ) : (
              standaloneDocs.map((doc: any) => (
                <a href={`${API}${doc.url}`} target="_blank" rel="noopener noreferrer" key={doc.id} className="doc-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="doc-icon">{doc.type === 'image' ? '🖼️' : '📄'}</div>
                  <div className="doc-name" title={doc.name}>{doc.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {doc.size} • {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
