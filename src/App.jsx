import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Gavel, Users, FileText, MessageSquare, Bell, Search, Menu, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, 
  LogOut, Activity, Plus, Send, X, UploadCloud, File, 
  Download, DollarSign, TrendingUp, Copy
} from 'lucide-react';

// --- CONFIGURAÇÃO DA NUVEM E DADOS INICIAIS ---
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

const TENANT_CONFIG = {
  name: "Renzo Associados",
  primaryColor: "#0f172a", 
  secondaryColor: "#0f172a",
  logoText: "PASCALE JURIS",
  advogado: "Dr. Renzo"
};

const DEFAULT_MESSAGES = [
  { id: 1, text: "Olá! Vi que acessou o portal. Tem alguma dúvida?", sender: 'bot', time: '10:30' }
];

// --- HOOKS DE PERSISTÊNCIA ---
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

// --- FUNÇÕES UTILITÁRIAS GLOBAIS ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

const applyPhoneMask = (value) => {
  if (!value) return '';
  let v = value.replace(/\D/g, ''); 
  if (v.length <= 2) return v.replace(/(\d{2})/, '($1');
  if (v.length <= 7) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  return v.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3').slice(0, 15);
};

const applyCpfCnpjMask = (v) => {
  if (!v) return '';
  let value = v.replace(/\D/g, '');
  if (value.length <= 11) return value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/-$/, '');
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').slice(0, 18);
};

const applyProcessMask = (v) => {
  if (!v) return '';
  let value = v.replace(/\D/g, '');
  return value.replace(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4}).*/, '$1-$2.$3.$4.$5.$6').slice(0, 25);
};

