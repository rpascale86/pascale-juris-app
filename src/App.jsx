import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Gavel, Users, FileText, MessageSquare, Bell, Menu, CheckCircle, 
  Clock, AlertTriangle, ArrowRight, ShieldCheck, LogOut, Activity, Plus, 
  Send, X, UploadCloud, File, Download, DollarSign, TrendingUp, FolderOpen,
  Briefcase, Search, ExternalLink, Info, Filter
} from 'lucide-react';

// ============================================================================
// --- CONFIGURAÇÃO CENTRALIZADA DA NUVEM ---
// ============================================================================
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

// --- HOOKS DE PERSISTÊNCIA ---
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
};

// --- UTILITÁRIOS ---
const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const formatDate = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

const applyProcessMask = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length <= 7) return v;
  if (v.length <= 9) return v.replace(/(\d{7})(\d{2})/, '$1-$2');
  if (v.length <= 13) return v.replace(/(\d{7})(\d{2})(\d{4})/, '$1-$2.$3');
  if (v.length <= 14) return v.replace(/(\d{7})(\d{2})(\d{4})(\d{1})/, '$1-$2.$3.$4');
  if (v.length <= 16) return v.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})/, '$1-$2.$3.$4.$5');
  return v.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6').slice(0, 25);
};

const applyPhoneMask = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length <= 11) {
    if (v.length <= 2) return v.replace(/(\d{2})/, '($1');
    if (v.length <= 7) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    return v.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
  }
  return v.slice(0, 15);
};

const applyCpfCnpjMask = (v) => {
  let value = v.replace(/\D/g, '');
  if (value.length <= 11) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4").slice(0, 14);
  }
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5").slice(0, 18);
};

// ============================================================================
// --- COMPONENTES UI PREMIUM ---
// ============================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-indigo-600';
  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-[200]`}>
      {type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
      <span className="font-bold text-sm tracking-tight">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded-full transition"><X className="w-4 h-4" /></button>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-white/20">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Icon className="w-10 h-10 text-slate-300" /></div>
    <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">{title}</h3>
    <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 font-medium">{description}</p>
    {action}
  </div>
);

const TJSPLink = ({ processNumber, minimal = false }) => {
  if (!processNumber) return null;
  
  const formattedNumber = applyProcessMask(processNumber);
  const cleanNumber = processNumber.replace(/\D/g, '');
  
  // ALTERNATIVA INFALÍVEL: Jusbrasil (Consulta Universal)
  // O e-SAJ bloqueia links diretos por segurança (Captchas/Sessão). 
  // O Jusbrasil é aberto, nunca falha, e funciona para TODOS os tribunais do Brasil (TJSP, TJRJ, TRT, etc).
  const url = `https://www.jusbrasil.com.br/consulta-processual/busca?q=${cleanNumber}`;
  
  if (minimal) return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-mono">
      {formattedNumber} <ExternalLink className="w-3 h-3" />
    </a>
  );

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 mt-2">
      <Search className="w-3 h-3" /> <span>Consulta Universal</span>
    </a>
  );
};

