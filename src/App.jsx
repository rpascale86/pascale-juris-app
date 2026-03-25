import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Gavel, Users, FileText, MessageSquare, Bell, Menu, CheckCircle, 
  Clock, AlertTriangle, ArrowRight, ShieldCheck, LogOut, Activity, Plus, 
  Send, X, UploadCloud, File, Download, DollarSign, TrendingUp, FolderOpen,
  Briefcase
} from 'lucide-react';

// ============================================================================
// --- CONFIGURAÇÃO CENTRALIZADA DA NUVEM ---
// ============================================================================
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

// --- HOOKS DE PERSISTÊNCIA (Local/Cache) ---
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

const applyPhoneMask = (value) => {
  let v = value.replace(/\D/g, ''); 
  if (v.length <= 2) return v.replace(/(\d{2})/, '($1');
  if (v.length <= 7) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  return v.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3').slice(0, 15);
};

const applyCpfCnpjMask = (value) => {
  let v = value.replace(/\D/g, '');
  if (v.length <= 11) {
    if (v.length <= 3) return v;
    if (v.length <= 6) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4').slice(0, 14);
  } else {
    if (v.length <= 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5').slice(0, 18);
  }
};

// ============================================================================
// --- COMPONENTES UI PREMIUM (ENTERPRISE) ---
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

const Skeleton = ({ className }) => <div className={`bg-slate-200 animate-pulse rounded-2xl ${className}`}></div>;

// ============================================================================
// 1. LANDING PAGE (O SEU SITE DE CAPTURA)
// ============================================================================
const LandingPage = ({ onNavigate, onAddLead, tenantConfig, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', type: 'Usucapião' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawPhone = formData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      showToast("Por favor, digite um telemóvel válido.", "error");
      return;
    }
    setIsSending(true);
    await onAddLead(formData);
    setIsSending(false);
    setFormData({ name: '', phone: '', email: '', type: 'Usucapião' });
    setIsModalOpen(false);
  };

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen flex flex-col">
      <header className="px-6 py-5 flex justify-between items-center border-b border-slate-100 shadow-sm sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3 font-extrabold text-2xl cursor-pointer" style={{ color: tenantConfig.primaryColor }} onClick={() => onNavigate('login')}>
          <div className="p-2 rounded-xl text-white shadow-md" style={{ backgroundColor: tenantConfig.primaryColor }}><Gavel className="w-6 h-6" /></div>
          {tenantConfig.logoText}
        </div>
        <button onClick={() => onNavigate('portal')} className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition shadow-sm">
          Área do Cliente
        </button>
      </header>

      <main className="flex-1">
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Análise Gratuita do Caso">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 transition-all font-medium" placeholder="O seu Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required type="tel" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 transition-all font-medium" placeholder="WhatsApp / Telemóvel" value={formData.phone} onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})} />
            <input type="email" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 transition-all font-medium" placeholder="E-mail (Opcional)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <select className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-white transition-all font-medium" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="Usucapião">Imobiliário / Usucapião</option>
              <option value="Trabalhista">Direito Laboral</option>
              <option value="Família">Família e Sucessões</option>
              <option value="Empresarial">Direito Empresarial</option>
              <option value="Cível">Cível / Danos Morais</option>
            </select>
            <button type="submit" disabled={isSending} className="w-full py-4 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all mt-4 flex justify-center items-center" style={{ backgroundColor: tenantConfig.primaryColor }}>
              {isSending ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Solicitar Contacto do Advogado"}
            </button>
          </form>
        </Modal>

        <section className="px-6 py-20 md:py-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 animate-fade-in">
            <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">Escritório Digital 4.0</span>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] text-slate-900 tracking-tighter">O seu processo,<br/><span style={{ color: tenantConfig.primaryColor }}>sem juridiquês.</span></h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium max-w-2xl">Acompanhe o seu caso judicial em tempo real através do seu telemóvel. Transparência total, sem precisar de ligar para o escritório para saber novidades.</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 text-white rounded-2xl font-black text-lg shadow-2xl hover:shadow-indigo-500/30 transition transform hover:-translate-y-1" style={{ backgroundColor: tenantConfig.primaryColor }}>Avaliar o Meu Caso</button>
              <button onClick={() => onNavigate('portal')} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-lg hover:border-slate-300 hover:bg-slate-50 transition shadow-sm">Já sou Cliente</button>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative animate-fade-in w-full max-w-md" style={{animationDelay: '0.2s'}}>
              <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full"></div>
              <div className="relative w-full aspect-[9/18] max-h-[700px] bg-slate-900 rounded-[3rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/20">
                <div className="absolute inset-0 bg-slate-50 flex flex-col">
                   <div className="bg-indigo-900 p-8 text-white rounded-b-[2rem] shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center font-black text-xl backdrop-blur-sm">CS</div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Painel do Cliente</div>
                          <div className="font-black text-lg">Carlos Silva</div>
                        </div>
                      </div>
                   </div>
                   <div className="p-6 space-y-4 flex-1 overflow-auto">
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                         <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">Ação Cível</span>
                           <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                         </div>
                         <div className="font-bold text-slate-800 text-sm">Ação de Indemnização</div>
                         <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden"><div className="w-[60%] h-full bg-indigo-500"></div></div>
                      </div>
                      <div className="bg-indigo-600 p-5 rounded-2xl shadow-xl text-white relative overflow-hidden">
                         <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                         <div className="font-black text-base mb-1 relative z-10">Dúvidas sobre o caso?</div>
                         <div className="text-[11px] opacity-80 mb-4 leading-relaxed font-medium relative z-10">O seu advogado está disponível para falar consigo agora.</div>
                         <div className="w-full py-3 bg-white text-indigo-900 rounded-xl text-center text-xs font-black shadow-sm relative z-10">Abrir Chat Seguro</div>
                      </div>
                   </div>
                </div>
              </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// ============================================================================
// 2. ECRÃ DE LOGIN E REGISTO (GATEWAY SaaS)
// ============================================================================
const LoginPage = ({ onLogin, tenantConfig, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', officeName: '' });
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('pascale_token', data.token);
        onLogin(data.lawyer);
        showToast('Autenticação bem-sucedida!', 'success');
      } else {
        showToast(data.error || 'Credenciais inválidas.', 'error');
      }
    } catch (err) { showToast('O servidor está a iniciar ou offline. Tente em 30 segundos.', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up relative z-10">
        <div className="p-12 text-center text-white relative overflow-hidden" style={{ backgroundColor: isRegister ? '#1e293b' : tenantConfig.primaryColor }}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner rotate-3 border border-white/20">
              {isRegister ? <ShieldCheck className="w-10 h-10" /> : <Gavel className="w-10 h-10" />}
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">{isRegister ? "Criar Escritório" : tenantConfig.logoText}</h1>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Plataforma SaaS Profissional</p>
          </div>
        </div>
        <form onSubmit={handleAuth} className="p-10 space-y-5">
          {isRegister && (
            <div className="space-y-5 animate-fade-in">
              <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium" placeholder="Nome do Titular" onChange={e => setForm({...form, name: e.target.value})} />
              <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium" placeholder="Nome da Sociedade" onChange={e => setForm({...form, officeName: e.target.value})} />
            </div>
          )}
          <input required type="email" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium" placeholder="E-mail Profissional" onChange={e => setForm({...form, email: e.target.value})} />
          <input required type="password" minLength={6} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium" placeholder="Palavra-passe Segura" onChange={e => setForm({...form, password: e.target.value})} />
          
          <button disabled={loading} className="w-full py-4 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all flex justify-center items-center gap-2 uppercase tracking-wide text-sm mt-4" style={{ backgroundColor: isRegister ? '#1e293b' : tenantConfig.primaryColor }}>
            {loading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegister ? "Configurar Ambiente" : "Entrar no Sistema")}
          </button>
          
          <div className="pt-6 border-t border-slate-100 text-center mt-6">
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-xs font-black text-slate-400 hover:text-indigo-600 uppercase tracking-tighter transition-colors">
              {isRegister ? "Já possui conta? Fazer Login" : "Criar uma conta para o seu escritório"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 3. PORTAL DO CLIENTE (VISÃO MOBILE/CLIENTE)
// ============================================================================
const ClientPortal = ({ onNavigate, caseData, onNotifyLawyer, messages, onSendMessage, onUploadDocument, financials, tenantConfig, showToast }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  const { myFinancials, totalPendente } = useMemo(() => {
    if (!caseData) return { myFinancials: [], totalPendente: 0 };
    const filtered = financials.filter(f => f.client === caseData.client || f.client === "Carlos Silva");
    const total = filtered.filter(f => f.status !== 'Pago').reduce((acc, curr) => acc + curr.amount, 0);
    return { myFinancials: filtered, totalPendente: total };
  }, [financials, caseData]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  if (!caseData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <EmptyState icon={Search} title="Nenhum processo localizado" description="Ainda não existem processos vinculados a esta conta na nuvem." action={<button onClick={() => onNavigate('landing')} className="text-indigo-600 font-bold hover:underline">Voltar ao site</button>} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
      {/* Modais do Cliente */}
      <Modal isOpen={financialOpen} onClose={() => setFinancialOpen(false)} title="Meu Financeiro">
        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-2xl flex flex-col mb-4 border border-indigo-100">
             <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Total Pendente</span>
             <span className="text-4xl font-black text-indigo-700 tracking-tighter">{formatCurrency(totalPendente)}</span>
          </div>
          <div className="space-y-4">
             {myFinancials.length === 0 ? <p className="text-center text-slate-400 text-sm font-medium">Nenhuma cobrança registada.</p> : myFinancials.map(fin => (
               <div key={fin.id} className="border border-slate-200 rounded-2xl p-5 flex justify-between items-center bg-white shadow-sm hover:border-indigo-200 transition">
                 <div>
                   <div className="font-bold text-slate-800 text-base">{fin.title}</div>
                   <div className="text-[11px] text-slate-400 font-bold mt-1">Vence a: {formatDate(fin.dueDate)}</div>
                 </div>
                 <div className="text-right">
                   <div className="font-black text-slate-800 text-lg">{formatCurrency(fin.amount)}</div>
                   <span className={`inline-block mt-1 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${fin.status === 'Pago' ? 'bg-green-100 text-green-700' : fin.status === 'Atrasado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                     {fin.status}
                   </span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Enviar Ficheiro">
        <div className="space-y-6">
          <div className="border-4 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer">
            <UploadCloud className="w-12 h-12 mb-4 text-indigo-300" />
            <p className="text-sm font-bold text-slate-600">Arraste o PDF para aqui</p>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-2">Max 10MB</p>
          </div>
          <button onClick={() => { setUploadOpen(false); showToast("Upload indisponível no modo cliente nesta demo.", "info"); }} className="w-full py-4 text-white rounded-2xl font-black shadow-xl transition" style={{ backgroundColor: tenantConfig.primaryColor }}>Enviar para o Advogado</button>
        </div>
      </Modal>

      {/* Chat */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up md:max-w-md md:right-4 md:left-auto md:bottom-4 md:top-auto md:h-[600px] md:shadow-2xl md:rounded-[2rem] border border-slate-200 overflow-hidden">
          <div className="text-white p-5 flex justify-between items-center" style={{ backgroundColor: tenantConfig.primaryColor }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black shadow-inner">
                {tenantConfig.advogado?.substring(0, 2).toUpperCase()}
              </div>
              <div><div className="font-bold text-sm leading-none mb-1">{tenantConfig.advogado}</div><div className="text-[10px] opacity-70 flex items-center gap-1 font-bold"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Online agora</div></div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 bg-slate-50 p-5 space-y-4 overflow-y-auto custom-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-sm font-medium ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'}`}>{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 bg-slate-100 rounded-full px-5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Escreva a sua dúvida..." />
            <button onClick={() => { if(inputValue.trim()){ onSendMessage(inputValue, 'user'); setInputValue(''); setTimeout(() => onSendMessage("Mensagem recebida. Entraremos em contacto em breve.", 'bot'), 1000); } }} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0 transition hover:bg-indigo-700 hover:scale-105"><Send className="w-5 h-5 ml-1" /></button>
          </div>
        </div>
      )}

      {/* Header Cliente */}
      <div className="text-white p-8 pb-16 rounded-b-[3rem] shadow-xl relative overflow-hidden" style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[100%] bg-white/5 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="flex justify-between items-center mb-8 relative z-10">
           <button onClick={() => onNavigate('landing')} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-md"><ArrowRight className="w-5 h-5 rotate-180" /></button>
           <span className="font-black text-[10px] uppercase tracking-[0.2em] opacity-80">Área Exclusiva</span>
           <div className="relative p-2.5 bg-white/10 rounded-full backdrop-blur-md"><Bell className="w-5 h-5 opacity-90" /><div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></div></div>
        </div>
        <div className="flex flex-col items-center relative z-10">
           <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl font-black mb-5 shadow-2xl border-4 border-white/10">
             {caseData.client ? caseData.client.substring(0,2).toUpperCase() : 'CS'}
           </div>
           <h1 className="text-3xl font-black tracking-tight text-center">Olá, {caseData.client.split(' ')[0]}</h1>
           <p className="text-white/60 text-sm mt-2 font-medium">O seu processo está protegido e monitorizado.</p>
        </div>
      </div>

      <div className="px-6 -mt-10 space-y-6 max-w-lg mx-auto relative z-20">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
           <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-50/50 rounded-bl-full"></div>
           <div className="flex justify-between items-start mb-6">
             <div className="relative z-10">
               <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">Processo Ativo</span>
               <h2 className="text-xl font-black text-slate-800 mt-3 leading-tight tracking-tight">{caseData.title}</h2>
               <p className="text-[11px] text-slate-400 mt-2 font-mono font-bold">{caseData.processNumber || 'Nº do Processo Pendente'}</p>
             </div>
             <Activity className="w-6 h-6 text-green-500 animate-pulse relative z-10" />
           </div>
           <div className="space-y-3 relative z-10 bg-slate-50 p-4 rounded-xl">
             <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider"><span>Progresso</span><span className="text-indigo-600">60%</span></div>
             <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner"><div className="w-[60%] h-full bg-indigo-500 rounded-full"></div></div>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-sm uppercase tracking-widest"><Clock className="w-5 h-5 text-indigo-600" /> Linha do Tempo</h3>
          <div className="space-y-10 relative">
            <div className="absolute left-[13px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
            {caseData.timeline && caseData.timeline.length > 0 ? caseData.timeline.map((step) => (
              <div key={step.id} className="relative z-10 flex gap-5">
                <div className={`w-7 h-7 rounded-full border-[3px] flex-shrink-0 flex items-center justify-center bg-white transition-all shadow-sm ${step.completed ? 'border-green-500 text-green-500 bg-green-50' : step.current || step.isCurrent ? 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
                  {step.completed ? <CheckCircle className="w-4 h-4 fill-current" /> : step.current || step.isCurrent ? <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div> : null}
                </div>
                <div className={`${step.current || step.isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                  <h4 className="font-black text-slate-800 text-sm tracking-tight mb-1">{step.title}</h4>
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded block w-max mb-2">{step.date}</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">{step.description || step.desc}</p>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold ml-10">Histórico em processamento...</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setChatOpen(true)} className="p-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-200 flex flex-col items-center gap-3 text-[11px] uppercase tracking-wide transition hover:scale-105"><MessageSquare className="w-6 h-6" /> Falar com Advogado</button>
          <button onClick={() => setFinancialOpen(true)} className="p-5 bg-white border border-slate-200 text-slate-700 rounded-3xl font-black flex flex-col items-center gap-3 text-[11px] uppercase tracking-wide hover:border-indigo-500 hover:shadow-lg transition"><DollarSign className="w-6 h-6 text-green-600" /> Ver Pagamentos</button>
        </div>
        <button onClick={() => setUploadOpen(true)} className="w-full p-5 bg-white border border-slate-200 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-3 shadow-sm hover:shadow-lg hover:border-indigo-400 transition mb-10"><UploadCloud className="w-5 h-5 text-indigo-500" /> Enviar Documentação</button>
      </div>
    </div>
  );
};

// ============================================================================
// 4. PAINEL DO ADVOGADO (ENTERPRISE DASHBOARD)
// ============================================================================
const LawyerDashboard = ({ data, onMove, onAddCase, onAddFin, onAddDoc, onLogout, tenantConfig, showToast, isFetching, onUpdateLead }) => {
  const [tab, setTab] = useState('kanban');
  const [modals, setModals] = useState({ case: false, fin: false, doc: false });
  const [formCase, setFormCase] = useState({ client: '', title: '', phone: '', cpfCnpj: '', value: '', processNumber: '' });
  const [formFin, setFormFin] = useState({ client: '', amount: '', dueDate: '', title: 'Honorários', type: 'Boleto' });
  const [file, setFile] = useState(null);
  const [docClient, setDocClient] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const activeClients = useMemo(() => Array.from(new Set(data.cases.map(c => c.client?.name || c.client))).filter(Boolean), [data.cases]);

  const wrapAction = async (actionFn, modalKey, successMsg) => {
    setActionLoading(true);
    const success = await actionFn();
    if (success) {
      setModals(m => ({ ...m, [modalKey]: false }));
      showToast(successMsg, 'success');
    } else {
      showToast('Ocorreu um erro ao processar o pedido. Tente novamente.', 'error');
    }
    setActionLoading(false);
  };

  const attendLead = (lead) => {
    if (lead.status === 'Novo') onUpdateLead(lead.id, 'Em Atendimento');
    const msg = encodeURIComponent(`Olá ${lead.name}, sou do escritório ${tenantConfig.name}. Vi o seu contacto através do nosso portal sobre ${lead.type}. Como posso ajudar?`);
    window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* OVERLAY MENU MOBILE */}
      {mobileMenu && <div className="fixed inset-0 bg-slate-900/60 z-[60] md:hidden backdrop-blur-sm" onClick={() => setMobileMenu(false)} />}

      {/* SIDEBAR ENTERPRISE */}
      <aside className={`fixed md:relative z-[70] h-full w-72 text-white flex flex-col p-8 space-y-8 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileMenu ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="absolute top-0 left-0 w-full h-64 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10"><Gavel className="w-6 h-6" /></div>
            <div>
              <div className="font-black text-lg tracking-tighter uppercase leading-none">{tenantConfig.logoText}</div>
              <div className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1.5">Enterprise</div>
            </div>
          </div>
          <button className="md:hidden text-white/50" onClick={() => setMobileMenu(false)}><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 space-y-3 relative z-10 mt-12 overflow-y-auto custom-scrollbar">
          {[
            {id: 'kanban', icon: Activity, label: 'Painel de Processos'},
            {id: 'leads', icon: Users, label: 'CRM Comercial', badge: data.leads.filter(l => l.status === 'Novo').length},
            {id: 'docs', icon: FolderOpen, label: 'Arquivo Seguro'},
            {id: 'finance', icon: DollarSign, label: 'Controlo Financeiro'}
          ].map(t => (
            <button key={t.id} onClick={() => {setTab(t.id); setMobileMenu(false);}} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all ${tab === t.id ? 'bg-white/20 shadow-xl translate-x-2 ring-1 ring-white/10' : 'opacity-60 hover:opacity-100 hover:bg-white/10'}`}>
              <div className="flex items-center gap-4"><t.icon className="w-5 h-5" /> <span>{t.label}</span></div>
              {t.badge > 0 && <span className="bg-red-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-lg">{t.badge}</span>}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-all font-bold text-xs pt-6 border-t border-white/10 relative z-10 hover:text-red-400"><LogOut className="w-4 h-4" /> Encerrar Sessão Segura</button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        <header className="h-20 md:h-24 bg-white/90 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 md:px-12 z-40 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg" onClick={() => setMobileMenu(true)}><Menu className="w-6 h-6" /></button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 capitalize tracking-tight hidden sm:block">{tab.replace('_', ' ')}</h1>
            {isFetching && <Activity className="w-5 h-5 text-indigo-400 animate-spin hidden sm:block" />}
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => setModals({...modals, [tab === 'finance' ? 'fin' : tab === 'docs' ? 'doc' : 'case']: true})} className="px-5 py-2.5 md:px-6 md:py-3.5 rounded-2xl text-white font-bold shadow-xl shadow-indigo-900/10 flex items-center gap-2 hover:-translate-y-1 transition-all active:scale-95 text-xs md:text-sm" style={{ backgroundColor: tenantConfig.primaryColor }}>
              <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>Lançar <span className="hidden md:inline">{tab === 'finance' ? 'Fatura' : tab === 'docs' ? 'Ficheiro' : 'Processo'}</span></span>
            </button>
            <div className="flex items-center gap-4 pl-4 md:pl-6 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-sm font-black text-slate-800">{tenantConfig.advogado || tenantConfig.name}</div>
                <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online</div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-700 border-2 border-indigo-100 shadow-inner">
                {tenantConfig.advogado?.substring(0,2).toUpperCase() || 'AD'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-12 bg-slate-50/50 custom-scrollbar pb-24 md:pb-12">
          {tab === 'kanban' && (
            data.cases.length === 0 && !isFetching ? (
              <EmptyState icon={Briefcase} title="Nenhum processo em curso" description="Comece por registar o seu primeiro caso para gerir as etapas e prazos de forma visual." action={<button onClick={() => setModals({...modals, case: true})} className="px-6 py-3 text-white rounded-xl font-bold mt-4 shadow-lg" style={{ backgroundColor: tenantConfig.primaryColor }}>Registar 1º Processo</button>} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {['peticao', 'analise_juiz', 'sentenca'].map(s => (
                  <div key={s} className="bg-slate-200/30 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 min-h-[500px] md:min-h-[650px] space-y-6 border border-slate-200/50 flex flex-col">
                    <div className="flex justify-between font-black text-[10px] md:text-[11px] text-slate-400 uppercase tracking-[0.2em] px-2 items-center">
                      <span>{s.replace('_', ' ')}</span>
                      <span className="bg-white px-3 py-1 rounded-full text-slate-800 shadow-sm border border-slate-100">{data.cases.filter(c => c.stage === s).length}</span>
                    </div>
                    
                    {isFetching && data.cases.length === 0 && [1,2].map(i => <Skeleton key={i} className="h-48 w-full" />)}
                    
                    {data.cases.filter(c => c.stage === s).map(c => (
                      <div key={c.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border-l-[8px] transition-all hover:shadow-xl hover:-translate-y-1.5 group flex flex-col gap-3" style={{ borderLeftColor: c.anxietyScore > 70 ? '#ef4444' : tenantConfig.primaryColor }}>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{c.status}</span>
                          {c.anxietyScore > 70 && <div className="bg-red-50 p-2 rounded-full cursor-help hover:bg-red-100 transition" onClick={() => showToast("Cliente Ansioso: Sugere-se contacto proativo via WhatsApp.", "warning")}><AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /></div>}
                        </div>
                        <div className="mt-1">
                          <h3 className="font-black text-slate-800 text-lg leading-tight">{c.client?.name || c.client}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1.5 line-clamp-2 leading-relaxed">{c.title}</p>
                        </div>
                        {c.processNumber && <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-md self-start border border-slate-100/50">{c.processNumber}</div>}
                        
                        <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center gap-2">
                          <button onClick={() => window.open(`https://wa.me/55${(c.client?.phone || c.phone || '11999999999').replace(/\D/g,'')}?text=Olá, trago novidades sobre o seu processo.`, '_blank')} className="text-green-600 bg-green-50 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-green-100 transition flex items-center gap-1.5 border border-green-100"><MessageSquare className="w-3 h-3" /> WA</button>
                          {s !== 'sentenca' && (
                            <button onClick={() => wrapAction(() => onMove(c.id, s), '', 'Processo avançado com sucesso!')} className="flex-1 bg-slate-50 text-indigo-700 px-4 py-2.5 rounded-xl font-black text-[10px] hover:bg-indigo-50 hover:text-indigo-800 transition shadow-sm text-center uppercase tracking-widest border border-slate-200 hover:border-indigo-200">Avançar ➔</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'leads' && (
            data.leads.length === 0 && !isFetching ? (
              <EmptyState icon={Users} title="Caixa de entrada vazia" description="Os potenciais clientes que entrarem em contacto através do seu site público aparecerão aqui." />
            ) : (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] border-b border-slate-100">
                  <tr><th className="p-6 md:p-8">Nome do Lead</th><th className="p-6 md:p-8">Contacto</th><th className="p-6 md:p-8">Interesse</th><th className="p-6 md:p-8 text-right">Acção</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.leads.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-6 md:p-8">
                        <div className="font-extrabold text-slate-800 text-sm">{l.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{new Date(l.createdAt).toLocaleDateString('pt-BR')}</div>
                      </td>
                      <td className="p-6 md:p-8 text-slate-600 text-sm font-bold">{l.phone}</td>
                      <td className="p-6 md:p-8"><span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{l.type}</span></td>
                      <td className="p-6 md:p-8 text-right">
                        <button onClick={() => attendLead(l)} className={`text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition hover:-translate-y-0.5 flex items-center gap-2 ml-auto ${l.status === 'Novo' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-green-500 shadow-green-200'}`}>
                          <MessageSquare className="w-4 h-4" /> {l.status === 'Novo' ? 'Atender' : 'WhatsApp'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )
          )}

          {tab === 'docs' && (
            data.docs.length === 0 && !isFetching ? (
               <EmptyState icon={FolderOpen} title="Nenhum documento arquivado" description="Faça o upload de petições, sentenças e procurações para manter o seu arquivo seguro na nuvem." action={<button onClick={() => setModals({...modals, doc: true})} className="px-6 py-3 text-white rounded-xl font-bold mt-4" style={{ backgroundColor: tenantConfig.primaryColor }}>Adicionar Ficheiro</button>} />
            ) : (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] border-b border-slate-100">
                    <tr><th className="p-6 md:p-8">Ficheiro Digital</th><th className="p-6 md:p-8">Titular</th><th className="p-6 md:p-8">Tamanho</th><th className="p-6 md:p-8 text-right">Acção</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.docs.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-6 md:p-8 font-extrabold text-slate-800 flex items-center gap-4"><div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400"><File className="w-5 h-5" /></div> {d.name}</td>
                        <td className="p-6 md:p-8 text-slate-500 text-sm font-bold">{d.client}</td>
                        <td className="p-6 md:p-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">{d.size}</td>
                        <td className="p-6 md:p-8 text-right">
                          <button onClick={() => d.url ? window.open(d.url, '_blank') : showToast('Aguarde o processamento na nuvem...', 'warning')} className="font-black text-[11px] flex items-center gap-2 ml-auto hover:bg-slate-50 border border-transparent hover:border-slate-200 px-5 py-2.5 rounded-xl transition-all uppercase tracking-tight" style={{ color: tenantConfig.primaryColor }}>
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
            )
          )}

          {tab === 'finance' && (
            <div className="space-y-8 md:space-y-10 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 md:w-40 md:h-40 bg-green-50 rounded-bl-full transition-transform duration-700 group-hover:scale-125"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase mb-2 md:mb-3 tracking-[0.2em]">Faturado Realizado</div>
                      <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{formatCurrency(data.fins.filter(f => f.status === 'Pago').reduce((a,c)=>a+c.amount,0))}</div>
                    </div>
                    <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-green-500 relative z-10 opacity-80" />
                  </div>
                  <div className="p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex justify-between items-center text-white relative overflow-hidden group" style={{ backgroundColor: tenantConfig.primaryColor }}>
                    <div className="absolute right-0 top-0 w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-bl-full transition-transform duration-700 group-hover:scale-125"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] md:text-[11px] font-black text-white/60 uppercase mb-2 md:mb-3 tracking-[0.2em]">Previsão em Aberto</div>
                      <div className="text-4xl md:text-5xl font-black tracking-tighter">{formatCurrency(data.fins.filter(f => f.status !== 'Pago').reduce((a,c)=>a+c.amount,0))}</div>
                    </div>
                    <div className="p-4 md:p-5 bg-white/10 rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-sm relative z-10 border border-white/20"><DollarSign className="w-8 h-8 md:w-10 md:h-10" /></div>
                  </div>
               </div>
               
               {data.fins.length === 0 && !isFetching ? (
                 <EmptyState icon={DollarSign} title="Nenhuma fatura lançada" description="Registe honorários e despesas para ter o controlo total do seu fluxo de caixa." action={<button onClick={() => setModals({...modals, fin: true})} className="px-6 py-3 text-white rounded-xl font-bold mt-4" style={{ backgroundColor: tenantConfig.primaryColor }}>Lançar Fatura</button>} />
               ) : (
                 <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[700px]">
                       <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] border-b border-slate-100">
                          <tr><th className="p-6 md:p-8">Descrição</th><th className="p-6 md:p-8">Valor</th><th className="p-6 md:p-8">Vencimento</th><th className="p-6 md:p-8">Status</th><th className="p-6 md:p-8 text-right">Ação</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {data.fins.map(f => (
                             <tr key={f.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-6 md:p-8">
                                  <div className="font-extrabold text-slate-800 text-sm mb-1">{f.title}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.client?.name || f.client}</div>
                                </td>
                                <td className="p-6 md:p-8 font-black text-slate-800 text-lg">{formatCurrency(f.amount)}</td>
                                <td className="p-6 md:p-8 text-slate-500 text-sm font-bold">{formatDate(f.dueDate)}</td>
                                <td className="p-6 md:p-8"><span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${f.status === 'Pago' ? 'bg-green-50 text-green-700 border border-green-200' : f.status === 'Atrasado' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>{f.status}</span></td>
                                <td className="p-6 md:p-8 text-right">
                                  {f.status !== 'Pago' && <button onClick={() => wrapAction(async () => { const res = await fetch(`${API_URL}/financials/${f.id}`, {method:'PATCH', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('pascale_token')}`}, body:JSON.stringify({status:'Pago'})}); return res.ok; }, '', 'Fatura liquidada com sucesso!')} className="bg-white border-2 border-slate-200 text-slate-700 font-black hover:border-green-500 hover:text-green-600 px-5 py-2.5 rounded-xl text-[10px] transition-all uppercase tracking-widest shadow-sm">Liquidar</button>}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
          )}
        </div>
      </main>

      {/* MODALS DA DASHBOARD ENTERPRISE */}
      <Modal isOpen={modals.case} onClose={()=>setModals({...modals, case:false})} title="Registar Processo na Nuvem">
        <form onSubmit={(e) => { e.preventDefault(); wrapAction(async () => { const r = await onAddCase(formCase); setFormCase({client:'',title:'',phone:'',cpfCnpj:'',value:'',processNumber:''}); return r; }, 'case', 'Processo gravado com sucesso!'); }} className="space-y-5">
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium focus:border-indigo-500 outline-none transition-all" placeholder="Nome Completo do Cliente" value={formCase.client} onChange={e=>setFormCase({...formCase, client: e.target.value})} />
          <div className="flex gap-4">
            <input className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium focus:border-indigo-500 outline-none transition-all" placeholder="NIF / NIPC / CPF" value={formCase.cpfCnpj} onChange={e=>setFormCase({...formCase, cpfCnpj: applyCpfCnpjMask(e.target.value)})} />
            <input type="tel" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium focus:border-indigo-500 outline-none transition-all" placeholder="Telemóvel" value={formCase.phone} onChange={e=>setFormCase({...formCase, phone: applyPhoneMask(e.target.value)})} />
          </div>
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium focus:border-indigo-500 outline-none transition-all" placeholder="Objeto da Ação (Ex: Divórcio)" value={formCase.title} onChange={e=>setFormCase({...formCase, title: e.target.value})} />
          <div className="flex gap-4">
            <input className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium focus:border-indigo-500 outline-none transition-all" placeholder="Nº Processo" value={formCase.processNumber} onChange={e=>setFormCase({...formCase, processNumber: e.target.value})} />
            <input type="number" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium focus:border-indigo-500 outline-none transition-all" placeholder="Valor da Causa (€)" value={formCase.value} onChange={e=>setFormCase({...formCase, value: e.target.value})} />
          </div>
          <button disabled={actionLoading} className="w-full py-4 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all uppercase tracking-wide text-sm mt-2 flex justify-center items-center" style={{backgroundColor: tenantConfig.primaryColor}}>
            {actionLoading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Registar e Iniciar Acompanhamento"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.fin} onClose={()=>setModals({...modals, fin:false})} title="Lançar Honorários">
        <form onSubmit={(e) => { e.preventDefault(); wrapAction(async () => { const r = await onAddFin(formFin); setFormFin({client:'',amount:'',dueDate:'',title:'',type:'Transferência'}); return r; }, 'fin', 'Fatura registada e pronta a cobrar!'); }} className="space-y-5">
          <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium outline-none focus:border-indigo-500 transition-all" value={formFin.client} onChange={e=>setFormFin({...formFin, client: e.target.value})}>
            <option value="">A quem se destina a fatura?</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium outline-none focus:border-indigo-500 transition-all" placeholder="Descrição (Ex: Consulta Inicial)" value={formFin.title} onChange={e=>setFormFin({...formFin, title: e.target.value})} />
          <div className="flex gap-4">
            <input required type="number" step="0.01" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium outline-none focus:border-indigo-500 transition-all" placeholder="Valor (€)" value={formFin.amount} onChange={e=>setFormFin({...formFin, amount: e.target.value})} />
            <input required type="date" className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium outline-none focus:border-indigo-500 transition-all" value={formFin.dueDate} onChange={e=>setFormFin({...formFin, dueDate: e.target.value})} />
          </div>
          <button disabled={actionLoading} className="w-full py-4 text-white rounded-2xl font-black shadow-xl bg-green-600 hover:-translate-y-1 transition-all uppercase tracking-wide text-sm mt-2 flex justify-center items-center">
            {actionLoading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Emitir Documento de Cobrança"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.doc} onClose={()=>setModals({...modals, doc:false})} title="Arquivo Criptografado (Supabase)">
        <form onSubmit={(e) => { e.preventDefault(); if(!file || !docClient) return; const fd = new FormData(); fd.append('file', file); fd.append('client', docClient); fd.append('name', file.name); wrapAction(async () => { const r = await onAddDoc(fd); if(r) setFile(null); return r; }, 'doc', 'Documento guardado no cofre da nuvem!'); }} className="space-y-6">
          <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-sm font-medium outline-none focus:border-indigo-500 transition-all" value={docClient} onChange={e=>setDocClient(e.target.value)}>
            <option value="">A que processo pertence este documento?</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="border-4 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all group relative cursor-pointer">
             <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" /></div>
             <p className="text-sm font-extrabold text-slate-600 text-center">{file ? file.name : "Clique para anexar um ficheiro"}</p>
             <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest">Tamanho Máximo: 10MB</p>
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setFile(e.target.files[0])} />
          </div>
          <button disabled={actionLoading || !file} className="w-full py-4 text-white rounded-2xl font-black shadow-xl transition-all uppercase tracking-wide text-sm flex justify-center items-center" style={{backgroundColor: tenantConfig.primaryColor, opacity: (!file || actionLoading) ? 0.5 : 1}}>
            {actionLoading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Transferir para Nuvem"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// --- GESTOR DE ESTADO GLOBAL E SINCRONIZAÇÃO NUVEM ---
// ============================================================================
export default function App() {
  const [view, setView] = useState('landing');
  const [tenant, setTenant] = useStickyState({ primaryColor: "#4f46e5", logoText: "PASCALE JURIS", advogado: "Administrador" }, 'pascale_tenant_config');
  const [data, setData] = useState({ cases: [], leads: [], docs: [], fins: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [messages, setMessages] = useStickyState([{ id: 1, text: "Olá! Vi que acedeu ao portal. Tem alguma dúvida?", sender: 'bot', time: '10:30' }], 'pascale_messages');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('pascale_token');
    if (!token) {
       // Se não tem token mas está a tentar ver a app, manda para landing ou login
       if(view === 'dashboard') setView('login');
       return;
    }
    
    setLoading(true);
    try {
      const h = { 'Authorization': `Bearer ${token}` };
      const fetchApi = async (path) => {
        const res = await fetch(`${API_URL}/${path}`, { headers: h });
        if (res.status === 401 || res.status === 403) throw new Error("Auth");
        const json = await res.json();
        return json.success ? json.data : [];
      };

      const [c, l, d, f] = await Promise.all([ fetchApi('cases'), fetchApi('leads'), fetchApi('documents'), fetchApi('financials') ]);
      setData({ cases: c, leads: l, docs: d, fins: f });
    } catch(e) { 
      localStorage.removeItem('pascale_token');
      if (view === 'dashboard') setView('login');
      if (e.message === "Auth") showToast("Sessão terminada por segurança.", "error");
    } finally { setLoading(false); }
  }, [view, showToast]);

  useEffect(() => { 
    if (localStorage.getItem('pascale_token') && view === 'dashboard') { fetchAll(); } 
  }, [fetchAll, view]);

  const apiCall = async (path, method, body, isFormData = false) => {
    const token = localStorage.getItem('pascale_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    
    try {
      const res = await fetch(`${API_URL}/${path}`, { method, headers, body: isFormData ? body : JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { fetchAll(); return true; }
      return false;
    } catch (e) { return false; }
  };

  const handleAddLead = async (leadData) => {
    try {
      await fetch(`${API_URL}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leadData) });
    } catch (e) { console.error("Erro lead", e); }
  };

  const handleSendMessage = (text, sender) => setMessages(prev => [...prev, { id: Date.now(), text, sender, time: 'Agora' }]);

  const renderView = () => {
    switch(view) {
      case 'landing': return <LandingPage onNavigate={setView} onAddLead={handleAddLead} tenantConfig={tenant} showToast={showToast} />;
      case 'login': return <LoginPage onLogin={(l)=>{setTenant(l); setView('dashboard'); fetchAll();}} tenantConfig={tenant} showToast={showToast} />;
      case 'portal': return <ClientPortal onNavigate={setView} caseData={data.cases[0] || null} financials={data.fins} messages={messages} onSendMessage={handleSendMessage} tenantConfig={tenant} showToast={showToast} />;
      case 'dashboard': 
        if (!localStorage.getItem('pascale_token')) return <LoginPage onLogin={(l)=>{setTenant(l); setView('dashboard'); fetchAll();}} tenantConfig={tenant} showToast={showToast} />;
        return <LawyerDashboard 
          data={data} isFetching={loading} showToast={showToast} tenantConfig={tenant}
          onMove={(id, stage) => apiCall(`cases/${id}/move`, 'PATCH', { stage: stage === 'peticao' ? 'analise_juiz' : 'sentenca', status: 'Movimentado' })} 
          onAddCase={(d) => apiCall('cases', 'POST', d)} 
          onAddFin={(d) => apiCall('financials', 'POST', d)}
          onAddDoc={(fd) => apiCall('documents', 'POST', fd, true)}
          onUpdateLead={(id, status) => { /* Update Lead Status Endpoint futuramente */ return true; }}
          onLogout={()=>{localStorage.removeItem('pascale_token'); setView('landing'); showToast('Sessão terminada.', 'success');}} 
        />;
      default: return <LandingPage onNavigate={setView} onAddLead={handleAddLead} tenantConfig={tenant} showToast={showToast} />;
    }
  };

  return (
    <div className="antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50 relative">
      <style>{`
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}</style>
      
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={() => setToast(t => ({...t, visible: false}))} />}

      {/* BARRA MESTRE DE NAVEGAÇÃO INVISÍVEL PARA DEMO */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[300] bg-slate-900/90 backdrop-blur-xl text-white px-3 py-2 rounded-full shadow-2xl flex gap-1 border border-white/10 ring-1 ring-black/5 items-center">
        <button onClick={() => setView('landing')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'landing' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>Site</button>
        <div className="w-1 h-1 bg-slate-700 rounded-full mx-1"></div>
        <button onClick={() => setView('portal')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'portal' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>Portal</button>
        <div className="w-1 h-1 bg-slate-700 rounded-full mx-1"></div>
        <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>SaaS</button>
      </div>

      {renderView()}
    </div>
  );
}