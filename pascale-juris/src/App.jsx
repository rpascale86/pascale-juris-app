import React, { useState, useEffect, useRef } from 'react';
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

// --- CONFIGURAÇÃO E DADOS INICIAIS DE DEMONSTRAÇÃO ---

const TENANT_CONFIG = {
  name: "Lopes & Associados",
  primaryColor: "bg-indigo-900",
  secondaryColor: "text-indigo-900",
  logoText: "LOPES JURIS",
  whatsapp: "(11) 99999-9999"
};

const DEFAULT_CASES = [
  {
    id: 1,
    client: "Carlos Silva",
    title: "Acção de Indemnização vs Banco X",
    status: "Em Andamento",
    stage: "analise_juiz",
    anxietyScore: 85, 
    lastUpdate: "Há 2 dias",
    nextStep: "Aguardar despacho",
    timeline: [
      { id: 1, title: "Petição Inicial", date: "10/01/2024", completed: true, desc: "Enviámos o seu pedido ao juiz." },
      { id: 2, title: "Citação do Réu", date: "15/01/2024", completed: true, desc: "O Banco foi notificado do processo." },
      { id: 3, title: "Análise do Juiz", date: "Hoje", completed: false, current: true, desc: "O juiz está a analisar os nossos argumentos. Isto demora em média 20 dias." },
      { id: 4, title: "Audiência", date: "Pendente", completed: false, desc: "Reunião para ouvir testemunhas." },
      { id: 5, title: "Sentença", date: "Pendente", completed: false, desc: "Decisão final do juiz." }
    ]
  },
  {
    id: 2,
    client: "Mariana Souza",
    title: "Divórcio Consensual",
    status: "A Finalizar",
    stage: "sentenca",
    anxietyScore: 10,
    lastUpdate: "Há 1 hora",
    nextStep: "Averbação",
    timeline: []
  },
  {
    id: 3,
    client: "Tech Solutions LTDA",
    title: "Recuperação Fiscal",
    status: "Inicial",
    stage: "peticao",
    anxietyScore: 40,
    lastUpdate: "Há 5 dias",
    nextStep: "Protocolo",
    timeline: []
  }
];

const DEFAULT_LEADS = [
  { id: 1, name: "Roberto Justus", phone: "(11) 98888-7777", type: "Laboral", status: "Novo", date: "Há 10 min" },
  { id: 2, name: "Ana Maria", phone: "(21) 99999-8888", type: "Família", status: "Contactado", date: "Ontem" }
];

const DEFAULT_MESSAGES = [
  { id: 1, text: "Olá Carlos! Vi que acedeu ao portal. Tem alguma dúvida sobre a etapa actual?", sender: 'bot', time: '10:30' }
];

const DEFAULT_DOCUMENTS = [
  { id: 1, name: "Procuração_Assinada.pdf", client: "Carlos Silva", date: "10/01/2024", size: "1.2 MB" }
];

const DEFAULT_FINANCIALS = [
  { id: 1, title: "Honorários Iniciais", client: "Carlos Silva", amount: 2500.00, dueDate: "10/01/2024", status: "Pago", type: "Pix" },
  { id: 2, title: "Parcela 2/10", client: "Carlos Silva", amount: 500.00, dueDate: "10/02/2024", status: "Atrasado", type: "Boleto" },
  { id: 3, title: "Parcela 3/10", client: "Carlos Silva", amount: 500.00, dueDate: "10/03/2024", status: "Aberto", type: "Boleto" },
  { id: 4, title: "Honorários Finais", client: "Mariana Souza", amount: 1200.00, dueDate: "15/02/2024", status: "Aberto", type: "Cartão" },
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

// --- COMPONENTES DE INTERFACE ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// 0. PÁGINA DE LOGIN
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
        <div className="bg-indigo-900 p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            <Gavel className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">{TENANT_CONFIG.logoText}</h1>
          <p className="text-indigo-200 text-sm">Acesso Restrito ao Corpo Jurídico</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Corporativo</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="advogado@lopes.pt"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Palavra-passe</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition flex justify-center items-center"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Aceder ao Sistema"}
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

