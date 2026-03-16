import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Gavel, Users, FileText, MessageSquare, Bell, Search, Menu, CheckCircle, 
  Clock, AlertTriangle, ArrowRight, ShieldCheck, LogOut, Activity, Plus, 
  Send, X, UploadCloud, File, Download, DollarSign, TrendingUp
} from 'lucide-react';

// --- CONFIGURAÇÃO CENTRALIZADA ---
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

// Persistência de configurações visuais (Tema e Logo)
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
};

// --- COMPONENTES ATÓMICOS ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// 0. ECRÃ DE LOGIN E REGISTO (GATEWAY SaaS)
// ============================================================================
const LoginPage = ({ onLogin, tenantConfig }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', officeName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isColdBoot, setIsColdBoot] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const bootTimer = setTimeout(() => setIsColdBoot(true), 4000);
    
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('pascale_token', data.token);
        onLogin(data.lawyer);
      } else {
        setError(data.error || 'Falha na autenticação.');
      }
    } catch (err) {
      setError('O servidor está a iniciar. Tente novamente em 30 segundos.');
    } finally {
      clearTimeout(bootTimer);
      setLoading(false);
      setIsColdBoot(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-10 text-center text-white" style={{ backgroundColor: isRegister ? '#1e293b' : tenantConfig.primaryColor }}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            {isRegister ? <ShieldCheck className="w-8 h-8" /> : <Gavel className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">{isRegister ? "Criar Escritório" : tenantConfig.logoText}</h1>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Plataforma SaaS Profissional</p>
        </div>
        <form onSubmit={handleAuth} className="p-10 space-y-4">
          {isRegister && (
            <>
              <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 transition-all" placeholder="Nome do Titular" onChange={e => setForm({...form, name: e.target.value})} />
              <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 transition-all" placeholder="Nome da Sociedade" onChange={e => setForm({...form, officeName: e.target.value})} />
            </>
          )}
          <input required type="email" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 transition-all" placeholder="E-mail Profissional" onChange={e => setForm({...form, email: e.target.value})} />
          <input required type="password" minLength={6} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 transition-all" placeholder="Palavra-passe" onChange={e => setForm({...form, password: e.target.value})} />
          
          <button type="submit" disabled={loading} className="w-full py-4 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1" style={{ backgroundColor: isRegister ? '#1e293b' : tenantConfig.primaryColor }}>
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isColdBoot && <span className="text-[9px] font-medium animate-pulse">A acordar servidor (30s)...</span>}
              </>
            ) : (isRegister ? "Registar Minha Conta" : "Entrar no Sistema")}
          </button>
          
          {error && <div className="p-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl text-center border border-red-100 animate-fade-in">{error}</div>}
          
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="w-full mt-6 text-xs font-extrabold text-slate-400 hover:text-indigo-600 uppercase tracking-tighter transition">
            {isRegister ? "Já possui conta? Entrar" : "Ainda não tem conta? Registe o seu Escritório"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 1. PAINEL ADMINISTRATIVO (CENTRO DE COMANDO)
// ============================================================================
const LawyerDashboard = ({ data, onMove, onAddCase, onAddFin, onAddDoc, onLogout, tenantConfig }) => {
  const [tab, setTab] = useState('kanban');
  const [modals, setModals] = useState({ case: false, fin: false, doc: false });
  const [formCase, setFormCase] = useState({ client: '', title: '', phone: '', processNumber: '' });
  const [formFin, setFormFin] = useState({ client: '', amount: '', dueDate: '', title: 'Honorários Iniciais', type: 'Boleto' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [docClient, setDocClient] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const activeClients = useMemo(() => Array.from(new Set(data.cases.map(c => c.client?.name || c.client))).filter(Boolean), [data.cases]);

  const handleCaseSubmit = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    if (await onAddCase(formCase)) {
      setModals({...modals, case: false});
      setFormCase({ client: '', title: '', phone: '', processNumber: '' });
    }
    setIsActionLoading(false);
  };

  const handleFinSubmit = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    if (await onAddFin(formFin)) {
      setModals({...modals, fin: false});
      setFormFin({ client: '', amount: '', dueDate: '', title: 'Honorários Iniciais', type: 'Boleto' });
    }
    setIsActionLoading(false);
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !docClient) return;
    setIsActionLoading(true);
    const fd = new FormData(); 
    fd.append('file', selectedFile); 
    fd.append('client', docClient); 
    fd.append('name', selectedFile.name);
    if (await onAddDoc(fd)) {
      setModals({...modals, doc: false});
      setSelectedFile(null);
    }
    setIsActionLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Profissional */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-8 space-y-8 shadow-2xl z-50" style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl"><Gavel className="w-6 h-6" /></div>
          <span className="font-black text-xl tracking-tighter uppercase">{tenantConfig.logoText}</span>
        </div>
        <nav className="flex-1 space-y-3">
          {[
            {id: 'kanban', icon: Activity, label: 'Gestão'},
            {id: 'leads', icon: Users, label: 'Leads CRM'},
            {id: 'docs', icon: FileText, label: 'Arquivo'},
            {id: 'finance', icon: DollarSign, label: 'Financeiro'}
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${tab === t.id ? 'bg-white/20 shadow-lg translate-x-1' : 'opacity-50 hover:opacity-100 hover:bg-white/5'}`}>
              <t.icon className="w-5 h-5" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition font-bold text-xs pt-6 border-t border-white/10"><LogOut className="w-4 h-4" /> Sair do Sistema</button>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-24 bg-white border-b flex items-center justify-between px-10 shadow-sm">
          <h1 className="text-2xl font-black text-slate-800 capitalize tracking-tight">{tab}</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => setModals({...modals, [tab === 'finance' ? 'fin' : tab === 'docs' ? 'doc' : 'case']: true})} className="px-6 py-3 rounded-2xl text-white font-bold shadow-xl flex items-center gap-2 hover:-translate-y-1 transition-all active:scale-95" style={{ backgroundColor: tenantConfig.primaryColor }}>
              <Plus className="w-5 h-5" /> <span>Lançar {tab === 'finance' ? 'Fatura' : 'Registo'}</span>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-800 border border-slate-200">
              {tenantConfig.advogado?.substring(0,2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 custom-scrollbar bg-slate-50/50">
          {tab === 'kanban' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {['peticao', 'analise_juiz', 'sentenca'].map(s => (
                <div key={s} className="bg-slate-200/40 rounded-[3rem] p-8 min-h-[650px] space-y-6 backdrop-blur-sm border border-white/50">
                  <div className="flex justify-between font-black text-[11px] text-slate-400 uppercase tracking-[0.2em] px-2">
                    <span>{s.replace('_', ' ')}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-slate-800 shadow-sm">{data.cases.filter(c => c.stage === s).length}</span>
                  </div>
                  {data.cases.filter(c => c.stage === s).map(c => (
                    <div key={c.id} className="bg-white p-8 rounded-[2rem] shadow-sm border-l-[8px] transition-all hover:shadow-2xl hover:-translate-y-1 group" style={{ borderLeftColor: c.anxietyScore > 70 ? '#ef4444' : tenantConfig.primaryColor }}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{c.status}</span>
                        {c.anxietyScore > 70 && <div className="bg-red-50 p-1.5 rounded-full"><AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /></div>}
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{c.client?.name || c.client}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate">{c.title}</p>
                      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <button className="text-green-600 font-black text-[10px] uppercase hover:opacity-70 transition">WhatsApp</button>
                        {s !== 'sentenca' && (
                          <button onClick={() => onMove(c.id, s)} className="bg-slate-50 text-slate-800 px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-slate-100 transition shadow-sm">Avançar ➔</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === 'leads' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                  <tr><th className="p-8">Nome do Lead</th><th className="p-8">Contacto</th><th className="p-8">Área</th><th className="p-8 text-right">Acção</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.leads.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/30 transition">
                      <td className="p-8 font-bold text-slate-800">{l.name}</td>
                      <td className="p-8 text-slate-500 text-sm font-medium">{l.phone}</td>
                      <td className="p-8"><span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{l.type}</span></td>
                      <td className="p-8 text-right"><button className="bg-green-500 text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform"><MessageSquare className="w-5 h-5" /></button></td>
                    </tr>
                  ))}
                  {data.leads.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Nenhum lead disponível</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'docs' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-8">Ficheiro Digital</th><th className="p-8">Cliente</th><th className="p-8">Tamanho</th><th className="p-8 text-right">Acção</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.docs.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/30 transition">
                        <td className="p-8 font-bold text-slate-800 flex items-center gap-4"><div className="p-2 bg-slate-100 rounded-lg text-slate-400"><File className="w-5 h-5" /></div> {d.name}</td>
                        <td className="p-8 text-slate-500 text-sm font-medium">{d.client}</td>
                        <td className="p-8 text-slate-400 text-[10px] font-black uppercase">{d.size}</td>
                        <td className="p-8 text-right">
                          <button onClick={() => d.url ? window.open(d.url, '_blank') : alert('Ficheiro a processar...')} className="font-black text-xs flex items-center gap-2 ml-auto hover:scale-105 transition-transform" style={{ color: tenantConfig.primaryColor }}>
                            <Download className="w-5 h-5" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'finance' && (
            <div className="space-y-8 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Total de Honorários</div>
                      <div className="text-4xl font-black text-slate-800">€ {data.fins.reduce((a,c)=>a+c.amount,0).toLocaleString()}</div>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-500 relative z-10" />
                  </div>
                  <div className="bg-indigo-900 p-10 rounded-[2.5rem] shadow-xl flex justify-between items-center text-white">
                    <div>
                      <div className="text-xs font-black text-white/50 uppercase mb-2 tracking-widest">Faturas Pendentes</div>
                      <div className="text-4xl font-black">{data.fins.filter(f => f.status !== 'Pago').length}</div>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl"><DollarSign className="w-8 h-8" /></div>
                  </div>
               </div>
               <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                        <tr><th className="p-8">Descrição da Fatura</th><th className="p-8">Valor</th><th className="p-8">Vencimento</th><th className="p-8">Status</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {data.fins.map(f => (
                           <tr key={f.id} className="hover:bg-slate-50 transition">
                              <td className="p-8 font-bold text-slate-800">{f.title} <div className="text-[10px] text-slate-400 font-medium">{f.client?.name || f.client}</div></td>
                              <td className="p-8 font-black text-slate-800">€ {f.amount.toLocaleString()}</td>
                              <td className="p-8 text-slate-400 text-xs font-bold">{f.dueDate}</td>
                              <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${f.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{f.status}</span></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals de Criação Real */}
      <Modal isOpen={modals.case} onClose={()=>setModals({...modals, case:false})} title="Registar Novo Processo">
        <form onSubmit={handleCaseSubmit} className="space-y-4">
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm outline-none focus:border-indigo-500" placeholder="Nome Completo do Cliente" value={formCase.client} onChange={e=>setFormCase({...formCase, client: e.target.value})} />
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm outline-none focus:border-indigo-500" placeholder="Título do Processo" value={formCase.title} onChange={e=>setFormCase({...formCase, title: e.target.value})} />
          <div className="flex gap-4">
            <input className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm outline-none focus:border-indigo-500" placeholder="WhatsApp (opcional)" value={formCase.phone} onChange={e=>setFormCase({...formCase, phone: e.target.value})} />
            <input className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm outline-none focus:border-indigo-500" placeholder="Nº Processo" value={formCase.processNumber} onChange={e=>setFormCase({...formCase, processNumber: e.target.value})} />
          </div>
          <button disabled={isActionLoading} className="w-full py-4 text-white rounded-2xl font-bold shadow-xl hover:opacity-90 transition flex justify-center items-center" style={{backgroundColor: tenantConfig.primaryColor}}>
            {isActionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Criar Processo na Nuvem"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.fin} onClose={()=>setModals({...modals, fin:false})} title="Lançar Cobrança">
        <form onSubmit={handleFinSubmit} className="space-y-4">
          <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm outline-none" value={formFin.client} onChange={e=>setFormFin({...formFin, client: e.target.value})}>
            <option value="">Seleccionar Cliente...</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm outline-none" placeholder="Descrição da Fatura" value={formFin.title} onChange={e=>setFormFin({...formFin, title: e.target.value})} />
          <div className="flex gap-4">
            <input required type="number" step="0.01" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm" placeholder="Valor (€)" value={formFin.amount} onChange={e=>setFormFin({...formFin, amount: e.target.value})} />
            <input required type="date" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm" value={formFin.dueDate} onChange={e=>setFormFin({...formFin, dueDate: e.target.value})} />
          </div>
          <button disabled={isActionLoading} className="w-full py-4 text-white rounded-2xl font-bold shadow-xl bg-green-600 hover:opacity-90 transition flex justify-center items-center">
            {isActionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Confirmar Lançamento"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.doc} onClose={()=>setModals({...modals, doc:false})} title="Upload Arquivo Seguro">
        <form onSubmit={handleDocSubmit} className="space-y-6">
          <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm" value={docClient} onChange={e=>setDocClient(e.target.value)}>
            <option value="">A quem pertence este ficheiro?</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all group relative cursor-pointer">
             <UploadCloud className="w-12 h-12 mb-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
             <p className="text-sm font-bold text-slate-600">{selectedFile ? selectedFile.name : "Clique para anexar o PDF"}</p>
             <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">Máximo 10MB</p>
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setSelectedFile(e.target.files[0])} />
          </div>
          <button disabled={isActionLoading || !selectedFile} className="w-full py-4 text-white rounded-2xl font-bold shadow-xl transition flex justify-center items-center" style={{backgroundColor: tenantConfig.primaryColor, opacity: (!selectedFile || isActionLoading) ? 0.5 : 1}}>
            {isActionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Iniciar Envio para Supabase"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// --- APP CONTROLLER (SINCRONIZAÇÃO NUVEM) ---
// ============================================================================
export default function App() {
  const [view, setView] = useState('login');
  const [tenant, setTenant] = useStickyState({ primaryColor: "#4f46e5", logoText: "PASCALE JURIS", advogado: "Administrador" }, 'pascale_tenant_config');
  const [data, setData] = useState({ cases: [], leads: [], docs: [], fins: [] });
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('pascale_token');
    if (!token) return setView('login');
    
    setLoading(true);
    try {
      const h = { 'Authorization': `Bearer ${token}` };
      const [c, l, d, f] = await Promise.all([
        fetch(`${API_URL}/cases`, {headers:h}).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/leads`, {headers:h}).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/documents`, {headers:h}).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/financials`, {headers:h}).then(r => r.ok ? r.json() : [])
      ]);
      setData({ cases: c, leads: l, docs: d, fins: f });
    } catch(e) { 
      // Em caso de erro 401/403, limpa o token e desloga
      localStorage.removeItem('pascale_token');
      setView('login');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    if (localStorage.getItem('pascale_token')) { 
      setView('dashboard'); 
      fetchAll(); 
    } 
  }, [fetchAll]);

  // Ações de Nuvem
  const onAddCase = async (d) => {
    const r = await fetch(`${API_URL}/cases`, { 
      method:'POST', 
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('pascale_token')}`}, 
      body:JSON.stringify(d) 
    });
    if (r.ok) { fetchAll(); return true; } 
    return false;
  };

  const onMove = async (id, current) => {
    const next = current === 'peticao' ? 'analise_juiz' : 'sentenca';
    await fetch(`${API_URL}/cases/${id}/move`, { 
      method:'PATCH', 
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('pascale_token')}`}, 
      body:JSON.stringify({ stage: next, status: 'Em Andamento' }) 
    });
    fetchAll();
  };

  const onAddFin = async (d) => {
    const r = await fetch(`${API_URL}/financials`, { 
      method:'POST', 
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('pascale_token')}`}, 
      body:JSON.stringify(d) 
    });
    if (r.ok) { fetchAll(); return true; }
    return false;
  };

  const onAddDoc = async (fd) => {
    const r = await fetch(`${API_URL}/documents`, { 
      method:'POST', 
      headers:{'Authorization':`Bearer ${localStorage.getItem('pascale_token')}`}, 
      body:fd 
    });
    if (r.ok) { fetchAll(); return true; } 
    return false;
  };

  return (
    <div className="antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
      
      {loading && view === 'dashboard' && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center gap-4">
           <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Ecossistema Cloud</p>
        </div>
      )}

      {view === 'login' ? (
        <LoginPage onLogin={(l)=>{setTenant(l); setView('dashboard'); fetchAll();}} tenantConfig={tenant} />
      ) : (
        <LawyerDashboard 
          data={data} 
          onMove={onMove} 
          onAddCase={onAddCase} 
          onAddFin={onAddFin}
          onAddDoc={onAddDoc} 
          onLogout={()=>{localStorage.removeItem('pascale_token'); setView('login');}} 
          tenantConfig={tenant} 
        />
      )}
    </div>
  );
}