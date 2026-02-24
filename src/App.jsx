import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gavel, 
  Users, 
  FileText, 
  MessageSquare, 
  Bell, 
  Search, 
  Menu, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone,
  LogOut,
  MoreVertical,
  Activity,
  Plus,
  Send,
  X,
  UploadCloud,
  File,
  Paperclip,
  Mic,
  Lock,
  Download,
  Eye,
  DollarSign,
  CreditCard,
  PieChart,
  TrendingUp,
  Calendar
} from 'lucide-react';

// --- CONFIGURAÇÃO DA NUVEM E DADOS INICIAIS ---
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

const DEFAULT_CASES = [];
const DEFAULT_FINANCIALS = [];

const DEFAULT_LEADS = [
  { id: 1, name: "Roberto Justus", phone: "(11) 98888-7777", type: "Trabalhista", status: "Novo", date: "Há 10 min" },
  { id: 2, name: "Ana Maria", phone: "(21) 99999-8888", type: "Família", status: "Contactado", date: "Ontem" }
];

const DEFAULT_MESSAGES = [
  { id: 1, text: "Olá! Vi que acedeu ao portal. Tem alguma dúvida?", sender: 'bot', time: '10:30' }
];

const DEFAULT_DOCUMENTS = [
  { id: 1, name: "Procuracao_Assinada.pdf", client: "Carlos Silva", date: "10/01/2024", size: "1.2 MB" }
];

// --- HOOKS DE PERSISTÊNCIA ---
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

// --- FUNÇÕES UTILITÁRIAS GLOBAIS ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

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

const applyCpfMask = (value) => {
  let v = value.replace(/\D/g, '');
  if (v.length <= 3) return v;
  if (v.length <= 6) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4').slice(0, 14);
};

