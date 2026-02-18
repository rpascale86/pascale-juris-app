import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, FileText, DollarSign, CheckCircle, 
  Clock, AlertCircle, MessageCircle, Upload, 
  LogOut, Plus, Search, ChevronRight, ChevronLeft, Share2,
  Menu, X, Calendar as CalendarIcon, Lock, Send, Download, File,
  Layout, List, Moon, Sun, ArrowRight, PieChart, Save, Home, 
  Bot, Bell, Sparkles, Briefcase, Gavel, Heart, Building, UserPlus, Phone, Mail,
  Paperclip, Trash2, Image as ImageIcon, Globe, Settings, Shield,
  Edit, Ban, UserCheck, RefreshCw, ShieldCheck,
  TrendingUp, CreditCard, ChevronDown, Award
} from 'lucide-react';

// --- 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS ---

const AUTH_KEY = 'pascale_auth_v20_stable';
const DATA_PREFIX = 'pascale_data_v20_stable_';

const CASE_TEMPLATES = {
  'civel': { label: 'Cível / Família', color: 'blue', icon: Heart, steps: ['Petição Inicial', 'Citação', 'Audiência', 'Sentença'] },
  'trabalhista': { label: 'Trabalhista', color: 'emerald', icon: Briefcase, steps: ['Ajuizamento', 'Audiência Una', 'Perícia', 'Sentença'] },
  'criminal': { label: 'Criminal', color: 'red', icon: Gavel, steps: ['Inquérito', 'Defesa Prévia', 'Instrução', 'Sentença'] },
  'imobiliario': { label: 'Imobiliário', color: 'purple', icon: Building, steps: ['Análise Doc', 'Protocolo', 'Exigências', 'Registro'] }
};

const getRelativeDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const maskPhone = (v) => v ? v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").substring(0, 15) : '';
const maskCPF = (v) => v ? v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").substring(0, 14) : '';

const INITIAL_DEMO_DATA = {
  settings: { name: 'Dra. Pascale', oab: 'SP 123.456', firmName: 'Pascale Juris' },
  team: [
    { id: 1, name: 'Dra. Pascale', role: 'Sócio', email: 'contato@pascale.com' },
    { id: 2, name: 'Dr. Roberto Santos', role: 'Associado', email: 'roberto@pascale.com' }
  ],
  clients: [
    { id: 1, name: 'João Silva Oliveira', email: 'joao@email.com', phone: '11999990000', cpf: '466.832.960-08', createdBy: 'Dra. Pascale', createdAt: '01/01/2024' },
    { id: 2, name: 'Maria F. Costa', email: 'maria@email.com', phone: '11988887777', cpf: '123.456.789-00', createdBy: 'Link Público', createdAt: '15/01/2024' }
  ],
  cases: [
    { 
      id: 101, clientId: 1, title: 'Divórcio Consensual', type: 'civel', 
      status: 'Documentação', startDate: getRelativeDate(-5), progress: 30, 
      assignedTo: 'Dra. Pascale', amount: 5000, 
      steps: [{ id: 1, title: 'Petição Inicial', status: 'completed' }, { id: 2, title: 'Citação', status: 'current' }, { id: 3, title: 'Audiência', status: 'pending' }], 
      attachments: [] 
    },
    { 
      id: 102, clientId: 2, title: 'Ação Trabalhista', type: 'trabalhista', 
      status: 'Triagem', startDate: getRelativeDate(-2), progress: 0, 
      assignedTo: 'Dr. Roberto Santos', amount: 12000, 
      steps: [{ id: 1, title: 'Ajuizamento', status: 'current' }], 
      attachments: [] 
    }
  ],
  financials: [
    { id: 1, caseId: 101, description: 'Honorários Iniciais', amount: 2500, dueDate: getRelativeDate(-5), status: 'paid' },
    { id: 2, caseId: 101, description: 'Parcela Final', amount: 2500, dueDate: getRelativeDate(15), status: 'pending' },
    { id: 3, caseId: 102, description: 'Entrada', amount: 4000, dueDate: getRelativeDate(2), status: 'pending' }
  ]
};

