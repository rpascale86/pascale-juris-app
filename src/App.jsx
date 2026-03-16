import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

// --- FUNÇÕES UTILITÁRIAS ---
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
const Modal = React.memo(({ isOpen, onClose, title, children }) => {
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
});

// 0. LOGIN E REGISTO REAL
const LoginPage = ({ onLogin, onNavigate, tenantConfig }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 

  const handleAuth = async (e, endpoint, payload) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pascale_token', data.token);
        const lastName = data.lawyer.name.split(' ').pop().toUpperCase();
        const dynamicConfig = {
          name: data.lawyer.officeName || `${data.lawyer.name} & Associados`,
          primaryColor: data.lawyer.primaryColor || '#4f46e5',
          logoText: `${lastName} JURIS`,
          advogado: data.lawyer.name
        };
        onLogin(dynamicConfig); 
      } else {
        setErrorMsg(data.error || `Erro ao processar o seu pedido.`);
      }
    } catch (err) {
      setErrorMsg("Falha na ligação ao servidor central.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-8 text-center" style={{ backgroundColor: isRegisterMode ? '#1e293b' : tenantConfig.primaryColor }}>
          <button onClick={() => onNavigate('landing')} className="absolute top-4 left-4 text-white/50 hover:text-white transition">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            {isRegisterMode ? <ShieldCheck className="w-8 h-8" /> : <Gavel className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRegisterMode ? "CRIAR CONTA" : tenantConfig.logoText}
          </h1>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Acesso Restrito</p>
        </div>

        <div className="p-8">
          <form onSubmit={(e) => isRegisterMode ? handleAuth(e, 'register', { name, email, password, officeName }) : handleAuth(e, 'login', { email, password })} className="space-y-4">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-lg outline-none bg-slate-50" placeholder="Ex: Dr. João Silva" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Escritório</label>
                  <input required value={officeName} onChange={(e) => setOfficeName(e.target.value)} className="w-full p-3 border rounded-lg outline-none bg-slate-50" placeholder="Ex: Silva Associados" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Profissional</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg outline-none bg-slate-50" placeholder="admin@lopes.pt" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Palavra-passe</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none bg-slate-50" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={{ backgroundColor: isRegisterMode ? '#1e293b' : tenantConfig.primaryColor }} className="w-full py-3 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-opacity flex justify-center items-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegisterMode ? "Criar Minha Plataforma" : "Aceder ao Sistema")}
            </button>
          </form>

          {errorMsg && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center animate-fade-in">{errorMsg}</div>}

          <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="w-full mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
            {isRegisterMode ? "Já tem conta? Faça Login" : "Não tem conta? Registe o seu Escritório"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 1. LANDING PAGE (SITE)
const LandingPage = ({ onNavigate, onAddLead, tenantConfig }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Cível' });
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddLead({ name: formData.name, phone: formData.phone, type: formData.type });
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
          <span className="font-bold text-sm">Pedido enviado! O advogado entrará em contacto brevemente.</span>
        </div>
      )}

      <header className="px-6 py-4 flex justify-between items-center border-b shadow-sm sticky top-0 bg-white z-50">
        <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" style={{ color: tenantConfig.primaryColor }}>
          <Gavel className="w-6 h-6" />
          {tenantConfig.logoText}
        </div>
        <button onClick={() => onNavigate('login')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition">
          Área do Escritório
        </button>
      </header>

      <main className="flex-1">
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Consultoria Inicial">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telemóvel</label>
              <input required type="tel" className="w-full p-3 border rounded-lg outline-none focus:ring-2" style={{ '--tw-ring-color': tenantConfig.primaryColor }} placeholder="(+351) 999 999 999" value={formData.phone} onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Área de Interesse</label>
              <select className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2" style={{ '--tw-ring-color': tenantConfig.primaryColor }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Cível">Direito Cível</option>
                <option value="Laboral">Direito Laboral</option>
                <option value="Família">Direito de Família</option>
                <option value="Empresarial">Direito Empresarial</option>
              </select>
            </div>
            <button type="submit" className="w-full py-3 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition" style={{ backgroundColor: tenantConfig.primaryColor }}>Enviar Pedido de Consulta</button>
          </form>
        </Modal>

        <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
          <div className="flex-1 space-y-6 animate-fade-in">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Advocacia Digital 4.0</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">Transparência total no seu <span style={{ color: tenantConfig.primaryColor }}>processo jurídico.</span></h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto md:mx-0">Acompanhe cada etapa do seu caso em tempo real através do nosso portal exclusivo. Simples, rápido e na palma da sua mão.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition transform hover:-translate-y-1" style={{ backgroundColor: tenantConfig.primaryColor }}>Iniciar Consulta Agora</button>
              <button onClick={() => onNavigate('login')} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-slate-300 transition">Sou Advogado / Cliente</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// 2. PAINEL DO ADVOGADO REAL
const LawyerDashboard = ({ cases, onMoveCase, onAddCase, leads, documents, financials, onAddFinancial, onAddDocument, onLogout, tenantConfig }) => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [notification, setNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modais
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isAddFinModalOpen, setIsAddFinModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  
  // Estados de Formulário
  const [newCaseData, setNewCaseData] = useState({ client: '', title: '', processNumber: '', notes: '', phone: '' });
  const [newFinData, setNewFinData] = useState({ client: '', amount: '', dueDate: '', type: 'Boleto', title: 'Honorários' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [docClient, setDocClient] = useState('');

  const activeClients = useMemo(() => Array.from(new Set(cases.map(c => c.client))).filter(Boolean), [cases]);

  const handleAnxietyClick = (clientName) => {
    setNotification({ title: "Radar de Ansiedade", message: `O cliente ${clientName} não recebe atualizações há algum tempo. Considere enviar uma mensagem.`, type: "warning" });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleAddNewCase = async (e) => {
    e.preventDefault();
    const res = await onAddCase(newCaseData);
    if (res.success) {
      setIsAddCaseModalOpen(false);
      setNewCaseData({ client: '', title: '', processNumber: '', notes: '', phone: '' });
      setNotification({ title: "Sucesso", message: "Novo processo registado na nuvem.", type: "success" });
    } else {
      setNotification({ title: "Erro", message: res.error, type: "warning" });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddNewFin = async (e) => {
    e.preventDefault();
    const res = await onAddFinancial(newFinData);
    if (res.success) {
      setIsAddFinModalOpen(false);
      setNewFinData({ client: '', amount: '', dueDate: '', type: 'Boleto', title: 'Honorários' });
      setNotification({ title: "Financeiro", message: "Nova fatura lançada com sucesso.", type: "success" });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddNewDoc = async (e) => {
    e.preventDefault();
    if (!docClient || !selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('client', docClient);
    formData.append('name', selectedFile.name);

    const res = await onAddDocument(formData);
    if (res.success) {
      setIsAddDocModalOpen(false);
      setSelectedFile(null);
      setNotification({ title: "Arquivo Digital", message: "Documento salvo e link gerado com sucesso.", type: "success" });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      
      {notification && (
        <div className={`fixed top-6 right-6 z-[300] px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-slide-in border bg-slate-900 text-white`}>
          <div className={`${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-full p-2 mt-0.5`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div className="max-w-xs">
            <div className="font-bold text-sm">{notification.title}</div>
            <div className="text-xs opacity-80">{notification.message}</div>
          </div>
          <button onClick={() => setNotification(null)} className="ml-2"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modais de Gestão */}
      <Modal isOpen={isAddCaseModalOpen} onClose={() => setIsAddCaseModalOpen(false)} title="Novo Processo">
        <form onSubmit={handleAddNewCase} className="space-y-4">
          <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} placeholder="Nome do Cliente" value={newCaseData.client} onChange={e => setNewCaseData({...newCaseData, client: e.target.value})} />
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} placeholder="WhatsApp do Cliente" value={newCaseData.phone} onChange={e => setNewCaseData({...newCaseData, phone: e.target.value})} />
          <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} placeholder="Título da Acção" value={newCaseData.title} onChange={e => setNewCaseData({...newCaseData, title: e.target.value})} />
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} placeholder="Número do Processo (Opcional)" value={newCaseData.processNumber} onChange={e => setNewCaseData({...newCaseData, processNumber: e.target.value})} />
          <button type="submit" className="w-full py-3 text-white rounded-lg font-bold shadow-lg" style={{ backgroundColor: tenantConfig.primaryColor }}>Salvar Processo</button>
        </form>
      </Modal>

      <Modal isOpen={isAddFinModalOpen} onClose={() => setIsAddFinModalOpen(false)} title="Lançar Cobrança">
        <form onSubmit={handleAddNewFin} className="space-y-4">
          <select required className="w-full p-3 border rounded-lg bg-slate-50" value={newFinData.client} onChange={e => setNewFinData({...newFinData, client: e.target.value})}>
             <option value="">Para qual cliente?</option>
             {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required className="w-full p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} placeholder="Descrição (ex: Honorários)" value={newFinData.title} onChange={e => setNewFinData({...newFinData, title: e.target.value})} />
          <div className="flex gap-4">
            <input required type="number" step="0.01" className="flex-1 p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} placeholder="Valor (€)" value={newFinData.amount} onChange={e => setNewFinData({...newFinData, amount: e.target.value})} />
            <input required type="date" className="flex-1 p-3 border rounded-lg outline-none focus:ring-2 bg-slate-50" style={{'--tw-ring-color': tenantConfig.primaryColor}} value={newFinData.dueDate} onChange={e => setNewFinData({...newFinData, dueDate: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-3 text-white rounded-lg font-bold shadow-lg bg-green-600">Lançar Fatura</button>
        </form>
      </Modal>

      <Modal isOpen={isAddDocModalOpen} onClose={() => setIsAddDocModalOpen(false)} title="Upload de Ficheiro">
        <form onSubmit={handleAddNewDoc} className="space-y-4">
          <select required className="w-full p-3 border rounded-lg bg-slate-50" value={docClient} onChange={e => setDocClient(e.target.value)}>
            <option value="">Seleccionar Cliente...</option>
            {activeClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition relative">
            <UploadCloud className="w-8 h-8 mb-2" style={{ color: tenantConfig.primaryColor }} />
            <p className="text-xs font-bold">{selectedFile ? selectedFile.name : "Clique para anexar"}</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setSelectedFile(e.target.files[0])} />
          </div>
          <button type="submit" className="w-full py-3 text-white rounded-lg font-bold shadow-lg" style={{ backgroundColor: tenantConfig.primaryColor }}>Iniciar Upload Seguro</button>
        </form>
      </Modal>

      {/* Sidebar */}
      <aside className={`fixed md:relative z-[70] h-full w-64 text-white flex flex-col shadow-2xl transition-all ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} style={{ backgroundColor: tenantConfig.primaryColor }}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel className="w-6 h-6" />
            <span className="font-extrabold text-lg tracking-tighter">{tenantConfig.logoText}</span>
          </div>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button onClick={() => setActiveTab('kanban')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'kanban' ? 'bg-white/20' : 'hover:bg-white/5'}`}><Activity className="w-4 h-4" /> Gestão</button>
          <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'leads' ? 'bg-white/20' : 'hover:bg-white/5'}`}><Users className="w-4 h-4" /> Leads</button>
          <button onClick={() => setActiveTab('docs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'docs' ? 'bg-white/20' : 'hover:bg-white/5'}`}><FileText className="w-4 h-4" /> Arquivo</button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'finance' ? 'bg-white/20' : 'hover:bg-white/5'}`}><DollarSign className="w-4 h-4" /> Finanças</button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold opacity-60 hover:opacity-100"><LogOut className="w-4 h-4" /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
             <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6" /></button>
             <h1 className="font-extrabold text-xl text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => {
              if (activeTab === 'kanban') setIsAddCaseModalOpen(true);
              if (activeTab === 'docs') setIsAddDocModalOpen(true);
              if (activeTab === 'finance') setIsAddFinModalOpen(true);
            }} className="p-2.5 rounded-xl text-white shadow-lg flex items-center gap-2 text-sm font-bold" style={{ backgroundColor: tenantConfig.primaryColor }}>
              <Plus className="w-4 h-4" /> Novo
            </button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: tenantConfig.primaryColor }}>
              {tenantConfig.advogado.substring(0,2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['peticao', 'analise_juiz', 'sentenca'].map(stage => (
                <div key={stage} className="bg-slate-200/50 rounded-3xl p-6 min-h-[500px] flex flex-col gap-4">
                   <div className="flex justify-between items-center mb-2 px-2">
                     <span className="font-extrabold text-slate-500 text-xs uppercase tracking-widest">{stage.replace('_', ' ')}</span>
                     <span className="bg-white text-slate-800 text-[10px] px-2 py-0.5 rounded-full shadow-sm">{cases.filter(c => c.stage === stage).length}</span>
                   </div>
                   {cases.filter(c => c.stage === stage).map(c => (
                     <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 transition-all hover:shadow-xl hover:-translate-y-1" style={{ borderLeftColor: c.anxietyScore > 70 ? '#ef4444' : tenantConfig.primaryColor }}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-extrabold text-slate-400 uppercase">{c.status}</span>
                           {c.anxietyScore > 70 && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse cursor-pointer" onClick={() => handleAnxietyClick(c.client)} />}
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{c.client}</h3>
                        <p className="text-xs text-slate-400 font-medium truncate">{c.title}</p>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                           <button onClick={() => window.open(`https://wa.me/55${c.phone?.replace(/\D/g,'')}`, '_blank')} className="text-green-600 text-[10px] font-extrabold uppercase">WhatsApp</button>
                           {stage !== 'sentenca' && (
                             <button onClick={() => onMoveCase(c.id, stage)} className="text-white text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-md" style={{ backgroundColor: tenantConfig.primaryColor }}>Avançar ➔</button>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-6">Nome do Lead</th><th className="p-6">Contacto</th><th className="p-6">Interesse</th><th className="p-6 text-right">Acção</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition">
                        <td className="p-6 font-bold text-slate-800">{lead.name}</td>
                        <td className="p-6 text-slate-500 text-sm">{lead.phone}</td>
                        <td className="p-6"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{lead.type}</span></td>
                        <td className="p-6 text-right">
                          <button onClick={() => window.open(`https://wa.me/55${lead.phone.replace(/\D/g,'')}`, '_blank')} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"><MessageSquare className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-2">Total Recebido</div>
                     <div className="text-2xl font-extrabold text-slate-800">{formatCurrency(financials.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + curr.amount, 0))}</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-2">Pendente</div>
                     <div className="text-2xl font-extrabold text-orange-600">{formatCurrency(financials.filter(f => f.status === 'Aberto').reduce((acc, curr) => acc + curr.amount, 0))}</div>
                  </div>
               </div>
               <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-widest border-b">
                        <tr><th className="p-6">Fatura</th><th className="p-6">Cliente</th><th className="p-6">Valor</th><th className="p-6">Vencimento</th><th className="p-6">Status</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {financials.map(fin => (
                           <tr key={fin.id} className="hover:bg-slate-50 transition">
                              <td className="p-6 font-bold text-slate-800">{fin.title}</td>
                              <td className="p-6 text-slate-500 text-sm">{fin.client}</td>
                              <td className="p-6 font-bold">{formatCurrency(fin.amount)}</td>
                              <td className="p-6 text-slate-400 text-sm">{formatDate(fin.dueDate)}</td>
                              <td className="p-6">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${fin.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{fin.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-widest border-b">
                    <tr><th className="p-6">Ficheiro</th><th className="p-6">Cliente</th><th className="p-6">Data</th><th className="p-6 text-right">Acção</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition">
                        <td className="p-6 font-bold text-slate-800 flex items-center gap-3"><File className="w-4 h-4 text-slate-400" /> {doc.name}</td>
                        <td className="p-6 text-slate-500 text-sm">{doc.client}</td>
                        <td className="p-6 text-slate-400 text-sm">{doc.date}</td>
                        <td className="p-6 text-right">
                          <button onClick={() => doc.url ? window.open(doc.url, '_blank') : alert('Aguarde processamento...')} className="font-extrabold text-xs flex items-center gap-2 ml-auto" style={{ color: tenantConfig.primaryColor }}>
                            <Download className="w-4 h-4" /> Descarregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
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
  const [loadingData, setLoadingData] = useState(false);
  
  const [tenantConfig, setTenantConfig] = useStickyState({
    name: "Pascale Juris",
    primaryColor: "#4f46e5", 
    logoText: "PASCALE JURIS",
    advogado: "Administrador"
  }, 'pascale_tenant_config');
  
  const [cases, setCases] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [leads, setLeads] = useState([]);
  const [documents, setDocuments] = useState([]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('pascale_token');
    setIsAuthenticated(false);
    setCurrentView('landing');
  }, []);

  const fetchCloudData = useCallback(async () => {
    setLoadingData(true);
    const token = localStorage.getItem('pascale_token');
    if (!token) {
        setLoadingData(false);
        return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [casesRes, finRes, leadsRes, docsRes] = await Promise.all([
        fetch(`${API_URL}/cases`, { headers }),
        fetch(`${API_URL}/financials`, { headers }),
        fetch(`${API_URL}/leads`, { headers }),
        fetch(`${API_URL}/documents`, { headers })
      ]);

      if (casesRes.status === 403) throw new Error("Expired");

      setCases(await casesRes.json());
      setFinancials(await finRes.json());
      setLeads(await leadsRes.json());
      setDocuments(await docsRes.json());
    } catch (e) {
      handleLogout();
    } finally {
      setLoadingData(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const savedToken = localStorage.getItem('pascale_token');
    if (savedToken) {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentView === 'dashboard') fetchCloudData();
  }, [isAuthenticated, currentView, fetchCloudData]);

  // Ações de Nuvem
  const addCaseToCloud = async (data) => {
    const token = localStorage.getItem('pascale_token');
    const res = await fetch(`${API_URL}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { fetchCloudData(); return { success: true }; }
    return { success: false, error: "Erro ao salvar" };
  };

  const addFinancialToCloud = async (data) => {
    const token = localStorage.getItem('pascale_token');
    const res = await fetch(`${API_URL}/financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { fetchCloudData(); return { success: true }; }
    return { success: false };
  };

  const moveCaseInCloud = async (id, currentStage) => {
    const next = currentStage === 'peticao' ? 'analise_juiz' : 'sentenca';
    const token = localStorage.getItem('pascale_token');
    await fetch(`${API_URL}/cases/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ stage: next, status: 'Em Andamento' })
    });
    fetchCloudData();
  };

  const uploadDocToCloud = async (formData) => {
    const token = localStorage.getItem('pascale_token');
    const res = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) { fetchCloudData(); return { success: true }; }
    return { success: false };
  };

  const addLeadToCloud = async (leadData) => {
    const res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    if (res.ok && isAuthenticated) fetchCloudData();
  };

  const renderView = () => {
    if (loadingData) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold animate-pulse">Sincronizando com a Nuvem...</div>;
    
    switch(currentView) {
        case 'landing': return <LandingPage onNavigate={setCurrentView} onAddLead={addLeadToCloud} tenantConfig={tenantConfig} />;
        case 'login': return <LoginPage onLogin={(cfg) => { setTenantConfig(cfg); setIsAuthenticated(true); setCurrentView('dashboard'); }} onNavigate={setCurrentView} tenantConfig={tenantConfig} />;
        case 'dashboard': 
            if (isAuthenticated) return <LawyerDashboard cases={cases} onMoveCase={moveCaseInCloud} onAddCase={addCaseToCloud} leads={leads} documents={documents} financials={financials} onAddFinancial={addFinancialToCloud} onAddDocument={uploadDocToCloud} onLogout={handleLogout} tenantConfig={tenantConfig} />;
            return <LoginPage onLogin={(cfg) => { setTenantConfig(cfg); setIsAuthenticated(true); setCurrentView('dashboard'); }} onNavigate={setCurrentView} tenantConfig={tenantConfig} />;
        default: return <LandingPage onNavigate={setCurrentView} onAddLead={addLeadToCloud} tenantConfig={tenantConfig} />;
    }
  };

  return (
    <div className="antialiased min-h-screen bg-slate-50 selection:bg-indigo-100">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
      {renderView()}
    </div>
  );
}