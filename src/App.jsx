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

// --- CONFIGURAÇÃO DA NUVEM ---
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

const TENANT_CONFIG = {
  name: "Lopes & Associados",
  primaryColor: "bg-slate-900",
  secondaryColor: "text-slate-900",
  logoText: "LOPES JURIS",
  advogado: "Dr. Marcos Lopes"
};

// --- DADOS DE FALLBACK (Caso a internet falhe) ---
const DEFAULT_CASES = [
  {
    id: 1,
    client: "Carlos Silva",
    phone: "(11) 99999-9999",
    title: "Ação de Indenização vs Banco X",
    status: "Em Andamento",
    stage: "analise_juiz",
    anxietyScore: 85, 
    lastUpdate: "Há 2 dias",
    timeline: [
      { id: 1, title: "Petição Inicial", date: "10/01/2024", completed: true, desc: "Enviamos o seu pedido ao juiz." },
      { id: 2, title: "Citação do Réu", date: "15/01/2024", completed: true, desc: "O Banco foi notificado do processo." },
      { id: 3, title: "Análise do Juiz", date: "Hoje", completed: false, current: true, desc: "O juiz está analisando nossos argumentos. Isso demora em média 20 dias." },
      { id: 4, title: "Audiência", date: "Pendente", completed: false, desc: "Reunião para ouvir testemunhas." },
      { id: 5, title: "Sentença", date: "Pendente", completed: false, desc: "Decisão final do juiz." }
    ]
  }
];

const DEFAULT_LEADS = [
  { id: 1, name: "Roberto Justus", phone: "(11) 98888-7777", type: "Trabalhista", status: "Novo", date: "Há 10 min" },
  { id: 2, name: "Ana Maria", phone: "(21) 99999-8888", type: "Família", status: "Contatado", date: "Ontem" }
];

const DEFAULT_MESSAGES = [
  { id: 1, text: "Olá Carlos! Vi que acessou o portal. Tem alguma dúvida sobre a etapa atual?", sender: 'bot', time: '10:30' }
];

const DEFAULT_DOCUMENTS = [
  { id: 1, name: "Procuracao_Assinada.pdf", client: "Carlos Silva", date: "10/01/2024", size: "1.2 MB" }
];

const DEFAULT_FINANCIALS = [
  { id: 1, title: "Honorários Iniciais", client: "Carlos Silva", amount: 2500.00, dueDate: "2024-01-10", status: "Pago", type: "Pix" },
  { id: 2, title: "Parcela 2/10", client: "Carlos Silva", amount: 500.00, dueDate: "2024-02-10", status: "Atrasado", type: "Boleto" }
];

// --- HOOKS DE PERSISTÊNCIA LOCAL (Para Leads e Docs na Fase 1) ---
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
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

// Máscaras de Input Seguras
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
// 0. PÁGINA DE LOGIN
// ============================================================================
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(); 
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="bg-slate-800 p-8 text-center border-b-4 border-indigo-500">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
            <Gavel className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{TENANT_CONFIG.logoText}</h1>
          <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">Acesso Restrito</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Corporativo</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="advogado@lopes.pt"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition flex justify-center items-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Acessar o Sistema"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Login Demo: admin / admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 1. LANDING PAGE (SITE PÚBLICO)