// --- 2. MOTOR SAAS ---
const SaaS = {
  register: (firmName, name, email, password) => {
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    if (users.find(u => u.email === email)) return { error: 'E-mail já registado.' };
    const firmId = 'firm_' + Math.random().toString(36).substr(2, 9);
    const newUser = { id: Date.now(), name, email, password, firmId, firmName };
    users.push(newUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
    return { user: newUser };
  },
  login: (email, password) => {
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    return user ? { user } : { error: 'Credenciais inválidas.' };
  },
  save: (firmId, data) => localStorage.setItem(DATA_PREFIX + firmId, JSON.stringify(data)),
  load: (firmId) => {
    try {
      const data = localStorage.getItem(DATA_PREFIX + firmId);
      return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
  }
};

// --- 3. COMPONENTES DE UI ---

const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    red: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[color]}`}>{children}</span>;
};

const StatCard = ({ icon: Icon, label, val, color }) => {
  const themes = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800",
    red: "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800"
  };
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-56 group hover:border-blue-400 transition-all shadow-sm overflow-hidden">
       <div className={`p-4 rounded-2xl w-fit transition-transform group-hover:scale-110 border ${themes[color]}`}><Icon size={24}/></div>
       <div className="min-w-0">
          <p className="text-2xl lg:text-3xl font-black tracking-tighter tabular-nums text-slate-800 dark:text-white truncate italic" title={String(val)}>{val}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{label}</p>
       </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`flex items-center w-full p-4 rounded-2xl transition-all duration-300 font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 -translate-x-1' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
    <Icon size={18} className="mr-3 shrink-0" />
    <span className="flex-1 text-left uppercase text-[10px] tracking-widest font-black truncate italic">{label}</span>
    {badge > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse ml-2 shadow-lg">{badge}</span>}
  </button>
);

// --- 4. COMPONENTES DE MODAL ---

const ClientModal = ({ onClose, onSave, clientToEdit }) => {
  const [form, setForm] = useState(clientToEdit || { name: '', email: '', phone: '', cpf: '' });
  const [errors, setErrors] = useState({});

  const validateAndSave = (e) => {
     e.preventDefault();
     const newErrors = {};
     if (!form.name || form.name.length < 3) newErrors.name = "Nome inválido";
     if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
     onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[400] p-6 backdrop-blur-xl animate-in fade-in">
      <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-slate-200">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase italic text-slate-800"><UserPlus className="text-blue-600" size={32}/> {clientToEdit ? 'Editar' : 'Novo'} Cliente</h2>
        <form onSubmit={validateAndSave} className="space-y-4">
          <div>
            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:border-blue-600 transition-all" placeholder="Nome Completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            {errors.name && <p className="text-red-500 text-xs mt-1 ml-2 font-bold">{errors.name}</p>}
          </div>
          <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:border-blue-600 transition-all" placeholder="CPF" value={form.cpf} onChange={e => setForm({...form, cpf: maskCPF(e.target.value)})} maxLength={14} />
          <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:border-blue-600 transition-all" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} maxLength={15} />
          <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:border-blue-600 transition-all" placeholder="E-mail" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl mt-4 active:scale-95 transition-all uppercase tracking-widest text-xs">SALVAR CLIENTE</button>
          <button type="button" onClick={onClose} className="w-full text-slate-400 text-[10px] font-black uppercase py-4">Voltar</button>
        </form>
      </div>
    </div>
  );
};

const NewCaseModal = ({ clients, team, onClose, onSave, onNewClient }) => {
  const [form, setForm] = useState({ clientId: clients[0]?.id || '', title: '', type: 'civel', assignedTo: team[0]?.name || '', amount: '' });
  
  const renderTemplateIcon = (tplKey) => {
      const Icon = CASE_TEMPLATES[tplKey].icon;
      return <Icon size={20} className="mb-2 opacity-80"/>;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[400] p-6 backdrop-blur-xl animate-in fade-in">
      <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-black mb-8 italic uppercase text-slate-800 flex items-center gap-3"><Plus className="text-blue-600" size={32}/> Iniciar Processo</h2>
        <div className="space-y-5">
          <div className="flex gap-2">
            <select className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-slate-700" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={onNewClient} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><UserPlus size={20}/></button>
          </div>
          <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 text-slate-700" placeholder="Título da Ação" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-3">
             {Object.entries(CASE_TEMPLATES).map(([key, tpl]) => (
                <button 
                    key={key} 
                    onClick={() => setForm({...form, type: key})}
                    className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${form.type === key ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                >
                    {renderTemplateIcon(key)}
                    <span className="text-[10px] font-black uppercase tracking-widest">{tpl.label.split('/')[0]}</span>
                </button>
             ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <input type="number" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-slate-700" placeholder="Valor R$" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
             <select className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-slate-700" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
                {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
             </select>
          </div>

          <button onClick={() => onSave(form)} className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] mt-4 active:scale-95 transition-all uppercase tracking-widest text-xs">Abrir Processo Agora</button>
          <button onClick={onClose} className="w-full text-slate-400 text-[10px] font-black uppercase py-4">Voltar</button>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firmName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleDemo = () => onLogin({ id: 999, name: 'Dra. Pascale Demo', firmId: 'firm_demo', firmName: 'Pascale Juris Demo' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'register') {
      const res = SaaS.register(form.firmName, form.name, form.email, form.password);
      if (res.error) setError(res.error); else onLogin(res.user);
    } else {
      const res = SaaS.login(form.email, form.password);
      if (res.error) setError(res.error); else onLogin(res.user);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl w-fit mx-auto shadow-lg mb-4 text-white shadow-blue-500/20"><ShieldCheck size={32} /></div>
            <h1 className="text-3xl font-black tracking-tighter italic">Pascale Juris</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">SaaS Pro Suite</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button onClick={() => setMode('login')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition ${mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Entrar</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition ${mode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Registar</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Nome do Escritório" value={form.firmName} onChange={e => setForm({...form, firmName: e.target.value})} />
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Seu Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </>
          )}
          <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="E-mail profissional" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input required type="password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Senha" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-black rounded-lg border border-red-100 text-center">{error}</div>}
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest">Acessar</button>
          <button type="button" onClick={handleDemo} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 flex items-center justify-center gap-2">⚡ Modo Demonstração</button>
        </form>
      </div>
    </div>
    </div>
  );
};

// --- 6. DASHBOARD PRINCIPAL ---

const LawyerDashboard = ({ db, setDb, onLogout, onViewPublicLink }) => {
  const [view, setView] = useState('home');
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modais
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const notify = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };
  const update = (newDb) => { setDb(newDb); SaaS.save(db.firmId, newDb); };

  const metrics = useMemo(() => {
    if(!db) return { active: 0, paid: 0, pending: 0, triagem: 0 };
    const active = db.cases.filter(c => c.status !== 'Finalizado').length;
    const paid = db.financials.filter(f => f.status === 'paid').reduce((a, b) => a + b.amount, 0);
    const pending = db.financials.filter(f => f.status === 'pending').reduce((a, b) => a + b.amount, 0);
    const triagem = db.cases.filter(c => c.status === 'Triagem').length;
    return { active, paid, pending, triagem };
  }, [db]);

  const handleSaveClient = (data) => {
    let nDb;
    if (editTarget) {
      nDb = { ...db, clients: db.clients.map(c => c.id === editTarget.id ? { ...c, ...data } : c) };
    } else {
      nDb = { ...db, clients: [...db.clients, { id: Date.now(), ...data, createdBy: db.settings.name, createdAt: new Date().toLocaleDateString() }] };
    }
    update(nDb); setIsClientOpen(false); setEditTarget(null); notify("Cadastro atualizado.");
  };

  const handleCreateCase = (data) => {
    const tpl = CASE_TEMPLATES[data.type];
    const newCase = {
      id: Date.now(),
      clientId: parseInt(data.clientId),
      title: data.title,
      type: data.type,
      status: 'Triagem',
      progress: 0,
      assignedTo: data.assignedTo,
      amount: parseFloat(data.amount) || 0,
      startDate: new Date().toISOString().split('T')[0],
      steps: tpl.steps.map((s, i) => ({ id: i, title: s, status: i === 0 ? 'current' : 'pending' })),
      attachments: []
    };
    const newFinancials = [
      { id: Date.now() + 1, caseId: newCase.id, description: 'Honorários Iniciais', amount: newCase.amount / 2, dueDate: getRelativeDate(0), status: 'pending' },
      { id: Date.now() + 2, caseId: newCase.id, description: 'Honorários Finais', amount: newCase.amount / 2, dueDate: getRelativeDate(30), status: 'pending' }
    ];
    update({ ...db, cases: [...db.cases, newCase], financials: [...db.financials, ...newFinancials] });
    setIsCaseOpen(false); setView('kanban'); notify("Processo iniciado.");
  };

  if (!db) return null;

  const filteredCases = db.cases.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`flex h-screen overflow-hidden transition-all duration-500 ${dark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F9FAFB] text-slate-900'}`}>
      
      {notification && (
        <div className={`fixed top-8 right-8 z-[500] p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-full ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
           {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
           <p className="font-bold text-sm">{notification.msg}</p>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-72 hidden md:flex flex-col border-r transition-all ${dark ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200'}`}>
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14 group">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20"><Shield size={24}/></div>
            <div className="min-w-0">
               <h2 className="font-black text-lg tracking-tighter truncate leading-none uppercase italic">{db.settings.firmName}</h2>
               <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1.5 block opacity-60">Admin Panel</span>
            </div>
          </div>
          <nav className="space-y-2">
            <SidebarItem icon={Home} label="Dashboard" active={view === 'home'} onClick={() => {setSelectedCase(null); setView('home')}} />
            <SidebarItem icon={Layout} label="Kanban" active={view === 'kanban'} onClick={() => {setSelectedCase(null); setView('kanban')}} badge={metrics.triagem} />
            <SidebarItem icon={Users} label="Clientes" active={view === 'clients'} onClick={() => {setSelectedCase(null); setView('clients')}} />
            <SidebarItem icon={PieChart} label="Financeiro" active={view === 'analytics'} onClick={() => {setSelectedCase(null); setView('analytics')}} />
          </nav>
        </div>
        <div className="mt-auto p-8 space-y-4">
           <button onClick={onViewPublicLink} className="w-full p-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:-translate-y-1">
              <Globe size={16}/> Link de Lead
           </button>
           <div className="flex items-center justify-between px-2 pt-4 border-t dark:border-slate-800">
            <button onClick={() => setDark(!dark)} className="p-3 text-slate-400 hover:text-blue-600 transition-colors">{dark ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-600 transition-colors font-black uppercase text-[10px] tracking-widest flex items-center gap-2">Sair <LogOut size={16}/></button>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-24 flex items-center justify-between px-10 lg:px-14 shrink-0 border-b dark:border-slate-800 bg-transparent backdrop-blur-md z-20">
           <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl px-6 py-3 w-full max-w-sm border border-slate-100 dark:border-slate-700 shadow-sm focus-within:border-blue-500 transition-all">
              <Search size={18} className="text-slate-400 mr-3"/><input className="bg-transparent outline-none text-xs w-full font-bold placeholder:text-slate-300" placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} />
           </div>
           <div className="flex items-center gap-6">
              <button onClick={() => setIsCaseOpen(true)} className="flex items-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Novo Processo</button>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg border-4 border-white dark:border-slate-800 italic shrink-0">{db.settings.name.charAt(0)}</div>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-10 lg:p-14">
          
          {/* HOME VIEW */}
          {view === 'home' && !selectedCase && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-slate-800 dark:text-white">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard label="Ações Ativas" val={metrics.active} icon={Briefcase} color="blue" />
                  <StatCard label="Total Liquidado" val={formatBRL(metrics.paid)} icon={TrendingUp} color="emerald" />
                  <StatCard label="Pendente" val={formatBRL(metrics.pending)} icon={DollarSign} color="red" />
               </div>
               
               <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 dark:text-white"><Clock size={180}/></div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-4 mb-10 text-slate-800 dark:text-white"><Clock className="text-blue-600" size={28}/> Agenda Prioritária</h3>
                  <div className="space-y-4">
                    {db.cases.flatMap(c => c.steps.filter(s => s.status === 'current').map(s => (
                       <div key={`${c.id}-${s.id}`} onClick={() => setSelectedCase(c)} className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all">
                          <div className="flex items-center gap-8 min-w-0">
                             <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse group-hover:scale-150 transition-all shrink-0"></div>
                             <div className="min-w-0">
                                <p className="font-black uppercase text-sm tracking-widest truncate mb-2 text-slate-800 dark:text-white">{s.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate italic">Ref: {c.title}</p>
                             </div>
                          </div>
                          <Badge color="blue">{c.assignedTo}</Badge>
                       </div>
                    )))}
                    {metrics.active === 0 && <div className="py-24 text-center text-slate-200 font-black uppercase text-xl italic tracking-tighter">Nada para hoje. Relaxe!</div>}
                  </div>
               </div>
            </div>
          )}

          {/* KANBAN VIEW */}
          {view === 'kanban' && !selectedCase && (
            <div className="h-full flex flex-col md:flex-row gap-8 overflow-x-auto pb-6">
               {['Triagem', 'Documentação', 'Em Andamento', 'Finalizado'].map(status => (
                 <div key={status} className="md:w-80 w-full flex flex-col rounded-[3rem] bg-white/40 dark:bg-slate-950/20 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center italic">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{status}</span>
                       <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-[10px] font-black text-slate-500 border">{db.cases.filter(x=>x.status===status).length}</span>
                    </div>
                    <div className="p-5 space-y-5 overflow-y-auto">
                       {filteredCases.filter(x=>x.status===status).map(c => (
                         <div key={c.id} onClick={() => setSelectedCase(c)} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-400 hover:-translate-y-1 transition-all group active:scale-[0.98] cursor-pointer">
                            <div className="flex justify-between mb-5">
                               <Badge color={CASE_TEMPLATES[c.type]?.color || 'blue'}>{c.type}</Badge>
                               <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 border dark:border-slate-700 shrink-0">{c.assignedTo.charAt(0)}</div>
                            </div>
                            <h4 className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-tight mb-3 leading-tight group-hover:text-blue-600 transition-colors">{c.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate italic opacity-60">{db.clients.find(cl=>cl.id===c.clientId)?.name}</p>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* CLIENTS VIEW */}
          {view === 'clients' && (
             <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic text-slate-800 dark:text-white">Clientes</h2>
                  <button onClick={() => {setEditTarget(null); setIsClientOpen(true)}} className="bg-blue-600 text-white px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Novo Cliente</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {db.clients.map(cl => (
                    <div key={cl.id} className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 flex flex-col shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all h-full relative overflow-hidden group">
                       <div className="flex items-center gap-6 mb-10 relative z-10">
                          <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-xl border-8 border-slate-50 dark:border-slate-700 shrink-0 italic uppercase">{cl.name.charAt(0)}</div>
                          <div className="min-w-0">
                             <h4 className="font-black text-2xl text-slate-800 dark:text-white truncate uppercase tracking-tighter italic leading-[1.1] mb-2">{cl.name}</h4>
                             <Badge color="blue">{cl.cpf}</Badge>
                          </div>
                       </div>
                       <div className="space-y-4 flex-1 mb-10 relative z-10">
                          <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900 border rounded-[1.8rem] border-slate-100 dark:border-slate-800 group-hover:bg-white transition-colors">
                             <Phone size={18} className="text-blue-600 shrink-0"/>
                             <span className="text-sm font-black uppercase text-slate-700 dark:text-slate-300">{maskPhone(cl.phone)}</span>
                          </div>
                          <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900 border rounded-[1.8rem] border-slate-100 dark:border-slate-800 group-hover:bg-white transition-colors">
                             <Mail size={18} className="text-blue-600 shrink-0"/>
                             <span className="text-sm font-black truncate text-slate-700 dark:text-slate-300 italic">{cl.email}</span>
                          </div>
                       </div>
                       <div className="pt-8 border-t dark:border-slate-700 flex gap-4 mt-auto relative z-10">
                          <button onClick={() => {setEditTarget(cl); setIsClientOpen(true)}} className="flex-1 py-4 bg-slate-950 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Editar Ficha</button>
                          <button onClick={() => {if(window.confirm('Eliminar cliente?')) update({...db, clients: db.clients.filter(x=>x.id!==cl.id)})}} className="p-5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl transition-all border border-red-100 active:scale-95"><Trash2 size={20}/></button>
                       </div>
                    </div>
                  ))}
               </div>
             </div>
          )}

          {/* FINANCEIRO VIEW */}
          {view === 'analytics' && (
             <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
                <div className="bg-slate-900 rounded-[4rem] p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden border border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-12">
                   <div className="absolute top-0 right-0 p-20 opacity-5 -rotate-12 text-white"><PieChart size={500}/></div>
                   <div className="relative z-10 flex-1">
                      <h3 className="text-xs font-black uppercase tracking-[0.6em] text-slate-500 mb-6 italic">Lucro Realizado</h3>
                      <div className="text-7xl lg:text-9xl font-black tracking-tighter tabular-nums truncate leading-none italic">{formatBRL(metrics.paid)}</div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:border-l border-slate-800 lg:pl-16 relative z-10 shrink-0">
                      <div><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Previsão</p><p className="text-4xl font-black text-blue-400 tabular-nums leading-none">{formatBRL(metrics.pending)}</p></div>
                      <div><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Total Ações</p><p className="text-4xl font-black leading-none">{db.cases.length}</p></div>
                   </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border p-12 shadow-sm border-slate-100 dark:border-slate-700">
                   <h3 className="text-xl font-black mb-12 flex items-center gap-4 uppercase tracking-widest italic text-slate-800 dark:text-white leading-none"><RefreshCw className="text-blue-600"/> Contas a Liquidar</h3>
                   <div className="space-y-4">
                      {db.financials.filter(f=>f.status==='pending').map(f => (
                          <div key={f.id} className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-8 group hover:border-blue-300 transition-all shadow-sm">
                             <div className="flex-1 min-w-0 text-center lg:text-left">
                                <p className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic mb-2 truncate">{f.description}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Vencimento: {f.dueDate}</p>
                             </div>
                             <div className="flex flex-col sm:flex-row items-center gap-10">
                                <p className="font-black text-4xl text-slate-800 dark:text-white tabular-nums tracking-tighter italic">{formatBRL(f.amount)}</p>
                                <button onClick={() => { update({...db, financials: db.financials.map(x=>x.id===f.id?{...x, status:'paid'}:x)}) }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">Liquidar</button>
                             </div>
                          </div>
                      ))}
                      {db.financials.filter(f=>f.status==='pending').length === 0 && <div className="py-24 text-center opacity-30 font-black text-2xl italic tracking-tighter uppercase">Tudo em dia</div>}
                   </div>
                </div>
             </div>
          )}

          {/* CASE DETAILS */}
          {selectedCase && (
            <div className="max-w-6xl mx-auto pb-24 animate-in slide-in-from-right duration-500 text-slate-800 dark:text-white">
               <button onClick={() => setSelectedCase(null)} className="mb-10 flex items-center text-[11px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-[0.3em]"><ChevronLeft size={16} className="mr-2"/> Painel de Gestão</button>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-12">
                     <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-16 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5"><Award size={250}/></div>
                        <Badge color="blue">{selectedCase.type}</Badge>
                        <h1 className="text-4xl lg:text-5xl font-black leading-[1] mt-8 mb-16 tracking-tighter italic uppercase">{selectedCase.title}</h1>
                        <div className="flex flex-wrap items-center gap-16 pt-12 border-t dark:border-slate-800">
                           <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Advogado</p><Badge color="blue">{selectedCase.assignedTo}</Badge></div>
                           <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Contrato</p><p className="text-4xl font-black text-emerald-600 tracking-tighter italic leading-none tabular-nums">{formatBRL(selectedCase.amount)}</p></div>
                        </div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-2xl font-black mb-14 flex items-center gap-5 uppercase italic tracking-tighter italic text-blue-600">Workflow do Processo</h3>
                        <div className="space-y-14 relative pl-10">
                           <div className="absolute left-[47px] top-4 bottom-10 w-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                           {selectedCase.steps.map((s, i) => (
                              <div key={i} className="flex gap-14 relative z-10 group">
                                 <div className={`w-16 h-16 shrink-0 rounded-[1.8rem] flex items-center justify-center border-4 z-10 transition-all duration-500 shadow-2xl ${s.status === 'completed' ? 'bg-emerald-500 border-emerald-100 text-white' : s.status === 'current' ? 'bg-blue-600 border-blue-100 text-white ring-[18px] ring-blue-50 dark:ring-blue-900/20 shadow-blue-500/40' : 'bg-white dark:bg-slate-900 border-slate-100'}`}>
                                    {s.status === 'completed' ? <CheckCircle size={28}/> : <span className="text-lg font-black italic">{i+1}</span>}
                                 </div>
                                 <div className="flex-1 pt-4">
                                    <h4 className={`text-2xl font-black uppercase tracking-tight ${s.status === 'pending' ? 'text-slate-200 dark:text-slate-700' : 'text-slate-800 dark:text-white'}`}>{s.title}</h4>
                                    {s.status === 'current' && (
                                       <button onClick={() => {
                                          const nSteps = selectedCase.steps.map((st, idx) => idx === i ? {...st, status:'completed'} : (idx === i + 1 ? {...st, status:'current'} : st));
                                          const nProg = Math.round((nSteps.filter(x=>x.status==='completed').length / nSteps.length)*100);
                                          const nDb = {...db, cases: db.cases.map(c => c.id === selectedCase.id ? {...c, steps: nSteps, progress: nProg, status: nProg === 100 ? 'Finalizado' : c.status} : c)};
                                          update(nDb); setSelectedCase(nDb.cases.find(x=>x.id===selectedCase.id));
                                          notify("Workflow atualizado!");
                                       }} className="mt-10 bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">CONCLUIR FASE AGORA</button>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-10">
                     <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border shadow-sm border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-10">
                           <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3 italic text-blue-600">GED Ficheiros</h3>
                           <button className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-600 hover:text-white transition-all border text-blue-600"><Plus size={20}/></button>
                        </div>
                        <div className="py-24 text-center border-2 border-dashed rounded-[3rem] border-slate-100 dark:border-slate-800 text-slate-300 font-black uppercase text-[10px] tracking-widest opacity-60 italic">Repositório Vazio</div>
                     </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* MODALS */}
      {isClientOpen && <ClientModal onClose={() => setIsClientOpen(false)} onSave={handleSaveClient} clientToEdit={editTarget} />}
      {isCaseOpen && <NewCaseModal clients={db.clients} team={db.team} onClose={() => setIsCaseOpen(false)} onSave={handleCreateCase} onNewClient={() => {setIsCaseOpen(false); setIsClientOpen(true)}} />}
    </div>
  );
};

// --- 7. ENTRY POINT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [publicView, setPublicView] = useState(false);

  const handleLogin = (u) => {
    setUser(u);
    const data = SaaS.load(u.firmId);
    if (data) {
      setDb({ ...data, firmId: u.firmId });
    } else {
      const initial = { 
        ...INITIAL_DEMO_DATA, 
        team: [{ id: Date.now(), name: u.name, role: 'Sócio', email: u.email }], 
        settings: { ...INITIAL_DEMO_DATA.settings, firmName: u.firmName, name: u.name }, 
        firmId: u.firmId 
      };
      setDb(initial); SaaS.save(u.firmId, initial);
    }
  };

  if (publicView) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="bg-white p-20 rounded-[4rem] shadow-2xl max-w-2xl text-center border border-slate-200 animate-in zoom-in-95">
         <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/40"><Globe size={48} className="animate-pulse"/></div>
         <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-8">Pascale Juris</h1>
         <p className="text-slate-500 text-lg mb-14 leading-relaxed font-bold italic">Link de admissão para o jurídico da <strong>{db?.settings?.firmName || 'Nossa Advocacia'}</strong>.</p>
         <div className="flex flex-col gap-4">
            <button onClick={() => alert('Consulta agendada!')} className="w-full bg-blue-600 text-white py-7 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-widest active:scale-95">Iniciar Consulta Digital</button>
            <button onClick={() => setPublicView(false)} className="py-6 text-slate-400 font-black uppercase text-xs tracking-[0.4em] hover:text-slate-600 transition-colors leading-none">Voltar ao Painel Interno</button>
         </div>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin} />;
  return <LawyerDashboard db={db} setDb={setDb} onViewPublicLink={() => setPublicView(true)} onLogout={() => setUser(null)} />;
}