// --- COMPONENTES DE INTERFACE ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// 0. PÁGINA DE LOGIN E REGISTO (UX SaaS Enterprise)
// ============================================================================
const LoginPage = ({ onLogin, tenantConfig }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pascale_token', data.token);
        
        const lastName = data.lawyer.name.split(' ').pop().toUpperCase();
        const dynamicConfig = {
          name: data.lawyer.officeName || `${data.lawyer.name} & Associados`,
          primaryColor: data.lawyer.primaryColor || '#0f172a',
          logoText: `${lastName} JURIS`,
          advogado: data.lawyer.name
        };

        onLogin(dynamicConfig); 
      } else {
        setErrorMsg(data.error || "Acesso negado.");
      }
    } catch (err) {
      setErrorMsg("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, officeName })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pascale_token', data.token);
        
        const lastName = data.lawyer.name.split(' ').pop().toUpperCase();
        const dynamicConfig = {
          name: data.lawyer.officeName || `${data.lawyer.name} & Associados`,
          primaryColor: data.lawyer.primaryColor || '#0f172a',
          logoText: `${lastName} JURIS`,
          advogado: data.lawyer.name
        };

        onLogin(dynamicConfig); 
      } else {
        setErrorMsg(data.error || "Erro ao criar conta.");
      }
    } catch (err) {
      setErrorMsg("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up transition-all duration-300">
        
        <div className="p-8 text-center transition-colors duration-500 relative" style={{ backgroundColor: isRegisterMode ? '#0f172a' : tenantConfig.primaryColor }}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
            {isRegisterMode ? <ShieldCheck className="w-8 h-8" /> : <Gavel className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRegisterMode ? "PASCALE JURIS" : tenantConfig.logoText}
          </h1>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">
            {isRegisterMode ? "Criar o seu Escritório" : "Acesso Restrito"}
          </p>
        </div>

        <div className="p-8">
          {isRegisterMode ? (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seu Nome Completo</label>
                <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-shadow bg-slate-50" placeholder="Ex: Dr. João Silva" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Escritório</label>
                <input required value={officeName} onChange={(e) => setOfficeName(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-shadow bg-slate-50" placeholder="Ex: Silva & Associados" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Profissional</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-shadow bg-slate-50" placeholder="joao@advocacia.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Criar Palavra-passe</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-shadow bg-slate-50" placeholder="Mínimo 6 caracteres" />
              </div>
              
              <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-opacity flex justify-center items-center mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Criar Conta Segura"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Corporativo</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 outline-none transition-shadow bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="admin@lopes.pt" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Palavra-passe</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 outline-none transition-shadow bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} style={{ backgroundColor: tenantConfig.primaryColor }} className="w-full py-3 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-opacity flex justify-center items-center">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Aceder ao Sistema"}
              </button>
            </form>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg text-center animate-fade-in flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button 
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMsg(''); }} 
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {isRegisterMode ? "Já tem uma conta? Faça Login aqui" : "Ainda não tem conta? Crie o seu Escritório"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};


// ============================================================================
// 1. LANDING PAGE (SITE PÚBLICO) - MANTIDO NO CÓDIGO MAS DESATIVADO
// ============================================================================
const LandingPage = ({ onNavigate, onAddLead, tenantConfig }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Cível' });
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawPhone = formData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      alert("Por favor, digite um número de telemóvel válido.");
      return;
    }
    onAddLead({ id: Date.now(), name: formData.name, phone: formData.phone, type: formData.type, status: "Novo", date: "Agora mesmo" });
    setFormData({ name: '', phone: '', type: 'Cível' });
    setIsModalOpen(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  };

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen flex flex-col">
      {showNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">Solicitação enviada com sucesso!</span>
        </div>
      )}

      <header className="px-6 py-4 flex justify-between items-center border-b shadow-sm sticky top-0 bg-white z-50">
        <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" style={{ color: tenantConfig.primaryColor }} onClick={() => onNavigate('login')}>
          <Gavel className="w-6 h-6" />
          {tenantConfig.logoText}
        </div>
        <button onClick={() => onNavigate('portal')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition">
          Área do Cliente
        </button>
      </header>

      <main className="flex-1">
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Iniciar Consulta Gratuita">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telemóvel</label>
              <input required type="tel" className="w-full p-3 border rounded-lg outline-none focus:ring-2" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Caso</label>
              <select className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Cível">Cível / Consumidor</option>
                <option value="Trabalhista">Trabalhista</option>
                <option value="Família">Família (Divórcio/Pensão)</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>
            <button type="submit" className="w-full py-3 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition" style={{ backgroundColor: tenantConfig.primaryColor }}>Enviar Pedido</button>
          </form>
        </Modal>

        <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 animate-fade-in">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold tracking-wide uppercase">ADVOCACIA DIGITAL</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">O seu processo jurídico, <span style={{ color: tenantConfig.primaryColor }}>sem segredos.</span></h1>
            <p className="text-lg text-slate-600 leading-relaxed">Na {tenantConfig.name}, não precisa ligar para saber o que está a acontecer. Acompanhe cada passo do seu caso em tempo real pela nossa aplicação exclusiva.</p>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition transform hover:-translate-y-1" style={{ backgroundColor: tenantConfig.primaryColor }}>Iniciar Consulta</button>
              <button onClick={() => onNavigate('portal')} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-slate-300 transition">Já sou Cliente</button>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="absolute -inset-4 opacity-20 blur-3xl rounded-full" style={{ backgroundColor: tenantConfig.primaryColor }}></div>
              <div className="relative w-72 h-[550px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/20">
                <div className="absolute top-0 w-full h-full bg-slate-50 flex flex-col p-6 pt-12 space-y-4">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm">L</div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Bem-vindo</div>
                        <div className="font-bold text-slate-800 text-sm tracking-tight">Carlos Silva</div>
                      </div>
                   </div>
                   <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-[10px] text-green-600 font-bold mb-1">MOVIMENTAÇÃO RECENTE</div>
                      <div className="font-bold text-slate-800 text-xs">Juiz recebeu documentos</div>
                      <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden"><div className="w-3/5 h-full" style={{ backgroundColor: tenantConfig.primaryColor }}></div></div>
                   </div>
                   <div className="p-4 rounded-xl shadow-lg text-white" style={{ backgroundColor: tenantConfig.primaryColor }}>
                      <div className="font-bold text-sm mb-1">Precisa de ajuda?</div>
                      <div className="text-[10px] opacity-80 mb-3 leading-tight">Fale com o seu advogado agora mesmo.</div>
                      <div className="w-full py-2 bg-white/20 rounded text-center text-xs font-bold">Abrir Chat</div>
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
// 2. PORTAL DO CLIENTE - MANTIDO NO CÓDIGO MAS DESATIVADO
// ============================================================================
const ClientPortal = ({ onNavigate, caseData, onNotifyLawyer, messages, onSendMessage, onUploadDocument, financials, tenantConfig }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const chatEndRef = useRef(null);

  const { myFinancials, totalPendente } = useMemo(() => {
    if (!caseData) return { myFinancials: [], totalPendente: 0 };
    const filtered = financials.filter(f => f.client === caseData.client || f.client === "Carlos Silva");
    const total = filtered.filter(f => f.status !== 'Pago').reduce((acc, curr) => acc + curr.amount, 0);
    return { myFinancials: filtered, totalPendente: total };
  }, [financials, caseData]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadOpen(false);
      onUploadDocument({ name: "Documento_Cliente.pdf", client: caseData?.client });
      onNotifyLawyer("Novo Documento Recebido de Cliente.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue, 'user');
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      onSendMessage("Anotado! Notifiquei o advogado para que ele analise assim que possível.", 'bot');
      onNotifyLawyer("Mensagem de Cliente no chat do Portal.");
    }, 1500);
  };

  if (!caseData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <Activity className="w-12 h-12 mb-4 animate-spin" style={{ color: tenantConfig.primaryColor }} />
      <p>A aguardar dados da nuvem...</p>
      <button onClick={() => onNavigate('landing')} className="mt-4 font-bold hover:underline" style={{ color: tenantConfig.primaryColor }}>Voltar para a Página Inicial</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
      {showNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up" style={{ backgroundColor: tenantConfig.primaryColor }}>
          <UploadCloud className="w-5 h-5" />
          <span className="font-bold text-sm">Documento enviado com sucesso!</span>
        </div>
      )}

      <Modal isOpen={financialOpen} onClose={() => setFinancialOpen(false)} title="Financeiro">
        <div className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center mb-4 border border-slate-200">
             <span className="text-sm font-bold text-slate-700">Total Pendente</span>
             <span className="text-xl font-extrabold" style={{ color: tenantConfig.primaryColor }}>
               {formatCurrency(totalPendente)}
             </span>
          </div>
          <div className="space-y-3">
             {myFinancials.map(fin => (
               <div key={fin.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center bg-white shadow-sm">
                 <div>
                   <div className="font-bold text-slate-800 text-sm tracking-tight">{fin.title}</div>
                   <div className="text-[10px] text-slate-400">Vencimento: {formatDate(fin.dueDate)}</div>
                 </div>
                 <div className="text-right">
                   <div className="font-bold text-slate-800 text-sm">{formatCurrency(fin.amount)}</div>
                   <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${fin.status === 'Pago' ? 'bg-green-100 text-green-700' : fin.status === 'Atrasado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                     {fin.status}
                   </span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Enviar Documento">
        {!isUploading ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition cursor-pointer">
              <UploadCloud className="w-12 h-12 mb-2 opacity-50" style={{ color: tenantConfig.primaryColor }} />
              <p className="text-sm font-bold text-slate-600">Arraste o ficheiro aqui</p>
              <p className="text-[10px]">PDF, JPG ou PNG (Max 10MB)</p>
            </div>
            <button onClick={handleUpload} className="w-full py-4 text-white rounded-lg font-bold shadow-lg uppercase tracking-wide text-xs hover:opacity-90" style={{ backgroundColor: tenantConfig.primaryColor }}>Confirmar Envio Seguro</button>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: tenantConfig.primaryColor }}></div>
             <p className="font-bold animate-pulse text-sm" style={{ color: tenantConfig.primaryColor }}>A processar...</p>
          </div>
        )}
      </Modal>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up md:max-w-md md:right-4 md:left-auto md:bottom-4 md:top-auto md:h-[600px] md:shadow-2xl md:rounded-2xl border-slate-200">
          <div className="text-white p-4 flex justify-between items-center md:rounded-t-2xl" style={{ backgroundColor: tenantConfig.primaryColor }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {tenantConfig.advogado.substring(0, 2).toUpperCase()}
              </div>
              <div><div className="font-bold text-sm leading-none mb-1">{tenantConfig.advogado}</div><div className="text-[10px] opacity-70 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Disponível agora</div></div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 bg-slate-100 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none'}`}
                  style={msg.sender === 'user' ? { backgroundColor: tenantConfig.primaryColor } : {}}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-[10px] text-slate-400 italic">{tenantConfig.advogado} está a escrever...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t flex gap-2 md:rounded-b-2xl">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-100 rounded-full px-4 text-sm outline-none border border-transparent focus:border-slate-300 transition" placeholder="Escreva a sua dúvida..." />
            <button onClick={handleSendMessage} className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0 transition hover:opacity-90" style={{ backgroundColor: tenantConfig.primaryColor }}><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg transition-colors duration-500" style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="flex justify-between items-center mb-8">
           <button onClick={() => onNavigate('landing')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><ArrowRight className="w-5 h-5 rotate-180" /></button>
           <span className="font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Painel do Cliente</span>
           <div className="relative"><Bell className="w-5 h-5 opacity-70" /><div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white/20"></div></div>
        </div>
        <div className="flex flex-col items-center">
           <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-xl ring-2 ring-white/10">
             {caseData.client ? caseData.client.substring(0,2).toUpperCase() : 'CS'}
           </div>
           <h1 className="text-2xl font-bold tracking-tight">Olá, {caseData.client}</h1>
           <p className="opacity-70 text-sm mt-1 font-medium">O seu processo está estável e monitorizado.</p>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-fade-in relative overflow-hidden">
           <div className="absolute right-0 top-0 w-16 h-16 opacity-10 rounded-bl-full" style={{ backgroundColor: tenantConfig.primaryColor }}></div>
           <div className="flex justify-between items-start mb-4">
             <div className="relative z-10">
               <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tighter bg-slate-100" style={{ color: tenantConfig.primaryColor }}>Acção Cível</span>
               <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight tracking-tight">{caseData.title}</h2>
               <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-tighter">PROC. {caseData.processNumber || "A aguardar Numeração"}</p>
             </div>
             <Activity className="w-5 h-5 text-green-500 animate-pulse" />
           </div>
           <div className="space-y-2 relative z-10">
             <div className="flex justify-between text-[11px] font-bold text-slate-500"><span>Evolução Estimada</span><span>60%</span></div>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner"><div className="w-[60%] h-full rounded-full transition-all duration-1000" style={{ backgroundColor: tenantConfig.primaryColor }}></div></div>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm"><Clock className="w-4 h-4" style={{ color: tenantConfig.primaryColor }} /> Histórico de Etapas</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
            {caseData.timeline && caseData.timeline.map((step) => (
              <div key={step.id} className="relative z-10 flex gap-4">
                <div 
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-white transition-all duration-500 ${step.completed ? 'border-green-500 text-green-500 bg-green-50/50' : 'border-slate-200'}`}
                  style={!step.completed && (step.current || step.isCurrent) ? { borderColor: tenantConfig.primaryColor, color: tenantConfig.primaryColor, boxShadow: `0 0 0 4px ${tenantConfig.primaryColor}15` } : {}}
                >
                  {step.completed ? <CheckCircle className="w-3 h-3 fill-current" /> : step.current || step.isCurrent ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tenantConfig.primaryColor }}></div> : null}
                </div>
                <div className={`${step.current || step.isCurrent || step.completed ? 'opacity-100' : 'opacity-60'}`}>
                  <h4 className="font-bold text-slate-800 text-sm tracking-tight">{step.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">{step.date}</span>
                  <p className="text-xs text-slate-600 leading-snug bg-slate-50 p-3 rounded-xl mt-2 border border-slate-100/50">{step.description || step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setChatOpen(true)} className="p-4 text-white rounded-2xl font-bold shadow-lg flex flex-col items-center gap-2 text-xs transition active:scale-95 hover:opacity-90" style={{ backgroundColor: tenantConfig.primaryColor }}><MessageSquare className="w-5 h-5" /> Falar com {tenantConfig.advogado}</button>
          <button onClick={() => setFinancialOpen(true)} className="p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex flex-col items-center gap-2 text-xs hover:border-slate-300 transition active:scale-95"><DollarSign className="w-5 h-5 text-green-600" /> Ver Pagamentos</button>
        </div>
        <button onClick={() => setUploadOpen(true)} className="w-full p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition active:scale-95"><UploadCloud className="w-5 h-5" style={{ color: tenantConfig.primaryColor }} /> Enviar Arquivo Digital</button>
      </div>
    </div>
  );
};

// ============================================================================
// 3. PAINEL DO ADVOGADO
// ============================================================================
const LawyerDashboard = ({ onNavigate, cases, onMoveCase, onAddCase, leads, documents, financials, onUpdateFinancial, onAddFinancial, onAddDocument, globalNotifications, onLogout, onUpdateLead, tenantConfig }) => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [notification, setNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const activeClients = useMemo(() => {
    return Array.from(new Set(cases.map(c => typeof c.client === 'object' ? c.client?.name : c.client))).filter(Boolean);
  }, [cases]);

  const { totalRevenue, openRevenue, lateRevenue } = useMemo(() => {
    return {
      totalRevenue: financials.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + curr.amount, 0),
      openRevenue: financials.filter(f => f.status === 'Aberto').reduce((acc, curr) => acc + curr.amount, 0),
      lateRevenue: financials.filter(f => f.status === 'Atrasado').reduce((acc, curr) => acc + curr.amount, 0),
    };
  }, [financials]);

  const groupedCases = useMemo(() => ({
    peticao: cases.filter(c => c.stage === 'peticao'),
    analise_juiz: cases.filter(c => c.stage === 'analise_juiz'),
    sentenca: cases.filter(c => c.stage === 'sentenca')
  }), [cases]);

  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isAddFinModalOpen, setIsAddFinModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [isSavingFin, setIsSavingFin] = useState(false);

  const [newCaseData, setNewCaseData] = useState({ client: '', cpf: '', phone: '', title: '', processNumber: '', notes: '' });
  const [newDocData, setNewDocData] = useState({ name: '', client: '' });
  
  const [newFinData, setNewFinData] = useState({ client: '', amount: '', dueDate: '', type: 'Boleto' });
  const [finChargeType, setFinChargeType] = useState('Honorários Iniciais');
  const [finTotalInstallments, setFinTotalInstallments] = useState(10);
  const [finCurrentInstallment, setFinCurrentInstallment] = useState(1);
  const [finCustomTitle, setFinCustomTitle] = useState('');

  useEffect(() => {
    if (globalNotifications && globalNotifications.length > 0) {
      const latest = globalNotifications[globalNotifications.length - 1];
      setNotification({ title: "Nova Atividade", message: latest, type: "info" });
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalNotifications]);

  const handleMove = (id) => {
    onMoveCase(id);
    setNotification({ title: "Sucesso", message: "Processo movido. Base de dados atualizada!", type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePay = (id) => {
    onUpdateFinancial(id, "Pago");
    setNotification({ title: "Financeiro", message: "Pagamento registado com sucesso.", type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAttendWhatsApp = (phone, name) => {
    const phoneDigits = phone.replace(/\D/g, '');
    const message = `Olá, ${name}! Aqui é do escritório ${tenantConfig.name}. Tudo bem? Estou a entrar em contacto sobre o seu processo.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phoneDigits}?text=${encodedMessage}`, '_blank');
  };

  const handleAttendLead = (lead) => {
    if (lead.status === 'Novo') {
      onUpdateLead(lead.id, 'Contactado');
    }
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const message = `Olá, ${lead.name}! Recebemos o seu contacto através do nosso portal jurídico referente à área de ${lead.type}. Como o ${tenantConfig.advogado} pode ajudá-lo hoje?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phoneDigits}?text=${encodedMessage}`, '_blank');
    
    setNotification({ title: "Atendimento Iniciado", message: `A abrir WhatsApp para ${lead.name}...`, type: "success" });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAnxietyClick = (clientName) => {
    setNotification({ 
      title: "Alerta de Ansiedade - " + clientName, 
      message: "Este cliente demonstra um nível alto de ansiedade. Priorize o envio de uma atualização pelo WhatsApp para o tranquilizar.", 
      type: "warning" 
    });
    setTimeout(() => setNotification(null), 7000);
  };

  const handleAddNewCase = async (e) => {
    e.preventDefault();
    const rawPhone = newCaseData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10 && newCaseData.phone.length > 0) {
      setNotification({ title: "Telemóvel Inválido", message: "Por favor, digite apenas números.", type: "warning" });
      setTimeout(() => setNotification(null), 4000);
      return; 
    }

    setIsSavingCase(true); 
    const result = await onAddCase(newCaseData); 
    setIsSavingCase(false); 

    if (result && result.success === false) {
      setNotification({ title: "Falha ao Salvar", message: result.error, type: "warning" });
      setTimeout(() => setNotification(null), 6000);
    } else {
      setIsAddCaseModalOpen(false);
      setNewCaseData({ client: '', cpf: '', phone: '', title: '', processNumber: '', notes: '' });
      setNotification({ title: "Processo Registado", message: "Gravado na Nuvem com sucesso.", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddNewFin = async (e) => {
    e.preventDefault();
    if (!newFinData.client) {
      setNotification({ title: "Atenção", message: "Selecione um cliente da lista.", type: "warning" });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    let finalTitle = finChargeType;
    if (finChargeType === 'Parcelamento') {
      finalTitle = `Parcela ${finCurrentInstallment}/${finTotalInstallments}`;
    } else if (finChargeType === 'Outro') {
      finalTitle = finCustomTitle;
    }

    setIsSavingFin(true); 
    const result = await onAddFinancial({ ...newFinData, title: finalTitle });
    setIsSavingFin(false);

    if (result && result.success === false) {
      setNotification({ title: "Falha ao Lançar", message: result.error, type: "warning" });
      setTimeout(() => setNotification(null), 6000);
    } else {
      setIsAddFinModalOpen(false);
      setNewFinData({ client: '', amount: '', dueDate: '', type: 'Boleto' });
      setFinChargeType('Honorários Iniciais');
      setFinCurrentInstallment(1);
      setFinTotalInstallments(10);
      setFinCustomTitle('');
      setNotification({ title: "Fatura Lançada", message: "Gravada na Nuvem.", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddNewDoc = (e) => {
    e.preventDefault();
    if (!newDocData.client) {
      setNotification({ title: "Atenção", message: "Selecione um cliente da lista.", type: "warning" });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    onAddDocument(newDocData);
    setIsAddDocModalOpen(false);
    setNewDocData({ name: '', client: '' });
    setNotification({ title: "Ficheiro Salvo", message: "O documento foi anexado ao cliente com sucesso.", type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      
      {/* Notificações Flutuantes */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[300] px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-slide-in border 
            ${notification.type === 'warning' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-900 border-white/10 text-white'}`}>
          <div className={`${notification.type === 'success' ? 'bg-green-500' : notification.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'} rounded-full p-2 mt-0.5`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-white" /> : notification.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-white" /> : <Bell className="w-4 h-4 text-white" />}
          </div>
          <div className="max-w-xs">
            <div className={`font-bold text-sm tracking-tight ${notification.type === 'warning' ? 'text-red-800' : 'text-white'}`}>{notification.title}</div>
            <div className={`text-xs mt-1 leading-relaxed ${notification.type === 'warning' ? 'text-red-700 font-medium' : 'opacity-80'}`}>{notification.message}</div>
          </div>
          <button onClick={() => setNotification(null)} className={`ml-2 p-1 rounded hover:bg-black/10 transition ${notification.type === 'warning' ? 'text-red-800' : 'text-white'}`}>
             <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Novo Processo OTIMIZADO */}
      <Modal isOpen={isAddCaseModalOpen} onClose={() => setIsAddCaseModalOpen(false)} title="Registar Novo Processo (Nuvem)">
        <form onSubmit={handleAddNewCase} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo do Cliente</label>
            <input required autoFocus className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: João da Silva" value={newCaseData.client} onChange={e => setNewCaseData({...newCaseData, client: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF <span className="text-[9px] lowercase font-normal">(Opcional)</span></label>
                <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="000.000.000-00" value={newCaseData.cpf} onChange={e => setNewCaseData({...newCaseData, cpf: applyCpfMask(e.target.value)})} />
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp <span className="text-[9px] lowercase font-normal">(Opcional)</span></label>
                <input type="tel" className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="(11) 99999-9999" value={newCaseData.phone} onChange={e => setNewCaseData({...newCaseData, phone: applyPhoneMask(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assunto / Título da Acção</label>
            <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: Usucapião Imóvel X" value={newCaseData.title} onChange={e => setNewCaseData({...newCaseData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do Processo (CNJ) <span className="text-slate-400 font-normal normal-case ml-1">- Opcional</span></label>
            <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: 0001234-56.2024.8.26.0000" value={newCaseData.processNumber} onChange={e => setNewCaseData({...newCaseData, processNumber: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações Importantes <span className="text-slate-400 font-normal normal-case ml-1">- Opcional</span></label>
            <textarea rows="3" className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50 resize-none text-sm" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Anote os detalhes e factos da primeira reunião..." value={newCaseData.notes} onChange={e => setNewCaseData({...newCaseData, notes: e.target.value})} />
          </div>
          <button type="submit" disabled={isSavingCase} className={`w-full py-3 mt-4 text-white rounded-lg font-bold shadow-lg transition flex justify-center items-center hover:opacity-90 ${isSavingCase ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ backgroundColor: tenantConfig.primaryColor }}>
            {isSavingCase ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Salvar e Adicionar ao Painel"}
          </button>
        </form>
      </Modal>

      {/* Modal Nova Fatura Inteligente */}
      <Modal isOpen={isAddFinModalOpen} onClose={() => setIsAddFinModalOpen(false)} title="Lançar Nova Fatura (Nuvem)">
        <form onSubmit={handleAddNewFin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
            <select required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={newFinData.client} onChange={e => setNewFinData({...newFinData, client: e.target.value})}>
              <option value="">Selecione um cliente ativo...</option>
              {activeClients.map(clientName => (
                <option key={clientName} value={clientName}>{clientName}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Cobrança</label>
            <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={finChargeType} onChange={e => setFinChargeType(e.target.value)}>
              <option value="Honorários Iniciais">Honorários Iniciais</option>
              <option value="Honorários Finais">Honorários Finais</option>
              <option value="Parcelamento">Parcelamento mensal</option>
              <option value="Outro">Outra descrição (Livre)</option>
            </select>
          </div>

          {finChargeType === 'Parcelamento' && (
            <div className="flex gap-4 animate-fade-in">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parcela Atual</label>
                <input required type="number" min="1" max={finTotalInstallments} className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={finCurrentInstallment} onChange={e => setFinCurrentInstallment(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">De (Total)</label>
                <input required type="number" min="2" className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={finTotalInstallments} onChange={e => setFinTotalInstallments(e.target.value)} />
              </div>
            </div>
          )}

          {finChargeType === 'Outro' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição Livre</label>
              <input required autoFocus className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: Custas Judiciais / Emissão Documentos" value={finCustomTitle} onChange={e => setFinCustomTitle(e.target.value)} />
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="1500.00" value={newFinData.amount} onChange={e => setNewFinData({...newFinData, amount: e.target.value})} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento</label>
              <input required type="date" className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={newFinData.dueDate} onChange={e => setNewFinData({...newFinData, dueDate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forma de Pagamento</label>
            <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={newFinData.type} onChange={e => setNewFinData({...newFinData, type: e.target.value})}>
              <option value="Boleto">Boleto</option>
              <option value="Pix">Pix</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>
          <button type="submit" disabled={isSavingFin} className={`w-full py-3 mt-4 text-white rounded-lg font-bold shadow-lg transition flex justify-center items-center hover:opacity-90 ${isSavingFin ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ backgroundColor: tenantConfig.primaryColor }}>
            {isSavingFin ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Lançar Cobrança"}
          </button>
        </form>
      </Modal>

      {/* Modal Novo Documento */}
      <Modal isOpen={isAddDocModalOpen} onClose={() => setIsAddDocModalOpen(false)} title="Upload de Ficheiro">
        <form onSubmit={handleAddNewDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
            <select required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={newDocData.client} onChange={e => setNewDocData({...newDocData, client: e.target.value})}>
              <option value="">Selecione um cliente ativo...</option>
              {activeClients.map(clientName => (
                <option key={clientName} value={clientName}>{clientName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Ficheiro</label>
            <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: Contrato_Assinado.pdf" value={newDocData.name} onChange={e => setNewDocData({...newDocData, name: e.target.value})} />
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition">
             <UploadCloud className="w-8 h-8 mb-2 opacity-50" style={{ color: tenantConfig.primaryColor }} />
             <p className="text-xs font-bold">Anexar ficheiro falso para teste</p>
          </div>
          <button type="submit" className="w-full py-3 mt-4 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition" style={{ backgroundColor: tenantConfig.primaryColor }}>
            Salvar Documento
          </button>
        </form>
      </Modal>

      {/* Menu Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR DO ADVOGADO COM COR DINÂMICA */}
      <aside className={`fixed md:relative z-[70] h-full w-64 text-white flex flex-col shadow-2xl transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg shadow-lg"><Gavel className="w-5 h-5 text-white" /></div>
            <span className="font-extrabold text-white tracking-tighter text-lg">{tenantConfig.logoText}</span>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <button onClick={() => { setActiveTab('kanban'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'kanban' ? 'bg-white/20 text-white shadow-xl translate-x-1' : 'hover:bg-white/5'}`}><Activity className="w-5 h-5" /> <span className="text-sm font-bold">Painel de Gestão</span></button>
          <button onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'leads' ? 'bg-white/20 text-white shadow-xl translate-x-1' : 'hover:bg-white/5'}`}><Users className="w-5 h-5" /> <span className="text-sm font-bold flex-1 text-left">Novos Leads</span> {leads && leads.length > 0 && <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-extrabold text-white">{leads.length}</span>}</button>
          <button onClick={() => { setActiveTab('docs'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'docs' ? 'bg-white/20 text-white shadow-xl translate-x-1' : 'hover:bg-white/5'}`}><FileText className="w-5 h-5" /> <span className="text-sm font-bold flex-1 text-left">Documentação</span></button>
          <button onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'finance' ? 'bg-white/20 text-white shadow-xl translate-x-1' : 'hover:bg-white/5'}`}><DollarSign className="w-5 h-5" /> <span className="text-sm font-bold text-left">Controlo Financeiro</span></button>
        </nav>
        <div className="p-6 border-t border-white/10"><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:text-white transition opacity-60 hover:bg-red-500/80 hover:opacity-100"><LogOut className="w-4 h-4" /> Sair do Sistema</button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 md:h-24 bg-white border-b flex items-center justify-between px-6 md:px-10 shadow-sm z-40">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
             <h1 className="font-extrabold text-xl md:text-2xl text-slate-800 tracking-tight capitalize">{activeTab.replace('_', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* BOTÕES DE AÇÃO DINÂMICOS */}
            {activeTab === 'kanban' && (
              <button onClick={() => setIsAddCaseModalOpen(true)} className="text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95 text-sm" style={{ backgroundColor: tenantConfig.primaryColor }}>
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Processo</span>
              </button>
            )}
            {activeTab === 'finance' && (
              <button onClick={() => setIsAddFinModalOpen(true)} className="bg-green-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95 text-sm">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova Fatura</span>
              </button>
            )}
            {activeTab === 'docs' && (
              <button onClick={() => setIsAddDocModalOpen(true)} className="text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95 text-sm" style={{ backgroundColor: tenantConfig.primaryColor }}>
                <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Upload Arquivo</span>
              </button>
            )}

            <div className="hidden md:flex flex-col text-right border-l pl-6 border-slate-200">
              <span className="text-sm font-extrabold text-slate-800">{tenantConfig.advogado}</span>
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Acesso Seguro</span>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm" style={{ backgroundColor: tenantConfig.primaryColor }}>
              {tenantConfig.advogado.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO DAS ABAS */}
        <div className="flex-1 overflow-auto p-4 md:p-10 bg-slate-50/50 pb-24 md:pb-10">
          {activeTab === 'finance' ? (
            <div className="animate-fade-in space-y-6 md:space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                 <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition duration-500"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Receita Total Líquida</div><div className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">{formatCurrency(totalRevenue)}</div><div className="mt-4 flex items-center gap-1 text-green-500 text-[10px] font-bold"><TrendingUp className="w-3 h-3" /> +12% vs mês anterior</div></div>
                 <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition duration-500"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Honorários em Aberto</div><div className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-tight">{formatCurrency(openRevenue)}</div></div>
                 <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition duration-500"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Crédito de Risco</div><div className="text-3xl md:text-4xl font-extrabold text-red-600 tracking-tight">{formatCurrency(lateRevenue)}</div></div>
               </div>
               <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden overflow-x-auto">
                   <table className="w-full text-left text-sm min-w-[600px]">
                     <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b">
                       <tr><th className="p-4 md:p-8">Descrição da Fatura</th><th className="p-4 md:p-8">Cliente</th><th className="p-4 md:p-8">Vencimento</th><th className="p-4 md:p-8">Montante</th><th className="p-4 md:p-8">Estado</th><th className="p-4 md:p-8 text-right">Ações</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {financials && financials.map(fin => (
                         <tr key={fin.id} className="hover:bg-slate-50/50 transition duration-300">
                           <td className="p-4 md:p-8 font-bold text-slate-800">{fin.title}</td>
                           <td className="p-4 md:p-8 text-slate-600 font-medium">{fin.client}</td>
                           <td className="p-4 md:p-8 text-slate-500 font-medium">{formatDate(fin.dueDate)}</td>
                           <td className="p-4 md:p-8 font-extrabold text-slate-800">{formatCurrency(fin.amount)}</td>
                           <td className="p-4 md:p-8"><span className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-tight ${fin.status === 'Pago' ? 'bg-green-100 text-green-700' : fin.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{fin.status}</span></td>
                           <td className="p-4 md:p-8 text-right">{fin.status !== 'Pago' && <button onClick={() => handlePay(fin.id)} className="bg-white text-green-600 font-extrabold hover:bg-green-600 hover:text-white px-3 md:px-5 py-2 rounded-xl border-2 border-green-500/20 text-[10px] transition-all duration-300 shadow-sm hover:shadow-green-500/20">Liquidar</button>}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
            </div>
          ) : activeTab === 'leads' ? (
            <div className="animate-fade-in bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden overflow-x-auto">
                 <table className="w-full text-left text-sm min-w-[600px]">
                   <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b">
                     <tr><th className="p-4 md:p-8">Interessado</th><th className="p-4 md:p-8">Contato</th><th className="p-4 md:p-8">Área</th><th className="p-4 md:p-8">Data Entrada</th><th className="p-4 md:p-8">Status</th><th className="p-4 md:p-8 text-right">Ação</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {leads && leads.map(lead => (
                       <tr key={lead.id} className="hover:bg-slate-50/50 transition duration-300">
                         <td className="p-4 md:p-8 font-bold text-slate-800">{lead.name}</td>
                         <td className="p-4 md:p-8 text-slate-600 font-medium">{lead.phone}</td>
                         <td className="p-4 md:p-8"><span className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-tighter" style={{ color: tenantConfig.primaryColor }}>{lead.type}</span></td>
                         <td className="p-4 md:p-8 text-slate-400 font-medium">{lead.date}</td>
                         <td className="p-4 md:p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase ${lead.status === 'Novo' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>{lead.status}</span></td>
                         <td className="p-4 md:p-8 text-right">
                           <button 
                             onClick={() => handleAttendLead(lead)} 
                             className={`text-white font-extrabold px-4 md:px-5 py-2.5 rounded-xl text-[10px] transition shadow-lg flex items-center gap-2 ml-auto hover:opacity-90`}
                             style={lead.status === 'Novo' ? { backgroundColor: tenantConfig.primaryColor } : { backgroundColor: '#22c55e' }}
                           >
                             <MessageSquare className="w-3 h-3" />
                             {lead.status === 'Novo' ? 'Atender' : 'WhatsApp'}
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
            </div>
          ) : activeTab === 'docs' ? (
            <div className="animate-fade-in bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                   <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b">
                     <tr><th className="p-4 md:p-8">Arquivo Digital</th><th className="p-4 md:p-8">Remetente</th><th className="p-4 md:p-8">Data</th><th className="p-4 md:p-8">Tamanho</th><th className="p-4 md:p-8 text-right">Ação</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {documents && documents.map(doc => (
                       <tr key={doc.id} className="hover:bg-slate-50/50 transition duration-300">
                         <td className="p-4 md:p-8 font-bold text-slate-800 flex items-center gap-3 md:gap-4"><div className="p-2 bg-slate-100 rounded-lg"><File className="w-4 h-4 md:w-5 md:h-5" style={{ color: tenantConfig.primaryColor }} /></div> {doc.name}</td>
                         <td className="p-4 md:p-8 text-slate-600 font-medium">{doc.client}</td>
                         <td className="p-4 md:p-8 text-slate-500 font-medium">{doc.date}</td>
                         <td className="p-4 md:p-8 text-slate-400 text-[10px] font-extrabold uppercase tracking-tighter">{doc.size}</td>
                         <td className="p-4 md:p-8 text-right"><button className="font-extrabold hover:bg-slate-50 px-3 md:px-5 py-2.5 rounded-xl text-[10px] transition-all border-2 border-transparent flex items-center gap-2 ml-auto shadow-sm" style={{ color: tenantConfig.primaryColor }}><Download className="w-4 h-4" /> <span className="hidden sm:inline">Baixar</span></button></td>
                       </tr>
                     ))}
                   </tbody>
                </table>
            </div>
          ) : (
            <div className="animate-fade-in space-y-8 md:space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                
                <div onClick={() => setNotification({ title: "Processos Ativos", message: `Você tem ${cases.length} processos sendo geridos no momento.`, type: "info" })} className="cursor-pointer bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute right-0 top-0 w-16 h-16 md:w-24 md:h-24 opacity-10 rounded-bl-full group-hover:scale-125 transition duration-700 origin-top-right" style={{ backgroundColor: tenantConfig.primaryColor }}></div>
                  <div className="text-[9px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-2 md:mb-4">Processos em Carteira</div>
                  <div className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tighter">{cases.length}</div>
                </div>
                
                <div onClick={() => setNotification({ title: "Alerta de Ansiedade", message: `Existem ${cases.filter(c => c.anxietyScore > 70).length} clientes que precisam de atenção. Role para baixo e veja os alertas vermelhos.`, type: "warning" })} className="cursor-pointer bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="absolute right-0 top-0 w-16 h-16 md:w-24 md:h-24 bg-red-50 rounded-bl-full group-hover:scale-125 transition duration-700 opacity-60 origin-top-right"></div>
                   <div className="text-[9px] md:text-[10px] text-red-500 font-extrabold uppercase tracking-widest mb-2 md:mb-4 flex items-center gap-1">
                     Índice de Ansiedade <AlertTriangle className="w-3 h-3" />
                   </div>
                   <div className="text-3xl md:text-5xl font-extrabold text-red-600 tracking-tighter">{cases.filter(c => c.anxietyScore > 70).length}</div>
                </div>
                
                <div onClick={() => setActiveTab('leads')} className="cursor-pointer bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="absolute right-0 top-0 w-16 h-16 md:w-24 md:h-24 bg-green-50 rounded-bl-full group-hover:scale-125 transition duration-700 origin-top-right"></div>
                   <div className="text-[9px] md:text-[10px] text-green-500 font-extrabold uppercase tracking-widest mb-2 md:mb-4 flex items-center gap-1">
                     Conversões Pendentes <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-3xl md:text-5xl font-extrabold text-green-600 tracking-tighter">{leads && leads.filter(l => l.status === 'Novo').length}</div>
                </div>

                <div onClick={() => setNotification({ title: "Eficiência do Escritório", message: "O sistema gerou 8.4 mil ações automáticas neste mês, poupando tempo valioso da sua equipe.", type: "success" })} className="cursor-pointer p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative group overflow-hidden hover:scale-[1.03] transition duration-500" style={{ backgroundColor: tenantConfig.primaryColor }}>
                   <div className="text-[9px] md:text-[10px] text-white/70 font-extrabold uppercase tracking-widest mb-2 md:mb-4">Eficiência</div>
                   <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter">8.4k</div>
                   <p className="text-[8px] md:text-[9px] text-white/50 mt-2 md:mt-3 font-extrabold uppercase tracking-wider">Avisos Proativos</p>
                </div>

              </div>

              {/* KANBAN BOARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {[
                  { id: 'peticao', title: 'Fase Inicial (Petição)', color: 'border-slate-300', items: groupedCases.peticao },
                  { id: 'analise_juiz', title: 'Em Andamento (Juiz)', color: 'border-slate-400', items: groupedCases.analise_juiz },
                  { id: 'sentenca', title: 'Concluído (Sentença)', color: 'border-green-400', items: groupedCases.sentenca }
                ].map(col => (
                  <div key={col.id} className="bg-slate-200/40 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200/50 min-h-[400px] md:min-h-[550px] flex flex-col gap-4 md:gap-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center px-2 md:px-4 mb-2">
                       <span className="font-extrabold text-slate-500 text-[10px] md:text-[11px] uppercase tracking-[0.1em] flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full border-2 ${col.color} bg-white`}></div>
                         {col.title}
                       </span>
                       <span className="bg-white text-slate-800 font-extrabold text-[10px] px-3 py-1 rounded-full shadow-sm border border-slate-200">{col.items.length}</span>
                    </div>
                    {col.items.map(c => (
                      <div key={c.id} className={`bg-white p-5 md:p-8 rounded-3xl shadow-sm border-l-[6px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 group relative overflow-hidden`} style={c.anxietyScore > 70 ? { borderLeftColor: '#ef4444' } : { borderLeftColor: tenantConfig.primaryColor }}>
                         <div className="flex justify-between items-start mb-4">
                           <span className="text-[8px] md:text-[9px] font-extrabold uppercase bg-slate-50 text-slate-500 px-3 py-1 rounded-full tracking-tighter">{c.status}</span>
                           
                           {/* BOTÃO DO RADAR DE ANSIEDADE */}
                           {c.anxietyScore > 70 && (
                             <button 
                               onClick={() => handleAnxietyClick(c.client)}
                               className="bg-red-50 p-1.5 rounded-full hover:bg-red-100 transition shadow-sm border border-red-100"
                               title="Clique para ver detalhes do alerta"
                             >
                               <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500 animate-pulse" />
                             </button>
                           )}
                         </div>
                         
                         <h3 className="font-extrabold text-slate-800 text-base md:text-lg mb-1 leading-tight tracking-tight transition hover:opacity-80 cursor-default" style={{ hover: { color: tenantConfig.primaryColor } }}>{c.client}</h3>
                         <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold mb-1 truncate">{c.title}</p>
                         
                         {/* MOSTRADOR DE NÚMERO DO PROCESSO */}
                         {c.processNumber && (
                            <p className="text-[9px] font-mono mb-4 truncate px-2 py-0.5 rounded inline-block bg-slate-100" style={{ color: tenantConfig.primaryColor }}>{c.processNumber}</p>
                         )}
                         {/* MOSTRADOR DE NOTAS */}
                         {c.notes && (
                            <p className="text-[9px] text-slate-400 italic mb-4 line-clamp-2 leading-relaxed">"{c.notes}"</p>
                         )}
                         
                         <div className="flex justify-between items-center pt-4 md:pt-5 border-t border-slate-50 gap-2 mt-auto">
                            <button 
                              onClick={() => handleAttendWhatsApp(c.phone || "11999999999", c.client)}
                              className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100 transition whitespace-nowrap"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </button>

                            {col.id !== 'sentenca' && (
                              <button onClick={() => handleMove(c.id)} className="text-[9px] md:text-[10px] font-extrabold px-3 md:px-4 py-2 rounded-xl transition-all duration-300 shadow-sm bg-slate-50 hover:bg-slate-100" style={{ color: tenantConfig.primaryColor }}>
                                Avançar ➔
                              </button>
                            )}
                         </div>
                      </div>
                    ))}
                    
                    {col.items.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-300/50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
                        Nenhum processo nesta fase
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// --- APP CONTROLLER PRINCIPAL (CONEXÃO REAL COM A NUVEM) ---
// ============================================================================
export default function App() {
  // 🚀 O SISTEMA INICIA DIRETAMENTE NO LOGIN AGORA (A visão LandingPage está desativada)
  const [currentView, setCurrentView] = useState('login'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // 🎨 CONFIGURAÇÃO WHITE-LABEL (Guarda na memória o escritório do utilizador)
  const [tenantConfig, setTenantConfig] = useStickyState({
    name: "Lopes & Associados",
    primaryColor: "#0f172a", // Cor Padrão (Slate 900)
    logoText: "LOPES JURIS",
    advogado: "Dr. Marcos Lopes"
  }, 'pascale_tenant_config');
  
  // Estados Globais
  const [cases, setCases] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [leads, setLeads] = useStickyState(DEFAULT_LEADS, 'pascale_leads');
  const [messages, setMessages] = useStickyState(DEFAULT_MESSAGES, 'pascale_messages');
  const [documents, setDocuments] = useStickyState(DEFAULT_DOCUMENTS, 'pascale_documents');
  const [globalNotifications, setGlobalNotifications] = useState([]);

  // Função de Logout centralizada
  const handleLogout = () => {
    localStorage.removeItem('pascale_token');
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  // 📡 FETCH DA NUVEM (COM ENVIO DE TOKEN DE SEGURANÇA)
  const fetchCloudData = async () => {
    setLoadingData(true);
    const token = localStorage.getItem('pascale_token');
    
    if (!token) {
      handleLogout();
      setLoadingData(false);
      return;
    }

    try {
      const casesRes = await fetch(`${API_URL}/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (casesRes.status === 401 || casesRes.status === 403) throw new Error("Token Invalido");

      if (casesRes.ok) {
        const data = await casesRes.json();
        if (data && data.length > 0) {
          setCases(data.map(dbCase => ({
            id: dbCase.id,
            title: dbCase.title,
            processNumber: dbCase.processNumber, 
            notes: dbCase.notes,                 
            status: dbCase.status,
            stage: dbCase.stage,
            client: dbCase.client?.name || 'Cliente Sem Nome',
            cpf: dbCase.client?.cpf || '',
            phone: dbCase.client?.phone || '',
            anxietyScore: dbCase.anxietyScore || 0,
            lastUpdate: 'Sincronizado',
            timeline: dbCase.timeline || []
          })));
        } else {
          setCases(DEFAULT_CASES);
        }
      }
      
      const finRes = await fetch(`${API_URL}/financials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (finRes.ok) {
        const fData = await finRes.json();
        if (fData && fData.length > 0) {
          setFinancials(fData.map(dbFin => ({ ...dbFin, client: dbFin.client?.name })));
        } else {
          setFinancials(DEFAULT_FINANCIALS);
        }
      }
    } catch (e) {
      if (e.message === "Token Invalido") {
        console.warn("🔒 Sessão expirada. Redirecionando para o Login.");
        handleLogout();
      } else {
        console.warn("Servidor API não alcançável. Usando modo offline.", e);
        setCases(DEFAULT_CASES);
        setFinancials(DEFAULT_FINANCIALS);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // 🛡️ Verifica se já existe um token salvo na memória ao abrir a app
    const savedToken = localStorage.getItem('pascale_token');
    if (savedToken) {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentView === 'dashboard') {
      fetchCloudData();
    }
  }, [isAuthenticated, currentView]);

  // ➕ SALVAR NOVO PROCESSO (COM ENVIO DE TOKEN DE SEGURANÇA)
  const addCaseToCloud = async (newCaseData) => {
    const token = localStorage.getItem('pascale_token');
    try {
      const response = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newCaseData)
      });
      
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return { success: false, error: "Sessão expirada." };
      }

      if (response.ok) {
        await fetchCloudData(); 
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || `Erro do Servidor HTTP: ${response.status}` };
      }
    } catch (e) {
      console.error("Erro de rede ao salvar processo:", e);
      return { success: false, error: "Falha de conexão. A nuvem da Render pode estar a despertar, tente novamente em 30 segundos." };
    }
  };

  // 🔄 MOVER PROCESSO (COM ENVIO DE TOKEN DE SEGURANÇA)
  const moveCaseInCloud = async (caseId, currentStage) => {
    const newStage = currentStage === 'peticao' ? 'analise_juiz' : 'sentenca';
    const newStatus = newStage === 'sentenca' ? 'Concluído' : 'Em Andamento';
    const token = localStorage.getItem('pascale_token');

    // UI Otimista
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, stage: newStage, status: newStatus } : c));

    try {
      const response = await fetch(`${API_URL}/cases/${caseId}/move`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage, status: newStatus })
      });
      
      if (response.status === 401 || response.status === 403) handleLogout();
    } catch (e) {
      console.error("Erro ao mover:", e);
    }
  };

  // ➕ LANÇAR FATURA (COM ENVIO DE TOKEN DE SEGURANÇA)
  const handleAddFinancial = async (finData) => {
    const token = localStorage.getItem('pascale_token');
    try {
      const response = await fetch(`${API_URL}/financials`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finData)
      });
      
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return { success: false, error: "Sessão expirada." };
      }

      if (response.ok) {
        await fetchCloudData(); 
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || `Erro do Servidor HTTP: ${response.status}` };
      }
    } catch (e) {
      console.error("Erro ao enviar fatura para API:", e);
      return { success: false, error: "Falha de conexão. A nuvem da Render pode estar a despertar." };
    }
  };

  const addLead = (newLead) => setLeads(prev => [newLead, ...prev]);
  const updateLeadStatus = (id, newStatus) => setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  const updateFinancial = (id, newStatus) => setFinancials(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  const handleSendMessage = (text, sender) => setMessages(prev => [...prev, { id: Date.now(), text, sender, time: 'Agora' }]);
  const handleUploadDocument = (docData) => setDocuments(prev => [{ id: Date.now(), name: docData.name, client: docData.client, date: "Hoje", size: "1.5 MB" }, ...prev]);
  const notifyLawyer = (message) => setGlobalNotifications(prev => [...prev, message]);

  // 🚀 ROTEADOR BLINDADO (Sem barra de controlo e forçando sempre as rotas de Advogado)
  const renderView = () => {
    if (currentView === 'dashboard' && isAuthenticated) {
      if (loadingData) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-white font-sans transition-colors duration-500" style={{ backgroundColor: tenantConfig.primaryColor }}>
            <Activity className="w-12 h-12 animate-spin mb-6 opacity-80" />
            <p className="font-extrabold uppercase text-xs animate-pulse opacity-80">A Sincronizar com a Nuvem...</p>
          </div>
        );
      }
      return <LawyerDashboard cases={cases} onMoveCase={(id) => moveCaseInCloud(id, cases.find(c=>c.id===id)?.stage)} onAddCase={addCaseToCloud} leads={leads} documents={documents} financials={financials} onUpdateFinancial={updateFinancial} onAddFinancial={handleAddFinancial} onAddDocument={handleUploadDocument} globalNotifications={globalNotifications} onLogout={handleLogout} onUpdateLead={updateLeadStatus} tenantConfig={tenantConfig} />;
    }

    // Se tentar aceder a qualquer outra coisa (como 'landing' ou 'portal') sem estar programado no switch, cai no Login Seguro.
    return <LoginPage onLogin={(newConfig) => { 
        if(newConfig) setTenantConfig(newConfig); 
        setIsAuthenticated(true); 
        setCurrentView('dashboard'); 
    }} tenantConfig={tenantConfig} />;
  };

  return (
    <div className="antialiased min-h-screen selection:bg-black/10 selection:text-black">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-in { animation: slide-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; }
      `}</style>
      
      {/* A Barra de Controlo Master (botões pretos do fundo) foi permanentemente removida desta versão para focar apenas na Visão do Advogado */}
      
      {renderView()}
    </div>
  );
}