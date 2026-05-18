"use client";

import { useEffect, useState, useRef } from 'react';

const API = 'http://127.0.0.1:3002';

export default function DoctorMessages() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Private Chat' | 'All Contacts' | 'AI Assistant'>('Private Chat');
  const [aiMessages, setAiMessages] = useState<any[]>([
    { id: '1', senderId: 'AI_ASSISTANT', content: 'Hello Doctor! I am your Gemini Clinical AI. How can I assist you with your patients today?', createdAt: new Date() }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('hotdoc_user');
    if (!userStr) { window.location.href = '/login'; return; }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchConversations(user.id);
    fetch(`${API}/api/patients`).then(r => r.json()).then(d => setAllPatients(d));
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
    try {
      const r = await fetch(`${API}/api/users/${userId}/conversations`);
      if (r.ok) {
        const d = await r.json();
        // Use real unread counts from the API - no fake injection
        setConversations(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (userId: string, partnerId: string) => {
    try {
      const r = await fetch(`${API}/api/messages/${userId}/${partnerId}`);
      if (r.ok) {
        const d = await r.json();
        setMessages(d);
        // Refresh conversations to update unread counts
        fetchConversations(userId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !activePartner) return;
    
    if (activePartner.partnerId === 'AI_ASSISTANT') {
      const userMsg = { id: Date.now().toString(), senderId: currentUser.id, content: newMessage, createdAt: new Date() };
      setAiMessages(prev => [...prev, userMsg]);
      setNewMessage('');
      setIsAiTyping(true);
      
      try {
        const historyForAi = aiMessages.map(m => ({
          role: m.senderId === 'AI_ASSISTANT' ? 'model' : 'user',
          content: m.content
        }));
        
        const res = await fetch(`${API}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage, history: historyForAi })
        });
        const data = await res.json();
        
        setAiMessages(prev => [...prev, {
          id: Date.now().toString() + 'ai',
          senderId: 'AI_ASSISTANT',
          content: data.response || data.error || "Sorry, I encountered an error.",
          createdAt: new Date()
        }]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiTyping(false);
      }
      return;
    }
    
    try {
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
    } catch (e) {
      console.error(e);
    }
  };

  const startNewConversation = (patient: any) => {
    setActivePartner({ 
      partnerId: patient.id, 
      partnerName: patient.name, 
      partnerRole: 'PATIENT',
      isOnline: false 
    });
    setActiveTab('Private Chat');
  };

  const getInitials = (name: string) => name ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  // Filter all patients to exclude those we already have conversations with
  const conversationPartnerIds = new Set(conversations.map(c => c.partnerId));
  const newContacts = allPatients.filter(p => !conversationPartnerIds.has(p.id));

  return (
    <div className="font-sans flex flex-col h-[calc(100vh-100px)]">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-xl font-semibold text-slate-800">App</h1>
        <span className="text-slate-400 text-sm">❯</span>
        <h2 className="text-xl text-slate-400">Chat</h2>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        
        {/* Left Panel: Contact List */}
        <div className="w-80 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Search */}
          <div className="p-6 pb-4">
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search here..." 
                className="w-full bg-slate-50 text-sm rounded-full pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#348e7b]/20 transition-all"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between px-6 pb-4 text-xs font-semibold border-b border-slate-100 border-dashed">
            <button 
              onClick={() => setActiveTab('Private Chat')}
              className={activeTab === 'Private Chat' ? "text-[#348e7b]" : "text-slate-400 hover:text-slate-600"}
            >
              Private Chat
            </button>
            <button 
              onClick={() => setActiveTab('All Contacts')}
              className={activeTab === 'All Contacts' ? "text-[#348e7b]" : "text-slate-400 hover:text-slate-600 flex items-center gap-1"}
            >
              All Contacts
              {newContacts.length > 0 && (
                <span className="bg-[#348e7b] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center ml-1">{allPatients.length}</span>
              )}
            </button>
            <button 
              onClick={() => {
                setActiveTab('AI Assistant');
                setActivePartner({ partnerId: 'AI_ASSISTANT', partnerName: 'Gemini Clinical AI', partnerRole: 'AI ASSISTANT' });
              }}
              className={activeTab === 'AI Assistant' ? "text-purple-600 flex items-center gap-1" : "text-slate-400 hover:text-purple-600 flex items-center gap-1"}
            >
              ✨ Gemini AI
            </button>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {activeTab === 'Private Chat' ? (
              conversations.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10 px-4">
                  <p className="mb-2">No conversations yet.</p>
                  <button 
                    onClick={() => setActiveTab('All Contacts')}
                    className="text-[#348e7b] font-semibold hover:underline"
                  >
                    Start a new chat →
                  </button>
                </div>
              ) : (
                conversations.map(conv => (
                  <div 
                    key={conv.partnerId} 
                    onClick={() => setActivePartner(conv)}
                    className={`flex items-start gap-4 p-3 rounded-2xl cursor-pointer transition-colors ${
                      activePartner?.partnerId === conv.partnerId ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold">
                        {getInitials(conv.partnerName)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{conv.partnerName}</h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {conv.lastTime ? new Date(conv.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-400 truncate pr-2">
                          {conv.lastMessage || 'Say hello!'}
                        </p>
                        {conv.unread > 0 && (
                          <div className="w-5 h-5 rounded-full bg-[#348e7b] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {conv.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              // All Contacts tab - show ALL patients (existing convos + new)
              allPatients.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10">No patients found.</div>
              ) : (
                allPatients.map(pat => {
                  const hasConvo = conversationPartnerIds.has(pat.id);
                  return (
                    <div 
                      key={pat.id} 
                      onClick={() => startNewConversation(pat)}
                      className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors ${
                        activePartner?.partnerId === pat.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold">
                          {getInitials(pat.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{pat.name}</h4>
                        <p className="text-xs text-slate-400 truncate">
                          {hasConvo ? 'Existing conversation' : 'Start new chat'}
                        </p>
                      </div>
                      {!hasConvo && (
                        <div className="text-[#348e7b] text-xs font-semibold">New</div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Right Panel: Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold relative">
                    {getInitials(activePartner.partnerName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{activePartner.partnerName}</h3>
                    <div className="text-xs text-slate-400 font-medium">{activePartner.partnerRole || 'Patient'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path></svg>
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg>
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#fafafa]">
                {(activePartner.partnerId === 'AI_ASSISTANT' ? aiMessages : messages).length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-10">
                    No messages yet. Send a message to start the conversation.
                  </div>
                )}

                {(activePartner.partnerId === 'AI_ASSISTANT' ? aiMessages : messages).map((msg) => {
                  const isMine = msg.senderId === currentUser?.id;
                  const hasAttachments = msg.attachments && msg.attachments.length > 0;

                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 w-full ${isMine ? 'items-end' : 'items-start'}`}>
                      {/* Name, Avatar, Time Header */}
                      <div className={`flex items-center gap-2 mb-1 ${isMine ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                        {isMine ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold text-[10px]">
                              {getInitials(currentUser.name)}
                            </div>
                            <span className="text-xs font-bold text-slate-800">You</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider">Doctor</span>
                            <span className="text-xs text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-[10px]">
                              {getInitials(activePartner.partnerName)}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{activePartner.partnerName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">Patient</span>
                            <span className="text-xs text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMine 
                          ? 'bg-[#348e7b] text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>

                      {/* Real Attachments */}
                      {hasAttachments && (
                        <div className={`flex flex-col gap-2 mt-2 ${isMine ? 'mr-1 items-end' : 'ml-10'}`}>
                          {msg.attachments.map((att: any, aIdx: number) => (
                            <div key={aIdx} className="flex items-center gap-4 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-100 w-72">
                              <div className="text-[#348e7b]">
                                {att.type === 'video' ? (
                                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                                ) : att.type === 'audio' ? (
                                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                                ) : (
                                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-700 truncate">{att.name}</div>
                                <div className="text-xs text-slate-400">{att.size}</div>
                              </div>
                              <a href={`${API}${att.url}`} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#348e7b] shadow-sm hover:bg-slate-50 transition-colors">
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
                {isAiTyping && (
                  <div className="flex items-start gap-2 ml-1">
                    <div className="w-6 h-6 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center text-purple-600 font-bold text-[10px]">AI</div>
                    <div className="bg-slate-100 px-5 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center h-10">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="px-8 py-5 bg-white border-t border-slate-50">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <form 
                  onSubmit={handleSend} 
                  className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-full pl-5 pr-2 py-2"
                >
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`relative transition-colors ${pendingAttachments.length > 0 ? 'text-[#348e7b]' : 'text-slate-400 hover:text-[#348e7b]'}`}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    {pendingAttachments.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {pendingAttachments.length}
                      </span>
                    )}
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" 
                    placeholder="Type a secure message..." 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() && pendingAttachments.length === 0}
                    className="w-10 h-10 rounded-full bg-[#348e7b] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a7363] transition-colors shadow-sm"
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-[#348e7b] mb-4">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <p className="font-semibold text-slate-600">No chat selected</p>
              <p className="text-sm">Choose a contact from the left panel to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