// 1. LANDING PAGE (Site Público)
const LandingPage = ({ onNavigate, onAddLead }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Cível' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddLead({
      id: Date.now(),
      name: formData.name,
      phone: formData.phone,
      type: formData.type,
      status: "Novo",
      date: "Agora mesmo"
    });
    setFormData({ name: '', phone: '', type: 'Cível' });
    setIsModalOpen(false);
    alert("Solicitação enviada com sucesso! O Dr. Marcos Lopes recebeu o seu contacto.");
  };

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen flex flex-col">
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
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telemóvel</label>
              <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="9xx xxx xxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Caso</label>
              <select className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Laboral">Laboral</option>
                <option value="Cível">Cível / Consumidor</option>
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
            <p className="text-lg text-slate-600 leading-relaxed">Na {TENANT_CONFIG.name}, não precisa de telefonar para saber o que está a acontecer. Acompanhe cada passo do seu caso em tempo real pela nossa aplicação exclusiva.</p>
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

// 2. PORTAL DO CLIENTE
const ClientPortal = ({ onNavigate, caseData, onNotifyLawyer, messages, onSendMessage, onUploadDocument, financials }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

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
      onUploadDocument("Documento_Carlos_Silva.pdf");
      onNotifyLawyer("Novo Documento Recebido de Carlos Silva.");
      alert("Enviado com sucesso!");
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
      onNotifyLawyer("Mensagem de Carlos Silva no chat.");
    }, 1500);
  };

  const myFinancials = financials.filter(f => f.client === "Carlos Silva");

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
      <Modal isOpen={financialOpen} onClose={() => setFinancialOpen(false)} title="Financeiro">
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center mb-4 border border-indigo-100">
             <span className="text-sm font-bold text-indigo-900">Total Pendente</span>
             <span className="text-xl font-extrabold text-indigo-700">
               {formatCurrency(myFinancials.filter(f => f.status !== 'Pago').reduce((acc, curr) => acc + curr.amount, 0))}
             </span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
             {myFinancials.map(fin => (
               <div key={fin.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center bg-white shadow-sm">
                 <div>
                   <div className="font-bold text-slate-800 text-sm tracking-tight">{fin.title}</div>
                   <div className="text-[10px] text-slate-400">Vencimento: {fin.dueDate}</div>
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
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer">
              <UploadCloud className="w-12 h-12 mb-2 text-indigo-300" />
              <p className="text-sm font-bold text-slate-600">Arraste o ficheiro aqui</p>
              <p className="text-[10px]">PDF, JPG ou PNG (Max 10MB)</p>
            </div>
            <button onClick={handleUpload} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 uppercase tracking-wide text-xs">Confirmar Envio Seguro</button>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
             <p className="text-indigo-900 font-bold animate-pulse text-sm">A processar...</p>
          </div>
        )}
      </Modal>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up md:max-w-md md:right-4 md:left-auto md:bottom-4 md:top-auto md:h-[600px] md:shadow-2xl md:rounded-2xl border-slate-200">
          <div className="bg-indigo-900 text-white p-4 flex justify-between items-center md:rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">ML</div>
              <div><div className="font-bold text-sm leading-none mb-1">Dr. Marcos Lopes</div><div className="text-[10px] opacity-70 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Disponível agora</div></div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 bg-slate-100 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="text-[10px] text-slate-400 italic">Dr. Marcos está a escrever...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t flex gap-2 md:rounded-b-2xl">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-100 rounded-full px-4 text-sm outline-none border border-transparent focus:border-indigo-500 transition" placeholder="Escreva a sua dúvida..." />
            <button onClick={handleSendMessage} className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0 transition hover:bg-indigo-700"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className={`${TENANT_CONFIG.primaryColor} text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg`}>
        <div className="flex justify-between items-center mb-8">
           <button onClick={() => onNavigate('landing')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><ArrowRight className="w-5 h-5 rotate-180" /></button>
           <span className="font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Painel do Cliente</span>
           <div className="relative"><Bell className="w-5 h-5 opacity-70" /><div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-indigo-900"></div></div>
        </div>
        <div className="flex flex-col items-center">
           <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-xl ring-2 ring-white/10">CS</div>
           <h1 className="text-2xl font-bold tracking-tight">Olá, Carlos Silva</h1>
           <p className="opacity-70 text-sm mt-1 font-medium">O seu processo está estável e monitorizado.</p>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-fade-in relative overflow-hidden">
           <div className="absolute right-0 top-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full"></div>
           <div className="flex justify-between items-start mb-4">
             <div className="relative z-10">
               <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Acção Cível</span>
               <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight tracking-tight">{caseData.title}</h2>
               <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-tighter">PROC. 00123.45.2024.PT</p>
             </div>
             <Activity className="w-5 h-5 text-green-500 animate-pulse" />
           </div>
           <div className="space-y-2 relative z-10">
             <div className="flex justify-between text-[11px] font-bold text-slate-500"><span>Evolução Estimada</span><span>60%</span></div>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner"><div className="w-[60%] h-full bg-indigo-500 rounded-full transition-all duration-1000"></div></div>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-indigo-600" /> Histórico de Etapas</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
            {caseData.timeline.map((step) => (
              <div key={step.id} className="relative z-10 flex gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-white transition-all duration-500 ${step.completed ? 'border-green-500 text-green-500 bg-green-50/50' : step.current ? 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
                  {step.completed ? <CheckCircle className="w-3 h-3 fill-current" /> : step.current ? <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div> : null}
                </div>
                <div className={`${step.current ? 'opacity-100' : 'opacity-60'}`}>
                  <h4 className="font-bold text-slate-800 text-sm tracking-tight">{step.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">{step.date}</span>
                  <p className="text-xs text-slate-600 leading-snug bg-slate-50 p-3 rounded-xl mt-2 border border-slate-100/50">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setChatOpen(true)} className="p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex flex-col items-center gap-2 text-xs transition active:scale-95"><MessageSquare className="w-5 h-5" /> Falar com Dr. Marcos</button>
          <button onClick={() => setFinancialOpen(true)} className="p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex flex-col items-center gap-2 text-xs hover:border-indigo-500 transition active:scale-95"><DollarSign className="w-5 h-5 text-green-600" /> Ver Pagamentos</button>
        </div>
        <button onClick={() => setUploadOpen(true)} className="w-full p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition active:scale-95"><UploadCloud className="w-5 h-5 text-indigo-500" /> Enviar Documento Digital</button>
      </div>
    </div>
  );
};

// 3. PAINEL DO ADVOGADO
const LawyerDashboard = ({ onNavigate, cases, onMoveCase, leads, documents, financials, onUpdateFinancial, globalNotifications, onLogout }) => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (globalNotifications.length > 0) {
      const latest = globalNotifications[globalNotifications.length - 1];
      setNotification({ title: "Nova Actividade", message: latest, type: "info" });
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalNotifications]);

  const handleMove = (id) => {
    onMoveCase(id);
    setNotification({ title: "Sucesso", message: "Processo movido. Notificação WhatsApp enviada ao cliente.", type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePay = (id) => {
    onUpdateFinancial(id, "Pago");
    setNotification({ title: "Financeiro", message: "Pagamento registado com sucesso.", type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {notification && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in border border-white/10">
          <div className={`${notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'} rounded-full p-1.5`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-white" /> : <Bell className="w-4 h-4 text-white" />}
          </div>
          <div><div className="font-bold text-sm tracking-tight">{notification.title}</div><div className="text-xs opacity-70 font-medium">{notification.message}</div></div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 transition-all duration-300">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/50"><Gavel className="w-5 h-5 text-white" /></div>
          <span className="font-extrabold text-white tracking-tighter text-lg">PASCALE JURIS</span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('kanban')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 translate-x-1' : 'hover:bg-slate-800'}`}><Activity className="w-5 h-5" /> <span className="text-sm font-bold">Painel de Gestão</span></button>
          <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'leads' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800'}`}><Users className="w-5 h-5" /> <span className="text-sm font-bold flex-1 text-left">Novos Leads</span> {leads.length > 0 && <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-extrabold">{leads.length}</span>}</button>
          <button onClick={() => setActiveTab('docs')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'docs' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800'}`}><FileText className="w-5 h-5" /> <span className="text-sm font-bold flex-1 text-left">Documentação</span></button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800'}`}><DollarSign className="w-5 h-5" /> <span className="text-sm font-bold text-left">Controlo Financeiro</span></button>
        </nav>
        <div className="p-6 border-t border-slate-800"><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:text-white transition opacity-60 hover:bg-red-500/10 hover:text-red-400 hover:opacity-100"><LogOut className="w-4 h-4" /> Sair da Plataforma</button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 bg-white border-b flex items-center justify-between px-10 shadow-sm z-40">
          <h1 className="font-extrabold text-2xl text-slate-800 tracking-tight capitalize">{activeTab.replace('_', ' ')}</h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-extrabold text-slate-800">Dr. Marcos Lopes</span>
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Advogado Senior</span>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-extrabold text-lg border-2 border-indigo-50 shadow-sm">ML</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
          {activeTab === 'finance' ? (
            <div className="animate-fade-in space-y-10">
               <div className="grid grid-cols-3 gap-8">
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition duration-500"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Receita Total Liquida</div><div className="text-4xl font-extrabold text-slate-800 tracking-tight">{formatCurrency(financials.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + curr.amount, 0))}</div><div className="mt-4 flex items-center gap-1 text-green-500 text-[10px] font-bold"><TrendingUp className="w-3 h-3" /> +12% vs mês anterior</div></div>
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition duration-500"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Honorários em Aberto</div><div className="text-4xl font-extrabold text-orange-500 tracking-tight">{formatCurrency(financials.filter(f => f.status === 'Aberto').reduce((acc, curr) => acc + curr.amount, 0))}</div></div>
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition duration-500"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Crédito de Risco</div><div className="text-4xl font-extrabold text-red-600 tracking-tight">{formatCurrency(financials.filter(f => f.status === 'Atrasado').reduce((acc, curr) => acc + curr.amount, 0))}</div></div>
               </div>
               <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b">
                       <tr><th className="p-8">Descrição da Fatura</th><th className="p-8">Cliente Associado</th><th className="p-8">Data Vencimento</th><th className="p-8">Montante</th><th className="p-8">Estado Actual</th><th className="p-8 text-right">Acções</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {financials.map(fin => (
                         <tr key={fin.id} className="hover:bg-slate-50/50 transition duration-300">
                           <td className="p-8 font-bold text-slate-800">{fin.title}</td>
                           <td className="p-8 text-slate-600 font-medium">{fin.client}</td>
                           <td className="p-8 text-slate-500 font-medium">{fin.dueDate}</td>
                           <td className="p-8 font-extrabold text-slate-800">{formatCurrency(fin.amount)}</td>
                           <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-tight ${fin.status === 'Pago' ? 'bg-green-100 text-green-700' : fin.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{fin.status}</span></td>
                           <td className="p-8 text-right">{fin.status !== 'Pago' && <button onClick={() => handlePay(fin.id)} className="bg-white text-green-600 font-extrabold hover:bg-green-600 hover:text-white px-5 py-2 rounded-xl border-2 border-green-500/20 text-[10px] transition-all duration-300 shadow-sm hover:shadow-green-500/20">Liquidar Parcela</button>}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
            </div>
          ) : activeTab === 'leads' ? (
            <div className="animate-fade-in bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b">
                     <tr><th className="p-8">Interessado</th><th className="p-8">Contacto WhatsApp</th><th className="p-8">Área de Interesse</th><th className="p-8">Data Entrada</th><th className="p-8">Qualificação</th><th className="p-8 text-right">Resposta Rápida</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {leads.map(lead => (
                       <tr key={lead.id} className="hover:bg-slate-50/50 transition duration-300">
                         <td className="p-8 font-bold text-slate-800">{lead.name}</td>
                         <td className="p-8 text-slate-600 font-medium">{lead.phone}</td>
                         <td className="p-8"><span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-tighter">{lead.type}</span></td>
                         <td className="p-8 text-slate-400 font-medium">{lead.date}</td>
                         <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase ${lead.status === 'Novo' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>{lead.status}</span></td>
                         <td className="p-8 text-right"><button className="bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-[10px] transition shadow-lg shadow-indigo-900/10">Iniciar Atendimento</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
            </div>
          ) : activeTab === 'docs' ? (
            <div className="animate-fade-in bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b">
                     <tr><th className="p-8">Ficheiro Digital</th><th className="p-8">Remetente</th><th className="p-8">Data Upload</th><th className="p-8">Tamanho</th><th className="p-8 text-right">Acção</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {documents.map(doc => (
                       <tr key={doc.id} className="hover:bg-slate-50/50 transition duration-300">
                         <td className="p-8 font-bold text-slate-800 flex items-center gap-4"><div className="p-2 bg-indigo-50 rounded-lg"><File className="w-5 h-5 text-indigo-600" /></div> {doc.name}</td>
                         <td className="p-8 text-slate-600 font-medium">{doc.client}</td>
                         <td className="p-8 text-slate-500 font-medium">{doc.date}</td>
                         <td className="p-8 text-slate-400 text-[10px] font-extrabold uppercase tracking-tighter">{doc.size}</td>
                         <td className="p-8 text-right"><button className="text-indigo-600 font-extrabold hover:bg-indigo-50 px-5 py-2.5 rounded-xl text-[10px] transition-all border-2 border-transparent hover:border-indigo-100 flex items-center gap-2 ml-auto shadow-sm"><Download className="w-4 h-4" /> Descarregar</button></td>
                       </tr>
                     ))}
                   </tbody>
                </table>
            </div>
          ) : (
            <div className="animate-fade-in space-y-12">
              <div className="grid grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full group-hover:scale-125 transition duration-700 origin-top-right"></div>
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-4">Processos em Carteira</div>
                  <div className="text-5xl font-extrabold text-slate-800 tracking-tighter">{cases.length}</div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full group-hover:scale-125 transition duration-700 opacity-60 origin-top-right"></div>
                   <div className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest mb-4">Índice de Ansiedade</div>
                   <div className="text-5xl font-extrabold text-red-600 tracking-tighter">{cases.filter(c => c.anxietyScore > 70).length}</div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full group-hover:scale-125 transition duration-700 origin-top-right"></div>
                   <div className="text-[10px] text-green-500 font-extrabold uppercase tracking-widest mb-4">Conversões Pendentes</div>
                   <div className="text-5xl font-extrabold text-green-600 tracking-tighter">{leads.filter(l => l.status === 'Novo').length}</div>
                </div>
                <div className="bg-indigo-900 p-8 rounded-[2rem] shadow-2xl relative group overflow-hidden hover:scale-[1.03] transition duration-500">
                   <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mb-4">Eficiência de Atendimento</div>
                   <div className="text-5xl font-extrabold text-white tracking-tighter">8.4k</div>
                   <p className="text-[9px] text-indigo-400 mt-3 font-extrabold uppercase tracking-wider">Avisos Proativos Enviados</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-10">
                {['peticao', 'analise_juiz', 'sentenca'].map(stage => (
                  <div key={stage} className="bg-slate-200/40 rounded-[2.5rem] p-8 border border-slate-200/50 min-h-[550px] flex flex-col gap-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center px-4 mb-2">
                       <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-[0.1em]">{stage.replace('_', ' ')}</span>
                       <span className="bg-white text-slate-800 font-extrabold text-[10px] px-3 py-1 rounded-full shadow-sm border border-slate-200">{cases.filter(c => c.stage === stage).length}</span>
                    </div>
                    {cases.filter(c => c.stage === stage).map(c => (
                      <div key={c.id} className={`bg-white p-8 rounded-3xl shadow-sm border-l-[6px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group relative overflow-hidden ${c.anxietyScore > 70 ? 'border-l-red-500' : 'border-l-indigo-600'}`}>
                         <div className="flex justify-between items-start mb-4">
                           <span className="text-[9px] font-extrabold uppercase bg-slate-50 text-slate-500 px-3 py-1 rounded-full tracking-tighter">{c.status}</span>
                           {c.anxietyScore > 70 && <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />}
                         </div>
                         <h3 className="font-extrabold text-slate-800 text-lg mb-1 leading-tight tracking-tight group-hover:text-indigo-600 transition">{c.client}</h3>
                         <p className="text-[11px] text-slate-400 font-semibold mb-6 truncate">{c.title}</p>
                         <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                            <span className="text-[9px] text-slate-300 font-extrabold uppercase tracking-widest">{c.lastUpdate}</span>
                            <button onClick={() => handleMove(c.id)} className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-sm">Avançar Fluxo ➔</button>
                         </div>
                      </div>
                    ))}
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

// --- APP CONTROLLER ---

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [cases, setCases] = useStickyState(DEFAULT_CASES, 'pascale_cases');
  const [leads, setLeads] = useStickyState(DEFAULT_LEADS, 'pascale_leads');
  const [messages, setMessages] = useStickyState(DEFAULT_MESSAGES, 'pascale_messages');
  const [documents, setDocuments] = useStickyState(DEFAULT_DOCUMENTS, 'pascale_documents');
  const [financials, setFinancials] = useStickyState(DEFAULT_FINANCIALS, 'pascale_financials');
  const [globalNotifications, setGlobalNotifications] = useState([]);

  const moveCase = (caseId) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, stage: 'sentenca', status: 'Concluído', lastUpdate: 'Agora mesmo' } : c));
  };

  const addLead = (newLead) => setLeads(prev => [newLead, ...prev]);

  const handleSendMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, time: 'Agora' }]);
  };

  const handleUploadDocument = (filename) => {
    setDocuments(prev => [{ id: Date.now(), name: filename, client: "Carlos Silva", date: "Hoje", size: "2.4 MB" }, ...prev]);
  };

  const updateFinancial = (id, newStatus) => {
    setFinancials(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  const notifyLawyer = (message) => setGlobalNotifications(prev => [...prev, message]);

  const renderView = () => {
    switch(currentView) {
      case 'landing': return <LandingPage onNavigate={setCurrentView} onAddLead={addLead} />;
      case 'login': return <LoginPage onLogin={() => { setIsAuthenticated(true); setCurrentView('dashboard'); }} />;
      case 'portal': return <ClientPortal onNavigate={setCurrentView} caseData={cases[0]} onNotifyLawyer={notifyLawyer} messages={messages} onSendMessage={handleSendMessage} onUploadDocument={handleUploadDocument} financials={financials} />;
      case 'dashboard': 
        if (!isAuthenticated) return <LoginPage onLogin={() => { setIsAuthenticated(true); setCurrentView('dashboard'); }} />;
        return <LawyerDashboard onNavigate={setCurrentView} cases={cases} onMoveCase={moveCase} leads={leads} documents={documents} financials={financials} onUpdateFinancial={updateFinancial} globalNotifications={globalNotifications} onLogout={() => { setIsAuthenticated(false); setCurrentView('login'); }} />;
      default: return <LandingPage onNavigate={setCurrentView} onAddLead={addLead} />;
    }
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
      
      <div className="fixed bottom-6 left-6 z-[200] bg-slate-950/90 backdrop-blur-2xl text-white px-8 py-4 rounded-[2rem] shadow-2xl flex gap-8 text-[11px] font-extrabold border border-white/10 items-center ring-1 ring-white/20">
        <span className="text-slate-600 uppercase tracking-[0.3em] border-r border-slate-800 pr-8 py-1">Controlo Master</span>
        <button onClick={() => setCurrentView('landing')} className={`px-5 py-2.5 rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'landing' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>1. SITE PÚBLICO</button>
        <button onClick={() => setCurrentView('portal')} className={`px-5 py-2.5 rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'portal' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>2. PORTAL CLIENTE</button>
        <button onClick={() => setCurrentView('dashboard')} className={`px-5 py-2.5 rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'dashboard' || currentView === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>3. PAINEL ADVOGADO</button>
      </div>

      {renderView()}
    </div>
  );
}