// ============================================================================
// NOTA: Este componente está mantido no código, mas a rota de acesso
// foi comentada no roteador principal no final do arquivo.
const LandingPage = ({ onNavigate, onAddLead }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Cível' });
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawPhone = formData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      alert("Por favor, digite um número de celular válido com o DDD.");
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
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-900 cursor-pointer" onClick={() => onNavigate('login')}>
          <Gavel className="w-6 h-6" />
          {TENANT_CONFIG.logoText}
        </div>
        <button onClick={() => onNavigate('portal')} className="px-4 py-2 bg-indigo-100 text-indigo-900 rounded-lg font-medium hover:bg-indigo-200 transition">
          Área do Cliente
        </button>
      </header>

      <main className="flex-1">
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Iniciar Consulta Gratuita">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Celular</label>
              <input required type="tel" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Caso</label>
              <select className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Cível">Cível / Consumidor</option>
                <option value="Trabalhista">Trabalhista</option>
                <option value="Família">Família (Divórcio/Pensão)</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition">Enviar Pedido</button>
          </form>
        </Modal>

        <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 animate-fade-in">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold tracking-wide uppercase">ADVOCACIA DIGITAL</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">Seu processo jurídico, <span className="text-indigo-600">sem segredos.</span></h1>
            <p className="text-lg text-slate-600 leading-relaxed">Na {TENANT_CONFIG.name}, não precisa ligar para saber o que está acontecendo. Acompanhe cada passo do seu caso em tempo real pelo nosso aplicativo exclusivo.</p>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1">Iniciar Consulta</button>
              <button onClick={() => onNavigate('portal')} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-indigo-600 transition">Já sou Cliente</button>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full"></div>
              <div className="relative w-72 h-[550px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/20">
                <div className="absolute top-0 w-full h-full bg-slate-50 flex flex-col p-6 pt-12 space-y-4">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">L</div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Bem-vindo</div>
                        <div className="font-bold text-slate-800 text-sm tracking-tight">Carlos Silva</div>
                      </div>
                   </div>
                   <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-[10px] text-green-600 font-bold mb-1">MOVIMENTAÇÃO RECENTE</div>
                      <div className="font-bold text-slate-800 text-xs">Juiz recebeu documentos</div>
                      <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden"><div className="w-3/5 h-full bg-indigo-500"></div></div>
                   </div>
                   <div className="bg-indigo-600 p-4 rounded-xl shadow-lg text-white">
                      <div className="font-bold text-sm mb-1">Precisa de ajuda?</div>
                      <div className="text-[10px] opacity-80 mb-3 leading-tight">Fale com o seu advogado agora mesmo.</div>
                      <div className="w-full py-2 bg-white/10 rounded text-center text-xs font-bold">Abrir Chat</div>
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
// 2. PORTAL DO CLIENTE (ÁREA EXCLUSIVA)
// ============================================================================
// NOTA: Este componente está mantido no código, mas a rota de acesso
// foi comentada no roteador principal no final do arquivo.
const ClientPortal = ({ onNavigate, caseData, onNotifyLawyer, messages, onSendMessage, onUploadDocument, financials }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const chatEndRef = useRef(null);

  // Filtra faturas apenas do cliente logado (Demo: Carlos Silva)
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
      onNotifyLawyer("Novo Documento Recebido pelo Portal.");
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
      <Activity className="w-12 h-12 mb-4 text-slate-300 animate-spin" />
      <p>Aguardando dados da nuvem...</p>
      <button onClick={() => onNavigate('login')} className="mt-4 text-indigo-600 font-bold hover:underline">Voltar</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
      {showNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up">
          <UploadCloud className="w-5 h-5" />
          <span className="font-bold text-sm">Documento enviado com sucesso!</span>
        </div>
      )}

      {/* MODAL FINANCEIRO DO CLIENTE */}
      <Modal isOpen={financialOpen} onClose={() => setFinancialOpen(false)} title="Meu Financeiro">
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center mb-4 border border-indigo-100">
             <span className="text-sm font-bold text-indigo-900">Total Pendente</span>
             <span className="text-xl font-extrabold text-indigo-700">
               {formatCurrency(totalPendente)}
             </span>
          </div>
          <div className="space-y-3">
             {myFinancials.length > 0 ? myFinancials.map(fin => (
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
             )) : <p className="text-xs text-center text-slate-400">Nenhuma fatura encontrada.</p>}
          </div>
        </div>
      </Modal>

      {/* MODAL UPLOAD CLIENTE */}
      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Enviar Documento">
        {!isUploading ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer">
              <UploadCloud className="w-12 h-12 mb-2 text-indigo-300" />
              <p className="text-sm font-bold text-slate-600">Arraste o arquivo aqui</p>
              <p className="text-[10px]">PDF, JPG ou PNG (Max 10MB)</p>
            </div>
            <button onClick={handleUpload} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 uppercase tracking-wide text-xs">Confirmar Envio Seguro</button>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
             <p className="text-indigo-900 font-bold animate-pulse text-sm">Processando...</p>
          </div>
        )}
      </Modal>

      {/* CHAT DO PORTAL */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up md:max-w-md md:right-4 md:left-auto md:bottom-4 md:top-auto md:h-[600px] md:shadow-2xl md:rounded-2xl border-slate-200">
          <div className="bg-indigo-900 text-white p-4 flex justify-between items-center md:rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {TENANT_CONFIG.advogado.substring(4, 6).toUpperCase()}
              </div>
              <div><div className="font-bold text-sm leading-none mb-1">{TENANT_CONFIG.advogado}</div><div className="text-[10px] opacity-70 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Disponível agora</div></div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 bg-slate-100 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="text-[10px] text-slate-400 italic">{TENANT_CONFIG.advogado} está digitando...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t flex gap-2 md:rounded-b-2xl">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-100 rounded-full px-4 text-sm outline-none border border-transparent focus:border-indigo-500 transition" placeholder="Escreva a sua dúvida..." />
            <button onClick={handleSendMessage} className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0 transition hover:bg-indigo-700"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* HEADER DO PORTAL */}
      <div className={`${TENANT_CONFIG.primaryColor} text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg`}>
        <div className="flex justify-between items-center mb-8">
           <button onClick={() => onNavigate('login')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><ArrowRight className="w-5 h-5 rotate-180" /></button>
           <span className="font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Painel do Cliente</span>
           <div className="relative"><Bell className="w-5 h-5 opacity-70" /><div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-indigo-900"></div></div>
        </div>
        <div className="flex flex-col items-center">
           <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-xl ring-2 ring-white/10">
             {caseData.client ? caseData.client.substring(0,2).toUpperCase() : 'CS'}
           </div>
           <h1 className="text-2xl font-bold tracking-tight">Olá, {caseData.client}</h1>
           <p className="opacity-70 text-sm mt-1 font-medium">Seu processo está estável e monitorado.</p>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-fade-in relative overflow-hidden">
           <div className="absolute right-0 top-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full"></div>
           <div className="flex justify-between items-start mb-4">
             <div className="relative z-10">
               <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Ação Cível</span>
               <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight tracking-tight">{caseData.title}</h2>
               <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-tighter">PROC. {caseData.id.toString().slice(0,8)}</p>
             </div>
             <Activity className="w-5 h-5 text-green-500 animate-pulse" />
           </div>
           <div className="space-y-2 relative z-10">
             <div className="flex justify-between text-[11px] font-bold text-slate-500"><span>Evolução Estimada</span><span>60%</span></div>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner"><div className="w-[60%] h-full bg-indigo-500 rounded-full transition-all duration-1000"></div></div>
           </div>
        </div>

        {/* TIMELINE DO PROCESSO */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-indigo-600" /> Histórico de Etapas</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
            {caseData.timeline && caseData.timeline.length > 0 ? caseData.timeline.map((step) => (
              <div key={step.id} className="relative z-10 flex gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-white transition-all duration-500 ${step.completed ? 'border-green-500 text-green-500 bg-green-50/50' : step.isCurrent ? 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
                  {step.completed ? <CheckCircle className="w-3 h-3 fill-current" /> : step.isCurrent ? <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div> : null}
                </div>
                <div className={`${step.isCurrent || step.completed ? 'opacity-100' : 'opacity-60'}`}>
                  <h4 className="font-bold text-slate-800 text-sm tracking-tight">{step.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">{step.date}</span>
                  <p className="text-xs text-slate-600 leading-snug bg-slate-50 p-3 rounded-xl mt-2 border border-slate-100/50">{step.description || step.desc || "Aguardando atualização..."}</p>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 text-center">Nenhum histórico registrado ainda.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setChatOpen(true)} className="p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex flex-col items-center gap-2 text-xs transition active:scale-95"><MessageSquare className="w-5 h-5" /> Falar com Advogado</button>
          <button onClick={() => setFinancialOpen(true)} className="p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex flex-col items-center gap-2 text-xs hover:border-indigo-500 transition active:scale-95"><DollarSign className="w-5 h-5 text-green-600" /> Ver Pagamentos</button>
        </div>
        <button onClick={() => setUploadOpen(true)} className="w-full p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition active:scale-95"><UploadCloud className="w-5 h-5 text-indigo-500" /> Enviar Arquivo Digital</button>
      </div>
    </div>
  );
};


// ============================================================================
// 3. PAINEL DO ADVOGADO (DASHBOARD COMPLETO E ATIVO)
// ============================================================================
const LawyerDashboard = ({ onNavigate, cases, onMoveCase, onAddCase, leads, documents, financials, onUpdateFinancial, onAddFinancial, onAddDocument, globalNotifications, onLogout, onUpdateLead }) => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [notification, setNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // OTIMIZAÇÃO: useMemo para não recalcular clientes a cada digitação
  const activeClients = useMemo(() => {
    return Array.from(new Set(cases.map(c => typeof c.client === 'object' ? c.client?.name : c.client))).filter(Boolean);
  }, [cases]);

  // OTIMIZAÇÃO: useMemo para cálculos financeiros 
  const { totalRevenue, openRevenue, lateRevenue } = useMemo(() => {
    return {
      totalRevenue: financials.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + curr.amount, 0),
      openRevenue: financials.filter(f => f.status === 'Aberto').reduce((acc, curr) => acc + curr.amount, 0),
      lateRevenue: financials.filter(f => f.status === 'Atrasado').reduce((acc, curr) => acc + curr.amount, 0),
    };
  }, [financials]);

  // OTIMIZAÇÃO: Agrupamento Kanban único
  const groupedCases = useMemo(() => ({
    peticao: cases.filter(c => c.stage === 'peticao'),
    analise_juiz: cases.filter(c => c.stage === 'analise_juiz'),
    sentenca: cases.filter(c => c.stage === 'sentenca')
  }), [cases]);

  // Estados dos Modais e Loading
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isAddFinModalOpen, setIsAddFinModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [isSavingFin, setIsSavingFin] = useState(false);

  // Estados dos Formulários com CPF
  const [newCaseData, setNewCaseData] = useState({ client: '', cpf: '', phone: '', title: '' });
  const [newDocData, setNewDocData] = useState({ name: '', client: '' });
  
  // Estado Inteligente para o Financeiro
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
    setNotification({ title: "Financeiro", message: "Pagamento registrado com sucesso.", type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAttendWhatsApp = (phone, name) => {
    const phoneDigits = phone.replace(/\D/g, '');
    const message = `Olá, ${name}! Aqui é do escritório ${TENANT_CONFIG.name}. Tudo bem? Estou entrando em contato sobre o seu processo.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phoneDigits}?text=${encodedMessage}`, '_blank');
  };

  const handleAttendLead = (lead) => {
    if (lead.status === 'Novo') {
      onUpdateLead(lead.id, 'Contatado');
    }
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const message = `Olá, ${lead.name}! Recebemos o seu contato através do nosso portal jurídico referente à área de ${lead.type}. Como podemos te ajudar hoje?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phoneDigits}?text=${encodedMessage}`, '_blank');
    
    setNotification({ title: "Atendimento Iniciado", message: `Abrindo WhatsApp para ${lead.name}...`, type: "success" });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAnxietyClick = (clientName) => {
    setNotification({ 
      title: "Alerta de Ansiedade - " + clientName, 
      message: "Este cliente demonstra um nível alto de ansiedade. Priorize o envio de uma atualização pelo WhatsApp para tranquilizá-lo.", 
      type: "warning" 
    });
    setTimeout(() => setNotification(null), 7000);
  };

  // --- FUNÇÕES DE SUBMISSÃO COM LOADING REAL (SEM EFEITO FANTASMA) ---

  const handleAddNewCase = async (e) => {
    e.preventDefault();
    const rawPhone = newCaseData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setNotification({ title: "Telefone Inválido", message: "Por favor, digite apenas números, incluindo o DDD.", type: "warning" });
      setTimeout(() => setNotification(null), 4000);
      return; 
    }

    setIsSavingCase(true); // Gira o loading
    const result = await onAddCase(newCaseData); // Espera a nuvem responder
    setIsSavingCase(false); // Para o loading

    if (result && result.success === false) {
      // MOSTRA O ERRO EXATO DA API
      setNotification({ title: "Falha ao Salvar", message: result.error, type: "warning" });
      setTimeout(() => setNotification(null), 6000);
    } else {
      setIsAddCaseModalOpen(false);
      setNewCaseData({ client: '', cpf: '', phone: '', title: '' });
      setNotification({ title: "Processo Cadastrado", message: "Gravado na Nuvem com sucesso.", type: "success" });
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

    setIsSavingFin(true); // Loading
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
    setNotification({ title: "Arquivo Salvo", message: "O documento foi anexado ao cliente com sucesso.", type: "success" });
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

      {/* Modal Novo Processo com CPF */}
      <Modal isOpen={isAddCaseModalOpen} onClose={() => setIsAddCaseModalOpen(false)} title="Cadastrar Novo Processo (Nuvem)">
        <form onSubmit={handleAddNewCase} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo do Cliente</label>
            <input required autoFocus className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="Ex: João da Silva" value={newCaseData.client} onChange={e => setNewCaseData({...newCaseData, client: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="000.000.000-00" value={newCaseData.cpf} onChange={e => setNewCaseData({...newCaseData, cpf: applyCpfMask(e.target.value)})} />
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                <input required type="tel" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="(11) 99999-9999" value={newCaseData.phone} onChange={e => setNewCaseData({...newCaseData, phone: applyPhoneMask(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assunto / Título da Ação</label>
            <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="Ex: Usucapião Imóvel X" value={newCaseData.title} onChange={e => setNewCaseData({...newCaseData, title: e.target.value})} />
          </div>
          <button type="submit" disabled={isSavingCase} className={`w-full py-3 mt-4 text-white rounded-lg font-bold shadow-lg transition flex justify-center items-center ${isSavingCase ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {isSavingCase ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Salvar e Adicionar ao Painel"}
          </button>
        </form>
      </Modal>

      {/* Modal Nova Fatura Inteligente */}
      <Modal isOpen={isAddFinModalOpen} onClose={() => setIsAddFinModalOpen(false)} title="Lançar Nova Fatura (Nuvem)">
        <form onSubmit={handleAddNewFin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
            <select required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={newFinData.client} onChange={e => setNewFinData({...newFinData, client: e.target.value})}>
              <option value="">Selecione um cliente ativo...</option>
              {activeClients.map(clientName => (
                <option key={clientName} value={clientName}>{clientName}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Cobrança</label>
            <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={finChargeType} onChange={e => setFinChargeType(e.target.value)}>
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
                <input required type="number" min="1" max={finTotalInstallments} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={finCurrentInstallment} onChange={e => setFinCurrentInstallment(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">De (Total)</label>
                <input required type="number" min="2" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={finTotalInstallments} onChange={e => setFinTotalInstallments(e.target.value)} />
              </div>
            </div>
          )}

          {finChargeType === 'Outro' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição Livre</label>
              <input required autoFocus className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="Ex: Custas Judiciais / Emissão Documentos" value={finCustomTitle} onChange={e => setFinCustomTitle(e.target.value)} />
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="1500.00" value={newFinData.amount} onChange={e => setNewFinData({...newFinData, amount: e.target.value})} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento</label>
              <input required type="date" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={newFinData.dueDate} onChange={e => setNewFinData({...newFinData, dueDate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forma de Pagamento</label>
            <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={newFinData.type} onChange={e => setNewFinData({...newFinData, type: e.target.value})}>
              <option value="Boleto">Boleto</option>
              <option value="Pix">Pix</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>
          <button type="submit" disabled={isSavingFin} className={`w-full py-3 mt-4 text-white rounded-lg font-bold shadow-lg transition flex justify-center items-center ${isSavingFin ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            {isSavingFin ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Lançar Cobrança"}
          </button>
        </form>
      </Modal>

      {/* Modal Novo Documento */}
      <Modal isOpen={isAddDocModalOpen} onClose={() => setIsAddDocModalOpen(false)} title="Upload de Arquivo">
        <form onSubmit={handleAddNewDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
            <select required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={newDocData.client} onChange={e => setNewDocData({...newDocData, client: e.target.value})}>
              <option value="">Selecione um cliente ativo...</option>
              {activeClients.map(clientName => (
                <option key={clientName} value={clientName}>{clientName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Arquivo</label>
            <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" placeholder="Ex: Contrato_Assinado.pdf" value={newDocData.name} onChange={e => setNewDocData({...newDocData, name: e.target.value})} />
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition">
             <UploadCloud className="w-8 h-8 mb-2 text-indigo-300" />
             <p className="text-xs font-bold">Anexar arquivo falso para teste</p>
          </div>
          <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition">
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

      {/* SIDEBAR DO ADVOGADO */}
      <aside className={`fixed md:relative z-[70] h-full w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/50"><Gavel className="w-5 h-5 text-white" /></div>
            <span className="font-extrabold text-white tracking-tighter text-lg">{TENANT_CONFIG.logoText}</span>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <button onClick={() => { setActiveTab('kanban'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 translate-x-1' : 'hover:bg-slate-800'}`}><Activity className="w-5 h-5" /> <span className="text-sm font-bold">Painel de Gestão</span></button>
          <button onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'leads' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800'}`}><Users className="w-5 h-5" /> <span className="text-sm font-bold flex-1 text-left">Novos Leads</span> {leads && leads.length > 0 && <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-extrabold text-white">{leads.length}</span>}</button>
          <button onClick={() => { setActiveTab('docs'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'docs' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800'}`}><FileText className="w-5 h-5" /> <span className="text-sm font-bold flex-1 text-left">Documentação</span></button>
          <button onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800'}`}><DollarSign className="w-5 h-5" /> <span className="text-sm font-bold text-left">Controle Financeiro</span></button>
        </nav>
        <div className="p-6 border-t border-slate-800"><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:text-white transition opacity-60 hover:bg-red-500/10 hover:text-red-400 hover:opacity-100"><LogOut className="w-4 h-4" /> Sair do Sistema</button></div>
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
              <button onClick={() => setIsAddCaseModalOpen(true)} className="bg-indigo-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 text-sm">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Processo</span>
              </button>
            )}
            {activeTab === 'finance' && (
              <button onClick={() => setIsAddFinModalOpen(true)} className="bg-green-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95 text-sm">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova Fatura</span>
              </button>
            )}
            {activeTab === 'docs' && (
              <button onClick={() => setIsAddDocModalOpen(true)} className="bg-indigo-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 text-sm">
                <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Upload Arquivo</span>
              </button>
            )}

            <div className="hidden md:flex flex-col text-right border-l pl-6 border-slate-200">
              <span className="text-sm font-extrabold text-slate-800">{TENANT_CONFIG.advogado}</span>
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Acesso Seguro</span>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg border-2 border-slate-800 shadow-sm">
              {TENANT_CONFIG.advogado.substring(4, 6).toUpperCase()}
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
                         <td className="p-4 md:p-8"><span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-tighter">{lead.type}</span></td>
                         <td className="p-4 md:p-8 text-slate-400 font-medium">{lead.date}</td>
                         <td className="p-4 md:p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase ${lead.status === 'Novo' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>{lead.status}</span></td>
                         <td className="p-4 md:p-8 text-right">
                           <button 
                             onClick={() => handleAttendLead(lead)} 
                             className={`${lead.status === 'Novo' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/10' : 'bg-green-500 hover:bg-green-600 shadow-green-900/10'} text-white font-extrabold px-4 md:px-5 py-2.5 rounded-xl text-[10px] transition shadow-lg flex items-center gap-2 ml-auto`}
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
                         <td className="p-4 md:p-8 font-bold text-slate-800 flex items-center gap-3 md:gap-4"><div className="p-2 bg-indigo-50 rounded-lg"><File className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" /></div> {doc.name}</td>
                         <td className="p-4 md:p-8 text-slate-600 font-medium">{doc.client}</td>
                         <td className="p-4 md:p-8 text-slate-500 font-medium">{doc.date}</td>
                         <td className="p-4 md:p-8 text-slate-400 text-[10px] font-extrabold uppercase tracking-tighter">{doc.size}</td>
                         <td className="p-4 md:p-8 text-right"><button className="text-indigo-600 font-extrabold hover:bg-indigo-50 px-3 md:px-5 py-2.5 rounded-xl text-[10px] transition-all border-2 border-transparent hover:border-indigo-100 flex items-center gap-2 ml-auto shadow-sm"><Download className="w-4 h-4" /> <span className="hidden sm:inline">Baixar</span></button></td>
                       </tr>
                     ))}
                   </tbody>
                </table>
            </div>
          ) : (
            <div className="animate-fade-in space-y-8 md:space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                
                {/* O Bloco de Processos em Carteira */}
                <div className="cursor-pointer bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute right-0 top-0 w-16 h-16 md:w-24 md:h-24 bg-indigo-50 rounded-bl-full group-hover:scale-125 transition duration-700 origin-top-right"></div>
                  <div className="text-[9px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-2 md:mb-4">Processos em Carteira</div>
                  <div className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tighter">{cases.length}</div>
                </div>
                
                {/* O Bloco de Estatística de Ansiedade */}
                <div className="cursor-pointer bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="absolute right-0 top-0 w-16 h-16 md:w-24 md:h-24 bg-red-50 rounded-bl-full group-hover:scale-125 transition duration-700 opacity-60 origin-top-right"></div>
                   <div className="text-[9px] md:text-[10px] text-red-500 font-extrabold uppercase tracking-widest mb-2 md:mb-4 flex items-center gap-1">
                     Índice de Ansiedade <AlertTriangle className="w-3 h-3" />
                   </div>
                   <div className="text-3xl md:text-5xl font-extrabold text-red-600 tracking-tighter">{cases.filter(c => c.anxietyScore > 70).length}</div>
                </div>
                
                {/* O Bloco de Conversões Pendentes */}
                <div onClick={() => setActiveTab('leads')} className="cursor-pointer bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="absolute right-0 top-0 w-16 h-16 md:w-24 md:h-24 bg-green-50 rounded-bl-full group-hover:scale-125 transition duration-700 origin-top-right"></div>
                   <div className="text-[9px] md:text-[10px] text-green-500 font-extrabold uppercase tracking-widest mb-2 md:mb-4 flex items-center gap-1">
                     Conversões Pendentes <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-3xl md:text-5xl font-extrabold text-green-600 tracking-tighter">{leads && leads.filter(l => l.status === 'Novo').length}</div>
                </div>

                {/* O Bloco de Eficiência */}
                <div className="cursor-pointer bg-indigo-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative group overflow-hidden hover:scale-[1.03] transition duration-500">
                   <div className="text-[9px] md:text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mb-2 md:mb-4">Eficiência</div>
                   <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter">8.4k</div>
                   <p className="text-[8px] md:text-[9px] text-indigo-400 mt-2 md:mt-3 font-extrabold uppercase tracking-wider">Avisos Proativos</p>
                </div>

              </div>

              {/* KANBAN BOARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {[
                  { id: 'peticao', title: 'Fase Inicial (Petição)', color: 'border-slate-300', items: groupedCases.peticao },
                  { id: 'analise_juiz', title: 'Em Andamento (Juiz)', color: 'border-indigo-400', items: groupedCases.analise_juiz },
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
                      <div key={c.id} className={`bg-white p-5 md:p-8 rounded-3xl shadow-sm border-l-[6px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 group relative overflow-hidden ${c.anxietyScore > 70 ? 'border-l-red-500' : 'border-l-indigo-600'}`}>
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
                         
                         <h3 className="font-extrabold text-slate-800 text-base md:text-lg mb-1 leading-tight tracking-tight group-hover:text-indigo-600 transition">{c.client}</h3>
                         <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold mb-5 md:mb-6 truncate">{c.title}</p>
                         
                         <div className="flex justify-between items-center pt-4 md:pt-5 border-t border-slate-50 gap-2">
                            {/* Botão de WhatsApp */}
                            <button 
                              onClick={() => handleAttendWhatsApp(c.phone || "11999999999", c.client)}
                              className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100 transition whitespace-nowrap"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </button>

                            {/* Botão Avançar Fase */}
                            {col.id !== 'sentenca' && (
                              <button onClick={() => handleMove(c.id)} className="text-[9px] md:text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 shadow-sm hover:bg-indigo-100">
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
  // 🚀 FORÇA O INÍCIO NO LOGIN PARA BLOQUEAR ACESSO PÚBLICO
  const [currentView, setCurrentView] = useState('login'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Estados Globais
  const [cases, setCases] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [leads, setLeads] = useStickyState(DEFAULT_LEADS, 'pascale_leads');
  const [messages, setMessages] = useStickyState(DEFAULT_MESSAGES, 'pascale_messages');
  const [documents, setDocuments] = useStickyState(DEFAULT_DOCUMENTS, 'pascale_documents');
  const [globalNotifications, setGlobalNotifications] = useState([]);

  // 📡 FETCH DA NUVEM (Só roda quando o advogado faz login)
  const fetchCloudData = async () => {
    setLoadingData(true);
    try {
      const resCases = await fetch(`${API_URL}/cases`);
      if (resCases.ok) {
        const data = await resCases.json();
        if (data.length > 0) {
          setCases(data.map(dbCase => ({
            id: dbCase.id,
            title: dbCase.title,
            status: dbCase.status,
            stage: dbCase.stage,
            client: dbCase.client?.name || 'Cliente Sem Nome',
            cpf: dbCase.client?.cpf || '',
            phone: dbCase.client?.phone || '',
            lastUpdate: 'Sincronizado',
            timeline: dbCase.timeline || []
          })));
        } else {
          setCases(DEFAULT_CASES);
        }
      }
      
      const resFin = await fetch(`${API_URL}/financials`);
      if (resFin.ok) {
        const fData = await resFin.json();
        if (fData.length > 0) {
          setFinancials(fData.map(dbFin => ({ ...dbFin, client: dbFin.client?.name })));
        } else {
          setFinancials(DEFAULT_FINANCIALS);
        }
      }
    } catch (e) {
      console.warn("Servidor API não alcançável. Usando modo offline.", e);
      setCases(DEFAULT_CASES);
      setFinancials(DEFAULT_FINANCIALS);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentView === 'dashboard') {
      fetchCloudData();
    }
  }, [isAuthenticated, currentView]);

  // ➕ POST: CRIAR NOVO PROCESSO NA NUVEM COM PROTEÇÃO ANTI-FANTASMA
  const addCaseToCloud = async (newCaseData) => {
    try {
      const response = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaseData)
      });
      
      if (response.ok) {
        await fetchCloudData(); // Só mostra na tela depois que o banco de dados confirma
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

  // 🔄 PATCH: MOVER PROCESSO NA NUVEM
  const moveCaseInCloud = async (caseId, currentStage) => {
    const newStage = currentStage === 'peticao' ? 'analise_juiz' : 'sentenca';
    const newStatus = newStage === 'sentenca' ? 'Concluído' : 'Em Andamento';

    // Para movimento de cartões, mantemos a UI otimista por fluidez
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, stage: newStage, status: newStatus } : c));

    try {
      await fetch(`${API_URL}/cases/${caseId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, status: newStatus })
      });
    } catch (e) {
      console.error("Erro ao mover:", e);
    }
  };

  // ➕ POST: NOVA FATURA COM PROTEÇÃO ANTI-FANTASMA
  const handleAddFinancial = async (finData) => {
    try {
      const response = await fetch(`${API_URL}/financials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finData)
      });
      
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

  // Funções Locais Complementares
  const addLead = (newLead) => setLeads(prev => [newLead, ...prev]);
  const updateLeadStatus = (id, newStatus) => setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  const updateFinancial = (id, newStatus) => setFinancials(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  const handleSendMessage = (text, sender) => setMessages(prev => [...prev, { id: Date.now(), text, sender, time: 'Agora' }]);
  const handleUploadDocument = (docData) => setDocuments(prev => [{ id: Date.now(), name: docData.name, client: docData.client, date: "Hoje", size: "1.5 MB" }, ...prev]);
  const notifyLawyer = (message) => setGlobalNotifications(prev => [...prev, message]);

  // 🚀 ROTEADOR FECHADO PARA PRODUÇÃO
  const renderView = () => {
    
    // Área logada do Advogado
    if (currentView === 'dashboard' && isAuthenticated) {
      if (loadingData) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
            <Activity className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <p className="font-extrabold uppercase text-xs animate-pulse text-indigo-200">A Sincronizar com a Nuvem...</p>
          </div>
        );
      }
      return <LawyerDashboard cases={cases} onMoveCase={(id) => moveCaseInCloud(id, cases.find(c=>c.id===id)?.stage)} onAddCase={addCaseToCloud} leads={leads} documents={documents} financials={financials} onUpdateFinancial={updateFinancial} onAddFinancial={handleAddFinancial} onAddDocument={handleUploadDocument} globalNotifications={globalNotifications} onLogout={() => { setIsAuthenticated(false); setCurrentView('login'); }} onUpdateLead={updateLeadStatus} />;
    }

    // --- CÓDIGO MANTIDO MAS COMENTADO (FASE 2) ---
    /*
    if (currentView === 'portal') {
      return <ClientPortal onNavigate={setCurrentView} caseData={cases[0]} onNotifyLawyer={notifyLawyer} messages={messages} onSendMessage={handleSendMessage} onUploadDocument={handleUploadDocument} financials={financials} />;
    }
    if (currentView === 'landing') {
      return <LandingPage onNavigate={setCurrentView} onAddLead={addLead} />;
    }
    */

    // Se tentar aceder a qualquer outra coisa ou não estiver logado, cai no Login.
    return <LoginPage onLogin={() => { setIsAuthenticated(true); setCurrentView('dashboard'); }} />;
  };

  return (
    <div className="antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-in { animation: slide-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
      `}</style>
      
      {/* --- BARRA DE CONTROLO MASTER COMENTADA (FASE 2) --- */}
      {/* <div className="fixed bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-auto z-[200] bg-slate-950/90 backdrop-blur-2xl text-white px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[2rem] shadow-2xl flex justify-center md:justify-start gap-2 md:gap-8 text-[9px] md:text-[11px] font-extrabold border border-white/10 items-center ring-1 ring-white/20">
        <span className="hidden md:inline text-slate-600 uppercase tracking-[0.3em] border-r border-slate-800 pr-8 py-1">Controlo Master</span>
        <button onClick={() => setCurrentView('landing')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'landing' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>1. SITE</button>
        <button onClick={() => setCurrentView('portal')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'portal' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>2. PORTAL</button>
        <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'dashboard' || currentView === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>3. PAINEL</button>
      </div>
      */}

      {renderView()}
    </div>
  );
}