// ============================================================================
// 1. LANDING PAGE
// ============================================================================
const LandingPage = ({ onNavigate, onAddLead, tenantConfig, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', type: 'Imobiliário' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    await onAddLead(formData);
    setIsSending(false);
    showToast("Pedido enviado com sucesso!", "success");
    setIsModalOpen(false);
  };

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen flex flex-col">
      <header className="px-6 py-5 flex justify-between items-center border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3 font-extrabold text-2xl cursor-pointer" style={{ color: tenantConfig.primaryColor }} onClick={() => onNavigate('login')}>
          <div className="p-2 rounded-xl text-white shadow-md" style={{ backgroundColor: tenantConfig.primaryColor }}><Gavel className="w-6 h-6" /></div>
          {tenantConfig.logoText}
        </div>
        <button onClick={() => onNavigate('portal')} className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition shadow-sm">Área do Cliente</button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 animate-fade-in">
            <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">Escritório Digital 4.0</span>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] text-slate-900 tracking-tighter">O seu processo,<br/><span style={{ color: tenantConfig.primaryColor }}>sem juridiquês.</span></h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">Acompanhe o seu caso judicial em tempo real através do seu telemóvel. Transparência total e consulta direta ao TJSP.</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center lg:justify-start">
              <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 text-white rounded-2xl font-black text-lg shadow-2xl hover:-translate-y-1 transition transform" style={{ backgroundColor: tenantConfig.primaryColor }}>Avaliar o Meu Caso</button>
              <button onClick={() => onNavigate('portal')} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-lg hover:bg-slate-50 transition">Já sou Cliente</button>
            </div>
        </div>
        <div className="flex-1 hidden lg:block animate-fade-in relative">
           <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full"></div>
           <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800" alt="Law" className="rounded-[3rem] shadow-2xl relative z-10 grayscale-[0.2]" />
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Análise Gratuita">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none" placeholder="Nome Completo" onChange={e => setFormData({...formData, name: e.target.value})} />
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none" placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})} />
          <button className="w-full py-4 text-white rounded-2xl font-black shadow-xl" style={{ backgroundColor: tenantConfig.primaryColor }}>Solicitar Contacto do Advogado</button>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// 2. LOGIN PAGE
// ============================================================================
const LoginPage = ({ onLogin, tenantConfig, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', officeName: '' });
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (isRegister && form.password.length < 6) {
      showToast('Para segurança, a palavra-passe do escritório deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('pascale_token', data.token);
        onLogin(data.lawyer);
        showToast('Acesso autorizado!', 'success');
      } else showToast(data.error || 'Erro na autenticação.', 'error');
    } catch (err) { showToast('Servidor offline. Tente em 30 segundos.', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-12 text-center text-white" style={{ backgroundColor: isRegister ? '#1e293b' : tenantConfig.primaryColor }}>
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            {isRegister ? <ShieldCheck className="w-10 h-10" /> : <Gavel className="w-10 h-10" />}
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{isRegister ? "Criar Escritório" : tenantConfig.logoText}</h1>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">Plataforma SaaS Profissional</p>
        </div>
        <form onSubmit={handleAuth} className="p-10 space-y-4">
          {isRegister && <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none" placeholder="Nome do Titular" onChange={e => setForm({...form, name: e.target.value})} />}
          <input required type="email" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none" placeholder="E-mail Profissional" onChange={e => setForm({...form, email: e.target.value})} />
          <input required type="password" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none" placeholder="Palavra-passe" onChange={e => setForm({...form, password: e.target.value})} />
          <button disabled={loading} className="w-full py-4 text-white rounded-2xl font-black shadow-xl" style={{ backgroundColor: isRegister ? '#1e293b' : tenantConfig.primaryColor }}>
             {loading ? "A processar..." : (isRegister ? "Configurar Ambiente" : "Entrar no Sistema")}
          </button>
          <button type="button" onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-xs font-black text-slate-400 uppercase tracking-tighter">
            {isRegister ? "Já possui conta? Fazer Login" : "Registar Novo Escritório"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 3. PORTAL DO CLIENTE
// ============================================================================
const ClientPortal = ({ onNavigate, caseData, tenantConfig, showToast }) => {
  if (!caseData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <Search className="w-12 h-12 mb-4 opacity-20" />
      <p className="font-bold">Nenhum processo localizado para o seu perfil.</p>
      <button onClick={() => onNavigate('landing')} className="mt-4 text-indigo-600 font-bold hover:underline">Voltar ao site</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="p-8 text-white rounded-b-[3rem] shadow-xl" style={{ backgroundColor: tenantConfig.primaryColor }}>
         <button onClick={() => onNavigate('landing')} className="mb-6 opacity-60 hover:opacity-100 flex items-center gap-2 font-bold text-xs uppercase tracking-widest"><ArrowRight className="w-4 h-4 rotate-180" /> Voltar</button>
         <h1 className="text-3xl font-black tracking-tight">Olá, {caseData.client?.name || caseData.client}</h1>
         <p className="opacity-70 mt-1 font-medium tracking-tight">O seu processo está estável e monitorizado.</p>
      </header>

      <div className="px-6 -mt-8 max-w-lg mx-auto space-y-6">
         <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-50/50 rounded-bl-full"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="relative z-10">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">Processo Ativo</span>
                <h2 className="text-xl font-black text-slate-800 mt-3 leading-tight">{caseData.title}</h2>
                <div className="mt-2"><TJSPLink processNumber={caseData.processNumber} /></div>
              </div>
              <Activity className="w-6 h-6 text-green-500 animate-pulse relative z-10" />
            </div>
            <div className="space-y-3 relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase"><span>Evolução Estimada</span><span className="text-indigo-600">60%</span></div>
               <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="w-[60%] h-full bg-indigo-500"></div></div>
            </div>
         </div>

         <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-sm uppercase tracking-widest"><Clock className="w-5 h-5 text-indigo-600" /> Histórico do Caso</h3>
            <div className="space-y-10 relative">
               <div className="absolute left-[13px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
               {caseData.timeline?.length > 0 ? caseData.timeline.map((step) => (
                 <div key={step.id} className="relative z-10 flex gap-5">
                    <div className={`w-7 h-7 rounded-full border-[3px] flex-shrink-0 flex items-center justify-center bg-white ${step.completed ? 'border-green-500 text-green-500' : 'border-indigo-600 ring-4 ring-indigo-50'}`}>
                      {step.completed ? <CheckCircle className="w-4 h-4 fill-current" /> : <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div>}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight">{step.title}</h4>
                      <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded block w-max mb-2">{step.date}</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">{step.description}</p>
                    </div>
                 </div>
               )) : <p className="text-xs text-slate-400 font-bold ml-10">Processo iniciado. Aguarde atualizações...</p>}
            </div>
         </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. PAINEL DO ADVOGADO (ENTERPRISE DASHBOARD)
// ============================================================================
const LawyerDashboard = ({ data, onMove, onAddCase, onAddFin, onAddDoc, onLogout, tenantConfig, showToast, isFetching }) => {
  const [tab, setTab] = useState('kanban');
  const [modals, setModals] = useState({ case: false, fin: false, doc: false });
  const [fCase, setFCase] = useState({ client: '', title: '', phone: '', processNumber: '', value: '' });
  const [fFin, setFFin] = useState({ client: '', amount: '', dueDate: '', title: 'Honorários', type: 'Boleto' });
  const [file, setFile] = useState(null);
  const [docClient, setDocClient] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const activeClients = useMemo(() => Array.from(new Set(data.cases.map(c => c.client?.name || c.client))).filter(Boolean), [data.cases]);

  const wrapAction = async (fn, modalKey, msg) => {
    setActionLoading(true);
    const success = await fn();
    if (success) {
      setModals(m => ({ ...m, [modalKey]: false }));
      showToast(msg, 'success');
    } else showToast('Erro ao processar pedido.', 'error');
    setActionLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-72 text-white flex flex-col p-8 space-y-8 shadow-2xl z-50 relative overflow-hidden" style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="absolute top-0 left-0 w-full h-64 bg-white/5 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Gavel className="w-6 h-6" /></div>
          <div>
            <div className="font-black text-lg tracking-tighter uppercase leading-none">{tenantConfig.logoText}</div>
            <div className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1.5">Enterprise</div>
          </div>
        </div>
        <nav className="flex-1 space-y-3 relative z-10 mt-12">
          {[
            {id: 'kanban', icon: Activity, label: 'Painel Kanban'},
            {id: 'leads', icon: Users, label: 'CRM de Leads'},
            {id: 'docs', icon: FolderOpen, label: 'Arquivo Digital'},
            {id: 'finance', icon: DollarSign, label: 'Financeiro'}
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${tab === t.id ? 'bg-white/20 shadow-xl translate-x-2' : 'opacity-60 hover:opacity-100 hover:bg-white/10'}`}>
              <t.icon className="w-5 h-5" /> <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-all font-bold text-xs pt-6 border-t border-white/10 relative z-10"><LogOut className="w-4 h-4" /> Encerrar Sessão</button>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-12 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-slate-800 capitalize tracking-tight">{tab}</h1>
            {isFetching && <Activity className="w-5 h-5 text-indigo-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setModals({...modals, [tab === 'finance' ? 'fin' : tab === 'docs' ? 'doc' : 'case']: true})} className="px-6 py-3.5 rounded-2xl text-white font-bold shadow-xl flex items-center gap-2 hover:-translate-y-1 transition-all text-sm" style={{ backgroundColor: tenantConfig.primaryColor }}>
              <Plus className="w-5 h-5" /> <span>Lançar {tab === 'finance' ? 'Fatura' : tab === 'docs' ? 'Ficheiro' : 'Processo'}</span>
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
               <div className="text-right hidden md:block">
                 <div className="text-sm font-black text-slate-800">{tenantConfig.advogado}</div>
                 <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online</div>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-700 border-2 border-indigo-100 shadow-inner">{tenantConfig.advogado?.substring(0,2).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-12 bg-slate-50/50 custom-scrollbar">
          {tab === 'kanban' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {['peticao', 'analise_juiz', 'sentenca'].map(s => (
                <div key={s} className="bg-slate-200/30 rounded-[3rem] p-8 min-h-[650px] space-y-6 border border-slate-200/50 flex flex-col">
                  <div className="flex justify-between font-black text-[11px] text-slate-400 uppercase tracking-[0.2em] px-2 items-center">
                    <span>{s.replace('_', ' ')}</span>
                    <span className="bg-white px-3 py-1 rounded-full text-slate-800 shadow-sm border border-slate-100">{data.cases.filter(c => c.stage === s).length}</span>
                  </div>
                  {data.cases.filter(c => c.stage === s).map(c => (
                    <div key={c.id} className="bg-white p-8 rounded-[2rem] shadow-sm border-l-[8px] transition-all hover:shadow-xl hover:-translate-y-1.5 group flex flex-col gap-3" style={{ borderLeftColor: c.anxietyScore > 70 ? '#ef4444' : tenantConfig.primaryColor }}>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">{c.status}</span>
                          {c.anxietyScore > 70 && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                        </div>
                        <h3 className="font-black text-slate-800 text-lg leading-tight">{c.client?.name || c.client}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{c.title}</p>
                        
                        <div className="mt-1"><TJSPLink processNumber={c.processNumber} /></div>

                        {c.timeline && c.timeline.length > 0 && (
                          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5 mb-3">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Últimas 3 Movimentações</span>
                            </div>
                            <div className="space-y-3">
                              {[...c.timeline].reverse().slice(0, 3).map((step, idx) => (
                                <div key={step.id || idx} className="flex gap-3 items-start">
                                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${step.completed ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`}></div>
                                  <div>
                                    <p className="text-[10px] font-extrabold text-slate-700 leading-tight">{step.title}</p>
                                    {step.description && <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 leading-snug font-medium">{step.description}</p>}
                                    <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{step.date}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                           <button onClick={() => window.open(`https://wa.me/55${(c.client?.phone || '11999999999').replace(/\D/g,'')}`, '_blank')} className="text-green-600 bg-green-50 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-100 transition">WA</button>
                           {s !== 'sentenca' && <button onClick={() => wrapAction(() => onMove(c.id, s), '', 'Processo avançado!')} className="bg-slate-50 text-indigo-700 px-4 py-2 rounded-xl font-black text-[10px] hover:bg-indigo-50 hover:text-indigo-800 transition shadow-sm border border-slate-200 uppercase tracking-widest">Avançar ➔</button>}
                        </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === 'leads' && (
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-8">Nome do Lead</th><th className="p-8">Contacto</th><th className="p-8">Área</th><th className="p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.leads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-8 font-extrabold text-slate-800">{l.name}</td>
                        <td className="p-8 text-slate-600 text-sm font-bold">{l.phone}</td>
                        <td className="p-8"><span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">{l.type}</span></td>
                        <td className="p-8 text-right"><button onClick={() => window.open(`https://wa.me/55${l.phone.replace(/\D/g,'')}`, '_blank')} className="bg-green-500 text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-all"><MessageSquare className="w-5 h-5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'docs' && (
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-8">Ficheiro Digital</th><th className="p-8">Titular</th><th className="p-8">Tamanho</th><th className="p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.docs.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-8 font-extrabold text-slate-800 flex items-center gap-4"><div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400"><File className="w-5 h-5" /></div> {d.name}</td>
                        <td className="p-8 text-slate-500 text-sm font-bold">{d.client}</td>
                        <td className="p-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">{d.size}</td>
                        <td className="p-8 text-right">
                          <button onClick={() => d.url ? window.open(d.url, '_blank') : showToast('A processar na nuvem...', 'error')} className="font-black text-[11px] flex items-center gap-2 ml-auto hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-all uppercase tracking-tight" style={{ color: tenantConfig.primaryColor }}>
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'finance' && (
            <div className="space-y-10 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-green-50 rounded-bl-full transition-transform duration-700 group-hover:scale-125"></div>
                    <div className="relative z-10">
                      <div className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">Faturado Realizado</div>
                      <div className="text-5xl font-black text-slate-800 tracking-tighter">{formatCurrency(data.fins.filter(f => f.status === 'Pago').reduce((a,c)=>a+c.amount,0))}</div>
                    </div>
                    <TrendingUp className="w-16 h-16 text-green-500 relative z-10 opacity-80" />
                  </div>
                  <div className="p-12 rounded-[3rem] shadow-2xl flex justify-between items-center text-white relative overflow-hidden group" style={{ backgroundColor: tenantConfig.primaryColor }}>
                    <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-bl-full transition-transform duration-700 group-hover:scale-125"></div>
                    <div className="relative z-10">
                      <div className="text-[11px] font-black text-white/60 uppercase mb-3 tracking-[0.2em]">Previsão em Aberto</div>
                      <div className="text-5xl font-black tracking-tighter">{formatCurrency(data.fins.filter(f => f.status !== 'Pago').reduce((a,c)=>a+c.amount,0))}</div>
                    </div>
                    <div className="p-5 bg-white/10 rounded-[2rem] backdrop-blur-sm relative z-10 border border-white/20"><DollarSign className="w-10 h-10" /></div>
                  </div>
               </div>
               <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                          <tr><th className="p-8">Descrição</th><th className="p-8">Valor</th><th className="p-8">Vencimento</th><th className="p-8">Status</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {data.fins.map(f => (
                             <tr key={f.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-8"><div className="font-extrabold text-slate-800 text-sm mb-1">{f.title}</div><div className="text-[11px] font-bold text-slate-400 uppercase">{f.client?.name || f.client}</div></td>
                                <td className="p-8 font-black text-slate-800 text-lg">{formatCurrency(f.amount)}</td>
                                <td className="p-8 text-slate-500 text-sm font-bold">{formatDate(f.dueDate)}</td>
                                <td className="p-8"><span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${f.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{f.status}</span></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS DA DASHBOARD */}
      <Modal isOpen={modals.case} onClose={()=>setModals({...modals, case:false})} title="Registar Processo Cloud">
        <form onSubmit={(e) => { e.preventDefault(); wrapAction(async () => onAddCase(fCase), 'case', 'Processo gravado com sucesso!'); }} className="space-y-5">
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none" placeholder="Nome Completo do Cliente" value={fCase.client} onChange={e=>setFCase({...fCase, client: e.target.value})} />
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none" placeholder="Número do Processo (TJSP)" value={fCase.processNumber} onChange={e=>setFCase({...fCase, processNumber: applyProcessMask(e.target.value)})} />
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none" placeholder="Objeto da Ação" value={fCase.title} onChange={e=>setFCase({...fCase, title: e.target.value})} />
          <div className="flex gap-4">
             <input className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none" placeholder="WhatsApp" value={fCase.phone} onChange={e=>setFCase({...fCase, phone: applyPhoneMask(e.target.value)})} />
             <input type="number" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none" placeholder="Valor (€)" onChange={e=>setFCase({...fCase, value: e.target.value})} />
          </div>
          <button disabled={actionLoading} className="w-full py-4 text-white rounded-2xl font-black shadow-xl uppercase tracking-wide text-sm flex justify-center items-center" style={{backgroundColor: tenantConfig.primaryColor}}>
            {actionLoading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Iniciar Acompanhamento Digital"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.fin} onClose={()=>setModals({...modals, fin:false})} title="Lançar Honorários">
        <form onSubmit={(e) => { e.preventDefault(); wrapAction(async () => onAddFin(fFin), 'fin', 'Fatura lançada com sucesso!'); }} className="space-y-5">
          <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium outline-none" value={fFin.client} onChange={e=>setFFin({...fFin, client: e.target.value})}>
            <option value="">A quem se destina?</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium outline-none" placeholder="Descrição da Cobrança" value={fFin.title} onChange={e=>setFFin({...fFin, title: e.target.value})} />
          <div className="flex gap-4">
            <input required type="number" step="0.01" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium" placeholder="Valor (€)" value={fFin.amount} onChange={e=>setFFin({...fFin, amount: e.target.value})} />
            <input required type="date" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium" value={fFin.dueDate} onChange={e=>setFFin({...fFin, dueDate: e.target.value})} />
          </div>
          <button className="w-full py-4 text-white rounded-2xl font-black shadow-xl bg-green-600 uppercase tracking-wide text-sm">Emitir Cobrança</button>
        </form>
      </Modal>

      <Modal isOpen={modals.doc} onClose={()=>setModals({...modals, doc:false})} title="Arquivo Criptografado (Supabase)">
        <form onSubmit={(e) => { e.preventDefault(); if(!file || !docClient) return; const fd = new FormData(); fd.append('file', file); fd.append('client', docClient); fd.append('name', file.name); wrapAction(async () => onAddDoc(fd), 'doc', 'Documento guardado na nuvem!'); }} className="space-y-6">
          <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium" value={docClient} onChange={e=>setDocClient(e.target.value)}>
            <option value="">Pertence a que cliente?</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="border-4 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-white transition-all group relative cursor-pointer">
             <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" /></div>
             <p className="text-sm font-extrabold text-slate-600 text-center">{file ? file.name : "Clique para anexar um PDF"}</p>
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setFile(e.target.files[0])} />
          </div>
          <button disabled={actionLoading || !file} className="w-full py-4 text-white rounded-2xl font-black shadow-xl uppercase tracking-wide text-sm flex justify-center items-center" style={{backgroundColor: tenantConfig.primaryColor, opacity: (!file || actionLoading) ? 0.5 : 1}}>
            Transferir para Nuvem
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// --- APP CONTROLLER PRINCIPAL ---
// ============================================================================
export default function App() {
  const [view, setView] = useState('landing');
  const [tenant, setTenant] = useStickyState({ primaryColor: "#1e293b", logoText: "PASCALE JURIS", advogado: "Administrador" }, 'pascale_tenant_config');
  const [data, setData] = useState({ cases: [], leads: [], docs: [], fins: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => setToast({ visible: true, message, type }), []);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('pascale_token');
    if (!token) return view === 'dashboard' ? setView('login') : null;
    
    setLoading(true);
    try {
      const h = { 'Authorization': `Bearer ${token}` };
      const fetchApi = async (p) => {
        const r = await fetch(`${API_URL}/${p}`, { headers: h });
        const json = await r.json();
        return json.success ? json.data : [];
      };
      const [c, l, d, f] = await Promise.all([fetchApi('cases'), fetchApi('leads'), fetchApi('documents'), fetchApi('financials')]);
      setData({ cases: c, leads: l, docs: d, fins: f });
    } catch(e) { localStorage.removeItem('pascale_token'); setView('login'); }
    finally { setLoading(false); }
  }, [view]);

  useEffect(() => { if (localStorage.getItem('pascale_token') && view === 'dashboard') fetchAll(); }, [fetchAll, view]);

  const apiCall = async (p, m, b, isFd = false) => {
    const token = localStorage.getItem('pascale_token');
    const h = { 'Authorization': `Bearer ${token}` };
    if (!isFd) h['Content-Type'] = 'application/json';
    try {
      const r = await fetch(`${API_URL}/${p}`, { method:m, headers:h, body: isFd ? b : JSON.stringify(b) });
      const json = await r.json();
      if (json.success) { fetchAll(); return true; } return false;
    } catch (e) { return false; }
  };

  const renderView = () => {
    // --- REDE DE SEGURANÇA: Previne o erro do menu invisível (cache antigo) ---
    const safeTenant = {
      ...tenant,
      primaryColor: (tenant?.primaryColor && tenant.primaryColor.startsWith('#')) ? tenant.primaryColor : '#1e293b',
      advogado: tenant?.advogado || tenant?.name || 'Administrador'
    };

    switch(view) {
      case 'landing': return <LandingPage onNavigate={setView} tenantConfig={safeTenant} onAddLead={(d)=>apiCall('leads','POST',d)} showToast={showToast} />;
      case 'login': return <LoginPage onLogin={(l)=>{setTenant(l); setView('dashboard');}} tenantConfig={safeTenant} showToast={showToast} />;
      case 'portal': return <ClientPortal onNavigate={setView} caseData={data.cases[0] || null} tenantConfig={safeTenant} showToast={showToast} />;
      case 'dashboard': return <LawyerDashboard data={data} isFetching={loading} showToast={showToast} tenantConfig={safeTenant} onMove={(id, s)=>apiCall(`cases/${id}/move`,'PATCH',{stage: s === 'peticao' ? 'analise_juiz' : 'sentenca'})} onAddCase={(d)=>apiCall('cases','POST',d)} onAddFin={(d)=>apiCall('financials','POST',d)} onAddDoc={(fd)=>apiCall('documents','POST',fd,true)} onLogout={()=>{localStorage.removeItem('pascale_token'); setView('landing');}} />;
      default: return <LandingPage onNavigate={setView} tenantConfig={safeTenant} onAddLead={()=>{}} showToast={showToast} />;
    }
  };

  return (
    <div className="antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50 relative">
      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
      
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={() => setToast(t => ({...t, visible: false}))} />}

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[300] bg-slate-900/90 backdrop-blur-xl text-white px-3 py-2 rounded-full shadow-2xl flex gap-1 border border-white/10 items-center">
        <button onClick={() => setView('landing')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${view === 'landing' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Site</button>
        <button onClick={() => setView('portal')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${view === 'portal' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Portal</button>
        <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>SaaS</button>
      </div>

      {renderView()}
    </div>
  );
}