"use client";

import { useEffect, useState, useRef } from 'react';

const API = 'http://127.0.0.1:3002';

export default function PatientMessages() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Conversations' | 'All Doctors'>('Conversations');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const sizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : Math.round(file.size / 1024) + ' KB';

      setPendingAttachments(prev => [...prev, {
        name: data.name,
        size: sizeStr,
        type: data.type.includes('image') ? 'image' : data.type.includes('video') ? 'video' : data.type.includes('audio') ? 'audio' : 'document',
        url: data.url
      }]);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchConversations(user.id);
    fetch(`${API}/api/doctors`).then(r => r.json()).then(d => setAllDoctors(d));
  }, []);

  useEffect(() => {
    if (activePartner && currentUser) {
      fetchMessages(currentUser.id, activePartner.partnerId);
    }
  }, [activePartner, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    const d = await fetch(`${API}/api/users/${userId}/conversations`).then(r => r.json());
    setConversations(d);
  };

  const fetchMessages = async (userId: string, partnerId: string) => {
    const d = await fetch(`${API}/api/messages/${userId}/${partnerId}`).then(r => r.json());
    setMessages(d);
    // Refresh conversations to update unread counts
    fetchConversations(userId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !activePartner) return;
    
    await fetch(`${API}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId: activePartner.partnerId,
        content: newMessage,
        attachments: pendingAttachments
      })
    });
    
    setNewMessage('');
    setPendingAttachments([]);
    fetchMessages(currentUser.id, activePartner.partnerId);
    fetchConversations(currentUser.id);
  };

  const startNewConversation = (doctor: any) => {
    setActivePartner({
      partnerId: doctor.id,
      partnerName: doctor.name,
      partnerRole: 'DOCTOR'
    });
    setActiveTab('Conversations');
  };

  const getInitials = (name: string) => name ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const conversationPartnerIds = new Set(conversations.map(c => c.partnerId));

  return (
    <>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Secure Messages</div>
          <div className="page-subtitle">Direct communication with your healthcare team</div>
        </div>
      </div>

      <div className="grid-cols-12 chat-container">
        
        {/* Left Panel: Inbox */}
        <div className="col-span-4" style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button 
              onClick={() => setActiveTab('Conversations')} 
              style={{ 
                flex: 1, padding: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeTab === 'Conversations' ? 'var(--bg-body)' : 'transparent',
                color: activeTab === 'Conversations' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'Conversations' ? '2px solid var(--text-primary)' : '2px solid transparent'
              }}
            >
              Conversations
            </button>
            <button 
              onClick={() => setActiveTab('All Doctors')} 
              style={{ 
                flex: 1, padding: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeTab === 'All Doctors' ? 'var(--bg-body)' : 'transparent',
                color: activeTab === 'All Doctors' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'All Doctors' ? '2px solid var(--text-primary)' : '2px solid transparent'
              }}
            >
              All Doctors ({allDoctors.length})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'Conversations' ? (
              conversations.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '8px' }}>No messages yet.</div>
                  <button 
                    onClick={() => setActiveTab('All Doctors')}
                    style={{ color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Message a doctor →
                  </button>
                </div>
              ) : (
                conversations.map(conv => (
                  <div 
                    key={conv.partnerId} 
                    onClick={() => setActivePartner(conv)}
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      background: activePartner?.partnerId === conv.partnerId ? 'var(--bg-body)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{conv.partnerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {conv.unread > 0 && (
                          <span style={{ background: '#3b82f6', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>{conv.unread}</span>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {conv.lastTime ? new Date(conv.lastTime).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                ))
              )
            ) : (
              // All Doctors tab
              allDoctors.length === 0 ? (
                <div className="empty-state">No doctors found.</div>
              ) : (
                allDoctors.map(doc => {
                  const hasConvo = conversationPartnerIds.has(doc.id);
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => startNewConversation(doc)}
                      style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid var(--border)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      className="hover:bg-slate-50"
                    >
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, color: '#0284c7', flexShrink: 0
                      }}>
                        {getInitials(doc.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{doc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {hasConvo ? 'Existing conversation' : 'Start new chat'}
                        </div>
                      </div>
                      {!hasConvo && (
                        <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>New</span>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {activePartner ? (
            <>
              <div className="chat-header">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{activePartner.partnerName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activePartner.partnerRole || 'Doctor'}</div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', paddingTop: '40px' }}>
                    No messages yet. Send a message to start the conversation.
                  </div>
                )}
                {messages.map(msg => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`chat-bubble ${isMine ? 'sent' : 'received'}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', alignSelf: isMine ? 'flex-end' : 'flex-start', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: isMine ? 'rgba(255,255,255,0.9)' : 'var(--text-primary)' }}>
                          {isMine ? 'You' : activePartner.partnerName}
                        </span>
                        <span style={{ 
                          fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
                          background: isMine ? 'rgba(255,255,255,0.2)' : '#e0f2fe',
                          color: isMine ? '#fff' : '#0284c7'
                        }}>
                          {isMine ? 'Patient' : 'Doctor'}
                        </span>
                      </div>
                      <div style={{ alignSelf: isMine ? 'flex-end' : 'flex-start' }}>{msg.content}</div>
                      <div className="chat-time" style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                          {msg.attachments.map((att: any, aIdx: number) => (
                             <a key={aIdx} href={`${API}${att.url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isMine ? 'rgba(255,255,255,0.2)' : '#fff', padding: '6px 10px', borderRadius: '8px', textDecoration: 'none', color: isMine ? '#fff' : '#0f172a', minWidth: '150px' }}>
                               <span style={{ fontSize: '18px' }}>📎</span>
                               <div style={{ flex: 1, overflow: 'hidden' }}>
                                 <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{att.name}</div>
                                 <div style={{ fontSize: '10px', opacity: 0.8 }}>{att.size}</div>
                               </div>
                             </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSend}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <button type="button" className="btn btn-ghost" style={{ padding: '0 12px', fontSize: '18px', position: 'relative', color: pendingAttachments.length > 0 ? '#3b82f6' : 'inherit' }} onClick={() => fileInputRef.current?.click()}>
                   📎
                   {pendingAttachments.length > 0 && (
                     <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingAttachments.length}</span>
                   )}
                </button>
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder="Type a secure message..." 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={!newMessage.trim() && pendingAttachments.length === 0}>Send</button>
              </form>
            </>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <div>Select a conversation or choose a doctor to start messaging</div>
              <button 
                onClick={() => setActiveTab('All Doctors')}
                style={{ color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Browse doctors →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