// ============================================================================
// --- COMPONENTES UI PREMIUM & LÓGICA DE NEGÓCIO ---
// ============================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-slate-800';
  return (
    <div className={`fixed top-6 right-6 md:bottom-28 md:top-auto ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-[300]`}>
      {type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
      <span className="font-bold text-sm tracking-tight">{message}</span>
      <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full transition"><X className="w-4 h-4" /></button>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-white/20 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const SmartProcessLink = ({ processNumber, showToast }) => {
  if (!processNumber) return <span className="text-slate-400 text-xs italic">Sem numeração</span>;
  
  const formattedNumber = applyProcessMask(processNumber);
  const cleanNumber = processNumber.replace(/\D/g, '');

  const handleCopyAndOpenTribunal = () => {
    const textArea = document.createElement("textarea");
    textArea.value = formattedNumber;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      if(showToast) showToast(`Número ${formattedNumber} copiado! Cole na pesquisa do tribunal.`, 'success');
      setTimeout(() => window.open('https://esaj.tjsp.jus.br/cpopg/open.do', '_blank'), 800);
    } catch (err) {
      if(showToast) showToast('Falha ao copiar. Tente manualmente.', 'error');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <button 
        onClick={handleCopyAndOpenTribunal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
        title="Copia o número e abre a página de pesquisa oficial do TJSP"
      >
        <Copy className="w-3 h-3" /> TJSP (e-SAJ)
      </button>
      
      <a 
        href={`https://www.escavador.com/busca?q=${cleanNumber}&tipo_busca=processo`}
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-all border border-slate-200"
        title="Busca garantida via indexador público"
      >
        <Search className="w-3 h-3" /> Agregador
      </a>
    </div>
  );
};

// ============================================================================
// 1. LANDING PAGE
// ============================================================================
const LandingPage = ({ onNavigate, onAddLead, tenantConfig, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Usucapião' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.phone.replace(/\D/g, '').length < 10) {
        showToast("Digite um telefone válido com DDD.", "error");
        return;
    }
    setIsSending(true);
    try {
      await onAddLead(formData);
      showToast("Pedido enviado com sucesso!", "success");
      setFormData({ name: '', phone: '', type: 'Usucapião' });
      setIsModalOpen(false);
    } catch(err) {
      showToast("Falha na comunicação. Tente novamente.", "error");
    } finally {
      setIsSending(false);
    }
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
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] text-slate-900 tracking-tighter">A sua justiça,<br/><span style={{ color: tenantConfig.primaryColor }}>transparente.</span></h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">Acompanhe o seu caso judicial em tempo real através do seu telemóvel. Respostas imediatas e consulta direta aos tribunais.</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center lg:justify-start">
              <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 text-white rounded-2xl font-black text-lg shadow-2xl hover:-translate-y-1 transition transform" style={{ backgroundColor: tenantConfig.primaryColor }}>Avaliar o Meu Caso</button>
              <button onClick={() => onNavigate('portal')} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-lg hover:bg-slate-50 transition">Já sou Cliente</button>
            </div>
        </div>
        <div className="flex-1 hidden lg:block animate-fade-in relative">
           <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="w-full aspect-square max-w-md mx-auto bg-slate-900 rounded-[3rem] shadow-2xl border-8 border-slate-800 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 z-10"></div>
              <Gavel className="w-32 h-32 text-white/10 relative z-0" />
           </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Análise Gratuita">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 transition-colors" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input required type="tel" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 transition-colors" placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})} />
          <select className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="Usucapião">Usucapião (Imobiliário)</option>
            <option value="Trabalhista">Trabalhista</option>
            <option value="Cível">Cível / Consumidor</option>
            <option value="Família">Família (Divórcio/Pensão)</option>
            <option value="Empresarial">Empresarial</option>
          </select>
          <button disabled={isSending} className="w-full py-4 text-white rounded-2xl font-black shadow-xl disabled:opacity-50" style={{ backgroundColor: tenantConfig.primaryColor }}>
              {isSending ? 'Enviando...' : 'Solicitar Contato do Advogado'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// 2. LOGIN PAGE
// ============================================================================
const LoginPage = ({ onLogin, tenantConfig, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('pascale_token', data.token);
        if(data.lawyer?.primaryColor) {
           localStorage.setItem('pascale_tenant_config', JSON.stringify({...tenantConfig, primaryColor: data.lawyer.primaryColor}));
        }
        showToast('Acesso autorizado!', 'success');
        onLogin(data.lawyer);
      } else throw new Error(data.error || 'Erro na autenticação.');
    } catch (err) { 
      showToast(err.message || 'Servidor offline ou inicializando.', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-12 text-center text-white" style={{ backgroundColor: tenantConfig.primaryColor }}>
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            <Gavel className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{tenantConfig.logoText}</h1>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">Acesso Restrito</p>
        </div>
        <form onSubmit={handleAuth} className="p-8 md:p-10 space-y-4">
          <input required type="email" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500" placeholder="E-mail Corporativo" onChange={e => setEmail(e.target.value)} />
          <input required type="password" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500" placeholder="Palavra-passe" onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full py-4 text-white rounded-2xl font-black shadow-xl disabled:opacity-70 flex justify-center items-center" style={{ backgroundColor: tenantConfig.primaryColor }}>
             {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Acessar Sistema"}
          </button>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Login Demo: admin@lopes.pt / admin</p>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 3. PORTAL DO CLIENTE
// ============================================================================
const ClientPortal = ({ onNavigate, caseData, tenantConfig, showToast, onNotifyLawyer, messages, onSendMessage, onUploadDocument, financials }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [file, setFile] = useState(null);

  const clientNameStr = typeof caseData?.client === 'object' ? caseData.client?.name : (caseData?.client || 'Cliente');

  const { myFinancials, totalPendente } = useMemo(() => {
    if (!caseData) return { myFinancials: [], totalPendente: 0 };
    const filtered = financials.filter(f => {
       const fClientStr = typeof f.client === 'object' ? f.client?.name : f.client;
       return fClientStr === clientNameStr;
    });
    const total = filtered.filter(f => f.status !== 'Pago').reduce((acc, curr) => acc + curr.amount, 0);
    return { myFinancials: filtered, totalPendente: total };
  }, [financials, caseData, clientNameStr]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleUpload = () => {
    if(!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadOpen(false);
      onUploadDocument({ name: file.name, client: clientNameStr, file: file });
      if(onNotifyLawyer) onNotifyLawyer(`Novo Documento Recebido de ${clientNameStr}.`);
      showToast("Documento enviado com sucesso!", 'success');
      setFile(null);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue, 'user');
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      onSendMessage("Anotado! Notifiquei o advogado para que ele analise assim que possível.", 'bot');
      if(onNotifyLawyer) onNotifyLawyer(`Mensagem de ${clientNameStr} no chat.`);
    }, 1500);
  };

  if (!caseData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <Activity className="w-12 h-12 mb-4 text-slate-300 animate-spin" />
      <p className="font-bold mb-4">Aguardando dados da nuvem...</p>
      <button onClick={() => onNavigate('landing')} className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition">Voltar ao site principal</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
      <Modal isOpen={financialOpen} onClose={() => setFinancialOpen(false)} title="Financeiro">
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center mb-4 border border-indigo-100">
             <span className="text-sm font-bold text-indigo-900">Total Pendente</span>
             <span className="text-xl font-extrabold text-indigo-700">
               {formatCurrency(totalPendente)}
             </span>
          </div>
          <div className="space-y-3">
             {myFinancials.map(fin => (
               <div key={fin.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
                 <div>
                   <div className="font-bold text-slate-800 text-sm tracking-tight">{fin.title}</div>
                   <div className="text-[10px] text-slate-400 font-bold mt-1">Vencimento: {formatDate(fin.dueDate)}</div>
                 </div>
                 <div className="text-right">
                   <div className="font-bold text-slate-800 text-sm mb-1">{formatCurrency(fin.amount)}</div>
                   <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${fin.status === 'Pago' ? 'bg-green-100 text-green-700' : fin.status === 'Atrasado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                     {fin.status}
                   </span>
                 </div>
               </div>
             ))}
             {myFinancials.length === 0 && <p className="text-center text-slate-400 text-xs font-bold py-4">Nenhuma cobrança ativa.</p>}
          </div>
        </div>
      </Modal>

      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Enviar Documento">
        {!isUploading ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer relative bg-slate-50">
              <UploadCloud className="w-12 h-12 mb-2 text-indigo-300" />
              <p className="text-sm font-bold text-slate-600">{file ? file.name : "Clique para anexar arquivo"}</p>
              <p className="text-[10px] mt-1 font-bold">PDF, JPG ou PNG (Max 5MB)</p>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} />
            </div>
            <button disabled={!file} onClick={handleUpload} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 uppercase tracking-wide text-xs disabled:opacity-50">Confirmar Envio Seguro</button>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
             <p className="text-indigo-900 font-bold animate-pulse text-sm">Processando e Criptografando...</p>
          </div>
        )}
      </Modal>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up md:max-w-md md:right-4 md:left-auto md:bottom-4 md:top-auto md:h-[600px] md:shadow-2xl md:rounded-2xl border-slate-200 overflow-hidden">
          <div className="text-white p-4 flex justify-between items-center" style={{ backgroundColor: tenantConfig.primaryColor }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {tenantConfig.advogado.substring(4, 6).toUpperCase()}
              </div>
              <div><div className="font-bold text-sm leading-none mb-1">{tenantConfig.advogado}</div><div className="text-[10px] opacity-70 flex items-center gap-1 font-bold"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Disponível agora</div></div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 bg-slate-100 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="text-[10px] text-slate-400 italic font-bold">{tenantConfig.advogado} está digitando...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t flex gap-2">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-50 rounded-full px-4 py-3 text-sm outline-none border border-slate-200 focus:border-indigo-500 transition" placeholder="Escreva a sua dúvida..." />
            <button onClick={handleSendMessage} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0 transition hover:bg-indigo-700"><Send className="w-4 h-4 ml-1" /></button>
          </div>
        </div>
      )}

      <header className="p-8 text-white rounded-b-[3rem] shadow-xl" style={{ backgroundColor: tenantConfig.primaryColor }}>
         <button onClick={() => onNavigate('landing')} className="mb-6 opacity-60 hover:opacity-100 flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition"><ArrowRight className="w-4 h-4 rotate-180" /> Voltar</button>
         <h1 className="text-3xl font-black tracking-tight">Olá, {clientNameStr.split(' ')[0]}</h1>
         <p className="opacity-70 mt-1 font-medium tracking-tight">O seu processo está estabilizado e sob monitoramento contínuo.</p>
      </header>

      <div className="px-4 md:px-6 -mt-8 max-w-lg mx-auto space-y-6">
         <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-50/50 rounded-bl-full"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="relative z-10">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">Processo Ativo</span>
                <h2 className="text-xl font-black text-slate-800 mt-3 leading-tight">{caseData.title}</h2>
                <SmartProcessLink processNumber={caseData.processNumber} showToast={showToast} />
              </div>
              <Activity className="w-6 h-6 text-green-500 animate-pulse relative z-10" />
            </div>
            <div className="space-y-3 relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase"><span>Evolução Estimada</span><span className="text-indigo-600">60%</span></div>
               <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="w-[60%] h-full bg-indigo-500"></div></div>
            </div>
         </div>

         <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-sm uppercase tracking-widest"><Clock className="w-5 h-5 text-indigo-600" /> Histórico do Caso</h3>
            <div className="space-y-10 relative">
               <div className="absolute left-[13px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
               {caseData.timeline?.length > 0 ? caseData.timeline.map((step, idx) => (
                 <div key={step.id || idx} className="relative z-10 flex gap-5">
                    <div className={`w-7 h-7 rounded-full border-[3px] flex-shrink-0 flex items-center justify-center bg-white ${step.completed ? 'border-green-500 text-green-500' : 'border-indigo-600 ring-4 ring-indigo-50'}`}>
                      {step.completed ? <CheckCircle className="w-4 h-4 fill-current" /> : <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div>}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight">{step.title}</h4>
                      <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded block w-max mb-2 mt-1">{step.date}</span>
                      {step.description && <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">{step.description}</p>}
                    </div>
                 </div>
               )) : <p className="text-xs text-slate-400 font-bold ml-10">Processo iniciado. Aguardando movimentações do tribunal...</p>}
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
// 4. PAINEL DO ADVOGADO (ENTERPRISE DASHBOARD)
// ============================================================================
const LawyerDashboard = ({ onNavigate, cases, onMoveCase, onAddCase, leads, documents, financials, onUpdateFinancial, onAddFinancial, onAddDocument, globalNotifications, onLogout, tenantConfig, showToast }) => {
  const [tab, setTab] = useState('kanban');
  const [modals, setModals] = useState({ case: false, fin: false, doc: false });
  const [fCase, setFCase] = useState({ client: '', title: '', phone: '', cpf: '', processNumber: '', value: '' });
  const [fFin, setFFin] = useState({ client: '', amount: '', dueDate: '', title: 'Honorários', type: 'Boleto' });
  const [file, setFile] = useState(null);
  const [docClient, setDocClient] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
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

  const wrapAction = async (fn, modalKey, msg) => {
    setActionLoading(true);
    const success = await fn();
    if (success !== false) {
      setModals(m => ({ ...m, [modalKey]: false }));
      if(showToast) showToast(msg, 'success');
      if(modalKey === 'case') setFCase({ client: '', title: '', phone: '', cpf: '', processNumber: '', value: '' });
      if(modalKey === 'fin') setFFin({ client: '', amount: '', dueDate: '', title: 'Honorários', type: 'Boleto' });
      if(modalKey === 'doc') { setFile(null); setDocClient(''); }
    } else {
      if(showToast) showToast('Falha na operação. Verifique os dados e a conexão.', 'error');
    }
    setActionLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed md:relative z-[70] h-full w-64 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="absolute top-0 left-0 w-full h-64 bg-white/5 blur-3xl rounded-full"></div>
        <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg shadow-lg"><Gavel className="w-5 h-5 text-white" /></div>
            <span className="font-extrabold text-white tracking-tighter text-lg">{tenantConfig.logoText}</span>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
          {[
            {id: 'kanban', icon: Activity, label: 'Painel Kanban'},
            {id: 'leads', icon: Users, label: 'CRM de Leads'},
            {id: 'docs', icon: FileText, label: 'Arquivo Digital'},
            {id: 'finance', icon: DollarSign, label: 'Financeiro'}
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${tab === t.id ? 'bg-white/20 shadow-xl translate-x-1' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
              <t.icon className="w-5 h-5" /> <span className="flex-1 text-left">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10 relative z-10"><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:text-white transition opacity-60 hover:bg-red-500/80 hover:opacity-100"><LogOut className="w-4 h-4" /> Sair da Plataforma</button></div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        <header className="h-16 md:h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 md:px-10 z-40 sticky top-0">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
             <h1 className="font-extrabold text-xl md:text-2xl text-slate-800 tracking-tight capitalize">{tab.replace('_', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => setModals({...modals, [tab === 'finance' ? 'fin' : tab === 'docs' ? 'doc' : 'case']: true})} className="px-4 py-2.5 md:px-6 md:py-3.5 rounded-2xl text-white font-bold shadow-xl flex items-center gap-2 hover:-translate-y-1 transition-all text-xs md:text-sm" style={{ backgroundColor: tenantConfig.primaryColor }}>
              <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Lançar {tab === 'finance' ? 'Fatura' : tab === 'docs' ? 'Ficheiro' : 'Processo'}</span>
            </button>
            <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200">
               <div className="text-right">
                 <div className="text-sm font-black text-slate-800">{tenantConfig.advogado}</div>
                 <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Admin</div>
               </div>
               <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-700 border-2 border-indigo-100 shadow-inner">{tenantConfig.advogado?.substring(4,6).toUpperCase() || 'AD'}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-12 bg-slate-50/50 custom-scrollbar pb-24 md:pb-12">
          {tab === 'kanban' && (
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 pb-10">
              {['peticao', 'analise_juiz', 'sentenca'].map(s => (
                <div key={s} className="flex-1 bg-slate-200/30 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 min-h-[500px] md:min-h-[650px] space-y-4 md:space-y-6 border border-slate-200/50 flex flex-col">
                  <div className="flex justify-between font-black text-[10px] md:text-[11px] text-slate-400 uppercase tracking-[0.2em] px-2 items-center">
                    <span>{s.replace('_', ' ')}</span>
                    <span className="bg-white px-3 py-1 rounded-full text-slate-800 shadow-sm border border-slate-100">{groupedCases[s]?.length || 0}</span>
                  </div>
                  {groupedCases[s]?.map(c => {
                    const clientName = typeof c.client === 'object' ? c.client?.name : c.client;
                    return (
                      <div key={c.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border-l-[8px] transition-all hover:shadow-xl hover:-translate-y-1.5 group flex flex-col gap-3" style={{ borderLeftColor: c.anxietyScore > 70 ? '#ef4444' : tenantConfig.primaryColor }}>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">{c.status}</span>
                            {c.anxietyScore > 70 && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" title="Cliente Ansioso" />}
                          </div>
                          <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight truncate">{clientName}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{c.title}</p>
                          
                          <SmartProcessLink processNumber={c.processNumber} showToast={showToast} />

                          {c.timeline && c.timeline.length > 0 && (
                            <div className="mt-4 bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Resumo Atividades</span>
                              </div>
                              <div className="space-y-2 md:space-y-3">
                                {[...c.timeline].reverse().slice(0, 2).map((step, idx) => (
                                  <div key={step.id || idx} className="flex gap-2 md:gap-3 items-start">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${step.completed ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`}></div>
                                    <div>
                                      <p className="text-[9px] md:text-[10px] font-extrabold text-slate-700 leading-tight">{step.title}</p>
                                      <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{step.date}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
                             <button onClick={() => window.open(`https://wa.me/55${(c.phone || '11999999999').replace(/\D/g,'')}`, '_blank')} className="text-green-600 bg-green-50 px-3 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase hover:bg-green-100 transition whitespace-nowrap">WhatsApp</button>
                             {s !== 'sentenca' && <button onClick={() => wrapAction(() => onMove(c.id, s), '', 'Avanço de fase registado!')} className="flex-1 bg-slate-50 text-indigo-700 px-4 py-2 rounded-xl font-black text-[9px] md:text-[10px] hover:bg-indigo-50 hover:text-indigo-800 transition shadow-sm border border-slate-200 uppercase tracking-widest text-center truncate">Avançar ➔</button>}
                          </div>
                      </div>
                    )
                  })}
                  {(!groupedCases[s] || groupedCases[s].length === 0) && (
                     <div className="flex-1 border-2 border-dashed border-slate-300/50 rounded-3xl flex items-center justify-center p-6 text-center text-slate-400 font-bold text-xs">Área Vazia</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'leads' && (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-6 md:p-8">Nome do Lead</th><th className="p-6 md:p-8">Contato</th><th className="p-6 md:p-8">Área</th><th className="p-6 md:p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads?.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-6 md:p-8 font-extrabold text-slate-800">{l.name}</td>
                        <td className="p-6 md:p-8 text-slate-600 text-sm font-bold">{l.phone}</td>
                        <td className="p-6 md:p-8"><span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">{l.type}</span></td>
                        <td className="p-6 md:p-8 text-right"><button onClick={() => window.open(`https://wa.me/55${l.phone?.replace(/\D/g,'')}`, '_blank')} className="bg-green-500 text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-all inline-block"><MessageSquare className="w-4 h-4 md:w-5 md:h-5" /></button></td>
                      </tr>
                    ))}
                    {(!leads || leads.length === 0) && <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">Nenhum prospecto ainda.</td></tr>}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'docs' && (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-6 md:p-8">Arquivo Digital</th><th className="p-6 md:p-8">Titular</th><th className="p-6 md:p-8">Tamanho</th><th className="p-6 md:p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {documents?.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-6 md:p-8 font-extrabold text-slate-800 flex items-center gap-4"><div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400"><File className="w-4 h-4 md:w-5 md:h-5" /></div> <span className="truncate max-w-[150px] md:max-w-none">{d.name}</span></td>
                        <td className="p-6 md:p-8 text-slate-500 text-sm font-bold">{typeof d.client === 'object' ? d.client?.name : d.client}</td>
                        <td className="p-6 md:p-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">{d.size}</td>
                        <td className="p-6 md:p-8 text-right">
                          <button onClick={() => d.url ? window.open(d.url, '_blank') : showToast('Arquivo em processamento ou offline.', 'error')} className="font-black text-[10px] md:text-[11px] inline-flex items-center gap-2 hover:bg-slate-50 px-4 md:px-5 py-2.5 rounded-xl transition-all uppercase tracking-tight border border-transparent hover:border-slate-200" style={{ color: tenantConfig.primaryColor }}>
                            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Baixar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                     {(!documents || documents.length === 0) && <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">Cofre de documentos vazio.</td></tr>}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'finance' && (
            <div className="animate-fade-in space-y-6 md:space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 md:w-40 md:h-40 bg-green-50 rounded-bl-full transition-transform duration-700 group-hover:scale-125"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase mb-2 md:mb-3 tracking-[0.2em]">Faturado Realizado</div>
                      <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalRevenue)}</div>
                    </div>
                    <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-green-500 relative z-10 opacity-80" />
                  </div>
                  <div className="p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex justify-between items-center text-white relative overflow-hidden group" style={{ backgroundColor: tenantConfig.primaryColor }}>
                    <div className="absolute right-0 top-0 w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-bl-full transition-transform duration-700 group-hover:scale-125"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] md:text-[11px] font-black text-white/60 uppercase mb-2 md:mb-3 tracking-[0.2em]">Previsão em Aberto</div>
                      <div className="text-4xl md:text-5xl font-black tracking-tighter">{formatCurrency(openRevenue)}</div>
                    </div>
                    <div className="p-4 md:p-5 bg-white/10 rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-sm relative z-10 border border-white/20"><DollarSign className="w-8 h-8 md:w-10 md:h-10" /></div>
                  </div>
               </div>
               <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[600px]">
                       <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                          <tr><th className="p-6 md:p-8">Descrição</th><th className="p-6 md:p-8">Cliente</th><th className="p-6 md:p-8">Valor</th><th className="p-6 md:p-8">Vencimento</th><th className="p-6 md:p-8">Status</th><th className="p-6 md:p-8 text-right">Ações</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {financials?.map(f => (
                             <tr key={f.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-6 md:p-8 font-extrabold text-slate-800 text-sm">{f.title}</td>
                                <td className="p-6 md:p-8 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase">{typeof f.client === 'object' ? f.client?.name : f.client}</td>
                                <td className="p-6 md:p-8 font-black text-slate-800 text-base md:text-lg">{formatCurrency(f.amount)}</td>
                                <td className="p-6 md:p-8 text-slate-500 text-xs md:text-sm font-bold">{formatDate(f.dueDate)}</td>
                                <td className="p-6 md:p-8"><span className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ${f.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{f.status}</span></td>
                                <td className="p-6 md:p-8 text-right">{f.status !== 'Pago' && <button onClick={() => { onUpdateFinancial(f.id, "Pago"); if(showToast) showToast("Pagamento liquidado!", 'success'); }} className="bg-white text-green-600 font-extrabold hover:bg-green-600 hover:text-white px-3 md:px-5 py-2 rounded-xl border-2 border-green-500/20 text-[10px] transition-all duration-300 shadow-sm">Liquidar</button>}</td>
                             </tr>
                          ))}
                           {(!financials || financials.length === 0) && <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold">Nenhum registo financeiro.</td></tr>}
                       </tbody>
                    </table>
                 </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS DA DASHBOARD */}
      <Modal isOpen={modals.case} onClose={()=>setModals({...modals, case:false})} title="Protocolar Processo">
        <form onSubmit={(e) => { e.preventDefault(); wrapAction(async () => { await onAddCase(fCase); return true; }, 'case', 'Processo sincronizado na nuvem!'); }} className="space-y-4 md:space-y-5">
          <input required className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none text-sm" placeholder="Nome Completo do Cliente" value={fCase.client} onChange={e=>setFCase({...fCase, client: e.target.value})} />
          <div className="flex gap-4">
            <input className="flex-1 p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none text-sm" placeholder="CPF/CNPJ" value={fCase.cpf} onChange={e=>setFCase({...fCase, cpf: applyCpfCnpjMask(e.target.value)})} />
            <input required type="tel" className="flex-1 p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none text-sm" placeholder="WhatsApp" value={fCase.phone} onChange={e=>setFCase({...fCase, phone: applyPhoneMask(e.target.value)})} />
          </div>
          <input className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none text-sm" placeholder="Número CNJ (Opcional)" value={fCase.processNumber} onChange={e=>setFCase({...fCase, processNumber: applyProcessMask(e.target.value)})} />
          <input required className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none text-sm" placeholder="Objeto da Ação" value={fCase.title} onChange={e=>setFCase({...fCase, title: e.target.value})} />
          <input type="number" className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium focus:border-indigo-500 outline-none text-sm" placeholder="Valor da Causa (R$)" value={fCase.value} onChange={e=>setFCase({...fCase, value: e.target.value})} />
          
          <button disabled={actionLoading} className="w-full py-3 md:py-4 text-white rounded-2xl font-black shadow-xl uppercase tracking-wide text-xs md:text-sm flex justify-center items-center mt-2 disabled:opacity-70" style={{backgroundColor: tenantConfig.primaryColor}}>
            {actionLoading ? "Enviando..." : "Registrar Acompanhamento"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.fin} onClose={()=>setModals({...modals, fin:false})} title="Lançar Honorários">
        <form onSubmit={(e) => { e.preventDefault(); wrapAction(async () => { await onAddFin(fFin); return true; }, 'fin', 'Fatura gerada com sucesso!'); }} className="space-y-4 md:space-y-5">
          <select required className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium outline-none text-sm" value={fFin.client} onChange={e=>setFFin({...fFin, client: e.target.value})}>
            <option value="">Selecione o Cliente</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium outline-none text-sm" placeholder="Descrição (Ex: Parcela 1/5)" value={fFin.title} onChange={e=>setFFin({...fFin, title: e.target.value})} />
          <div className="flex gap-4">
            <input required type="number" step="0.01" className="flex-1 p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium text-sm" placeholder="Valor (R$)" value={fFin.amount} onChange={e=>setFFin({...fFin, amount: e.target.value})} />
            <input required type="date" className="flex-1 p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium text-sm" value={fFin.dueDate} onChange={e=>setFFin({...fFin, dueDate: e.target.value})} />
          </div>
          <button disabled={actionLoading} className="w-full py-3 md:py-4 text-white rounded-2xl font-black shadow-xl bg-green-600 uppercase tracking-wide text-xs md:text-sm disabled:opacity-70">
             {actionLoading ? "Processando..." : "Emitir Documento de Cobrança"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.doc} onClose={()=>setModals({...modals, doc:false})} title="Arquivo Criptografado (Nuvem)">
        <form onSubmit={(e) => { e.preventDefault(); if(!file || !docClient) return; const fd = new FormData(); fd.append('file', file); fd.append('client', docClient); fd.append('name', file.name); wrapAction(async () => { await onAddDoc(fd); return true; }, 'doc', 'Documento salvo no cofre digital!'); }} className="space-y-4 md:space-y-6">
          <select required className="w-full p-3 md:p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-medium outline-none text-sm" value={docClient} onChange={e=>setDocClient(e.target.value)}>
            <option value="">Anexar à pasta de qual cliente?</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="border-4 border-dashed border-slate-200 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-white transition-all group relative cursor-pointer">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8 md:w-10 md:h-10 text-slate-300 group-hover:text-indigo-500" /></div>
             <p className="text-xs md:text-sm font-extrabold text-slate-600 text-center truncate px-4">{file ? file.name : "Clique ou arraste um PDF aqui"}</p>
             <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setFile(e.target.files[0])} />
          </div>
          <button disabled={actionLoading || !file} className="w-full py-3 md:py-4 text-white rounded-2xl font-black shadow-xl uppercase tracking-wide text-xs md:text-sm flex justify-center items-center disabled:opacity-50" style={{backgroundColor: tenantConfig.primaryColor}}>
            {actionLoading ? "Enviando..." : "Subir para a Nuvem Segura"}
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
  const [currentView, setCurrentView] = useState('login'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [tenant, setTenant] = useStickyState(TENANT_CONFIG, 'pascale_tenant_config');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => setToast({ visible: true, message, type }), []);

  const [cases, setCases] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [leads, setLeads] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useStickyState(DEFAULT_MESSAGES, 'pascale_messages'); 
  const [globalNotifications, setGlobalNotifications] = useState([]);

  const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('pascale_token');
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Autenticação expirada');
    }
    if (!response.ok) {
      throw new Error('Falha de comunicação com o servidor');
    }
    return response;
  };

  const fetchAllData = useCallback(async () => {
    try {
      const [casesRes, finRes, leadsRes, docsRes] = await Promise.all([
        authFetch('/cases'),
        authFetch('/financials'),
        authFetch('/leads'),
        authFetch('/documents')
      ]);

      const casesData = await casesRes.json();
      setCases(casesData.data.map(dbCase => ({
        ...dbCase,
        client: typeof dbCase.client === 'object' ? dbCase.client?.name : dbCase.client || 'Desconhecido',
        phone: typeof dbCase.client === 'object' ? dbCase.client?.phone : '',
        timeline: dbCase.timeline || []
      })));

      const finData = await finRes.json();
      setFinancials(finData.data.map(dbFin => ({
          ...dbFin,
          client: typeof dbFin.client === 'object' ? dbFin.client?.name : dbFin.client || 'Desconhecido'
      })));

      const leadsData = await leadsRes.json();
      setLeads(leadsData.data.map(l => ({...l, date: new Date(l.createdAt).toLocaleDateString('pt-BR')})));

      const docsData = await docsRes.json();
      setDocuments(docsData.data);

    } catch (error) {
      console.warn("Falha no carregamento de dados:", error);
      if (error.message === 'Autenticação expirada') {
        setIsAuthenticated(false);
        setCurrentView('login');
      } else {
        showToast("Servidor lento ou instável. Alguns dados podem não ter carregado.", "error");
      }
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if(isAuthenticated) {
      setLoadingData(true);
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  const moveCase = async (caseId, newStageStr) => {
    const newStage = newStageStr || 'analise_juiz';
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return { ...c, stage: newStage, status: newStage === 'sentenca' ? 'Concluído' : 'Em Andamento' };
      }
      return c;
    }));
    try {
      await authFetch(`/cases/${caseId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, status: newStage === 'sentenca' ? 'Concluído' : 'Em Andamento' })
      });
    } catch (e) {
      console.error("Erro ao gravar mudança:", e);
    }
  };

  const addCase = async (newCaseData) => {
    try {
      const response = await authFetch(`/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaseData)
      });
      const dbCase = await response.json();
      if(dbCase.success) {
        // Refetch garantido para sincronizar relacionamentos vazios do backend
        await fetchAllData();
      } else {
        throw new Error('Falha no backend');
      }
    } catch (e) {
      console.error("Erro ao enviar processo:", e);
      throw e; // Para o Toast reportar o erro
    }
  };

  const handleAddFinancial = async (finData) => {
    try {
      const response = await authFetch(`/financials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finData)
      });
      const dbFin = await response.json();
      if(dbFin.success) setFinancials(prev => [dbFin.data, ...prev]);
    } catch (e) {
      console.error("Erro ao enviar fatura:", e);
    }
  };

  const handleUploadDocument = async (docData) => {
    let formData;
    if(docData instanceof FormData) {
       formData = docData;
    } else {
       formData = new FormData();
       formData.append('file', docData.file);
       formData.append('client', docData.client);
       formData.append('name', docData.name);
    }
    try {
      const response = await authFetch(`/documents`, {
        method: 'POST',
        body: formData 
      });
      const dbDoc = await response.json();
      if(dbDoc.success) setDocuments(prev => [dbDoc.data, ...prev]);
    } catch (e) {
      console.error("Erro no upload:", e);
    }
  };

  const addLead = async (newLead) => {
    try {
      await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLead.name, phone: newLead.phone, type: newLead.type })
      });
    } catch (e) { console.error("Erro ao enviar Lead", e); }
  };

  const updateFinancial = async (id, newStatus) => {
    setFinancials(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    try { await authFetch(`/financials/${id}/pay`, { method: 'PATCH' }); } catch (e) {}
  };
  
  const handleSendMessage = (text, sender) => setMessages(prev => [...prev, { id: Date.now(), text, sender, time: 'Agora' }]);
  const notifyLawyer = (message) => setGlobalNotifications(prev => [...prev, message]);

  const safeTenant = {
    ...tenant,
    primaryColor: tenant?.primaryColor || '#0f172a',
    logoText: tenant?.logoText || 'PASCALE JURIS',
    advogado: tenant?.advogado || 'Dr. Renzo'
  };

  // Previne que a cor cacheada errada ("bg-slate-900") quebre o layout
  if (safeTenant.primaryColor && !safeTenant.primaryColor.startsWith('#')) {
    safeTenant.primaryColor = '#0f172a';
  }

  const renderView = () => {
    switch(currentView) {
      case 'landing': return <LandingPage onNavigate={setCurrentView} onAddLead={addLead} tenantConfig={safeTenant} showToast={showToast} />;
      case 'portal': return <ClientPortal onNavigate={setCurrentView} caseData={cases[0]} onNotifyLawyer={notifyLawyer} messages={messages} onSendMessage={handleSendMessage} onUploadDocument={handleUploadDocument} financials={financials} tenantConfig={safeTenant} showToast={showToast} />;
      case 'login': return <LoginPage onLogin={(l) => { setTenant(l || TENANT_CONFIG); setIsAuthenticated(true); setCurrentView('dashboard'); }} tenantConfig={safeTenant} showToast={showToast} />;
      case 'dashboard': 
        if (!isAuthenticated) return <LoginPage onLogin={(l) => { setTenant(l || TENANT_CONFIG); setIsAuthenticated(true); setCurrentView('dashboard'); }} tenantConfig={safeTenant} showToast={showToast} />;
        return <LawyerDashboard 
          onNavigate={setCurrentView} 
          cases={cases} 
          onMoveCase={moveCase} 
          onAddCase={addCase} 
          leads={leads} 
          documents={documents} 
          financials={financials} 
          onUpdateFinancial={updateFinancial} 
          onAddFinancial={handleAddFinancial}
          onAddDocument={handleUploadDocument}
          globalNotifications={globalNotifications} 
          tenantConfig={safeTenant}
          showToast={showToast}
          onLogout={() => { 
            localStorage.removeItem('pascale_token');
            setIsAuthenticated(false); 
            setCurrentView('login'); 
          }} 
        />;
      default: return <LoginPage onLogin={(l) => { setTenant(l || TENANT_CONFIG); setIsAuthenticated(true); setCurrentView('dashboard'); }} tenantConfig={safeTenant} showToast={showToast} />;
    }
  };

  if (loadingData && isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <Activity className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        <p className="font-extrabold tracking-widest uppercase text-xs animate-pulse text-indigo-200">Sincronizando Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900 pb-28">
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
      
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={() => setToast(t => ({...t, visible: false}))} />}

      <div className="fixed bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-auto z-[200] bg-slate-950/90 backdrop-blur-2xl text-white px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[2rem] shadow-2xl flex justify-center md:justify-start gap-2 md:gap-8 text-[9px] md:text-[11px] font-extrabold border border-white/10 items-center ring-1 ring-white/20">
        <span className="hidden md:inline text-slate-600 uppercase tracking-[0.3em] border-r border-slate-800 pr-8 py-1">Controlo Master</span>
        <button onClick={() => setCurrentView('landing')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'landing' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>1. SITE</button>
        <button onClick={() => setCurrentView('portal')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'portal' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>2. PORTAL</button>
        <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-2xl transition-all duration-300 tracking-tight ${currentView === 'dashboard' || currentView === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-500'}`}>3. PAINEL</button>
      </div>

      {renderView()}
    </div>
  );
}