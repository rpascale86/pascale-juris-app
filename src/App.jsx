import React, { useState, useEffect, useRef } from 'react';
import { 
  Gavel, Users, FileText, MessageSquare, Bell, Search, Menu, 
  CheckCircle, Clock, AlertTriangle, ChevronRight, ArrowRight, 
  ShieldCheck, Smartphone, LogOut, Activity, Plus, Send, X, 
  UploadCloud, File, Paperclip, Mic, Lock, Download, DollarSign, 
  CreditCard, TrendingUp
} from 'lucide-react';

// --- CONFIGURAÇÃO ---
const API_URL = 'https://pascale-juris-app.onrender.com/api'; 

const TENANT_CONFIG = {
  name: "Lopes & Associados",
  primaryColor: "bg-indigo-900",
  secondaryColor: "text-indigo-900",
  logoText: "LOPES JURIS",
};

// --- DADOS DE FALLBACK (MODO DEMO/OFFLINE) ---
const DEFAULT_CASES = [
  {
    id: 1,
    client: { name: "Carlos Silva", phone: "5511999999999" },
    title: "Acção de Indemnização vs Banco X",
    status: "Em Andamento",
    stage: "analise_juiz",
    anxietyScore: 85,
    timeline: [
      { id: 1, title: "Petição Inicial", description: "Enviámos o seu pedido ao juiz.", date: "10/01/2024", completed: true },
      { id: 2, title: "Análise do Juiz", description: "O juiz está a ler os argumentos.", date: "Hoje", completed: false }
    ]
  }
];

// --- COMPONENTES AUXILIARES ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- TELAS ---

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="bg-indigo-900 p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white"><Gavel className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold text-white">{TENANT_CONFIG.logoText}</h1>
          <p className="text-indigo-200 text-sm">Acesso Restrito</p>
        </div>
        <div className="p-8">
          <button onClick={() => { setLoading(true); setTimeout(onLogin, 1000); }} disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition flex justify-center items-center">
            {loading ? "A conectar..." : "Entrar como Admin"}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  <div className="font-sans text-slate-800 bg-white min-h-screen flex flex-col pb-24 md:pb-0">
    <header className="px-4 md:px-6 py-4 flex justify-between items-center border-b shadow-sm sticky top-0 bg-white z-50">
      <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-indigo-900 cursor-pointer" onClick={() => onNavigate('login')}><Gavel className="w-5 h-5 md:w-6 md:h-6" />{TENANT_CONFIG.logoText}</div>
      <button onClick={() => onNavigate('portal')} className="px-3 py-2 md:px-4 md:py-2 bg-indigo-100 text-indigo-900 rounded-lg text-sm md:text-base font-medium hover:bg-indigo-200 transition">Área do Cliente</button>
    </header>
    
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Iniciar Consulta Gratuita">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-bold text-slate-700 mb-1">Nome</label><input required className="w-full p-3 border rounded-lg outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
        <div><label className="block text-sm font-bold text-slate-700 mb-1">Telemóvel (WhatsApp)</label><input required className="w-full p-3 border rounded-lg outline-none" placeholder="Ex: 11999999999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg">Enviar</button>
      </form>
    </Modal>

    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-6 py-10">
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 md:mb-6">Advocacia <span className="text-indigo-600 block md:inline">Conectada.</span></h1>
      <p className="text-base md:text-lg text-slate-600 max-w-2xl mb-8">Acesso transparente e em tempo real ao seu processo. A justiça à distância de um clique.</p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">Iniciar Consulta</button>
        <button onClick={() => onNavigate('portal')} className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-indigo-600 transition">Ver Portal (Cliente)</button>
      </div>
    </main>
  </div>
  );
};

const ClientPortal = ({ onNavigate, caseData }) => {
  if (!caseData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <Activity className="w-12 h-12 mb-4 text-slate-300 animate-spin" />
      <p>A aguardar sincronização...</p>
      <button onClick={() => onNavigate('landing')} className="mt-4 text-indigo-600 font-bold hover:underline">Voltar</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28">
      <div className={`${TENANT_CONFIG.primaryColor} text-white p-6 pb-12 rounded-b-[2rem] shadow-lg`}>
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => onNavigate('landing')}><ArrowRight className="w-5 h-5 rotate-180" /></button>
           <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-70">Portal do Cliente</span>
           <Bell className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mb-3 shadow-xl ring-4 ring-white/10">CS</div>
           <h1 className="text-xl md:text-2xl font-bold text-center">Olá, {caseData.client?.name || 'Cliente'}</h1>
           <p className="opacity-70 text-xs md:text-sm mt-1 text-center">Dados atualizados em tempo real.</p>
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-6 md:-mt-8 space-y-4 md:space-y-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl border border-slate-100 animate-fade-in relative overflow-hidden">
           <div className="absolute right-0 top-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full"></div>
           <div className="flex justify-between items-start mb-4">
             <div className="relative z-10 pr-6">
               <span className="text-[9px] md:text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Processo Ativo</span>
               <h2 className="text-base md:text-lg font-bold text-slate-800 mt-2 leading-tight">{caseData.title}</h2>
             </div>
             <Activity className="w-5 h-5 text-green-500 animate-pulse flex-shrink-0" />
           </div>
        </div>

        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-5 md:mb-6 flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-indigo-600" /> Linha do Tempo</h3>
          <div className="space-y-6 md:space-y-8 relative">
            <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
            {caseData.timeline && caseData.timeline.map((step) => (
              <div key={step.id} className="relative z-10 flex gap-3 md:gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-white ${step.completed ? 'border-green-500 text-green-500 bg-green-50' : 'border-slate-200'}`}>
                  {step.completed && <CheckCircle className="w-3 h-3 fill-current" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold block">{step.date}</span>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LawyerDashboard = ({ onNavigate, cases, onMoveCase, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🟢 FUNÇÃO MÁGICA DO WHATSAPP
  const handleWhatsAppClick = (caseItem) => {
    const phone = caseItem.client?.phone || "5511900000000"; 
    const name = caseItem.client?.name || "Cliente";
    const message = `Olá, ${name}. Aqui é do escritório ${TENANT_CONFIG.logoText}. Gostaríamos de lhe dar uma rápida atualização sobre o seu processo (${caseItem.title}). A fase atual encontra-se em: ${caseItem.stage}. Estamos à disposição para qualquer dúvida!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      
      {/* OVERLAY MOBILE */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`absolute md:relative z-50 h-full w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel className="w-5 h-5 text-white" />
            <span className="font-extrabold text-white text-base md:text-lg truncate">BACKEND ON</span>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 md:p-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-lg"><Activity className="w-5 h-5 flex-shrink-0" /> <span className="text-sm font-bold truncate">Processos (API)</span></button>
        </nav>
        <div className="p-4 md:p-6 border-t border-slate-800"><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:text-white transition hover:bg-white/5"><LogOut className="w-4 h-4 flex-shrink-0" /> Sair</button></div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 md:h-20 bg-white border-b flex items-center justify-between px-4 md:px-10 shadow-sm z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-600" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-lg md:text-2xl text-slate-800 truncate">Gestão em Tempo Real</h1>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs md:text-sm shadow-inner flex-shrink-0">ML</div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-10 bg-slate-50 pb-28 md:pb-10">
          {cases.length === 0 ? (
            <div className="text-center text-slate-400 py-20">
              <Activity className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-300" />
              <p className="text-sm">A aguardar dados da nuvem...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {cases.map(c => (
                <div key={c.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition group flex flex-col justify-between">
                   <div>
                     <div className="flex justify-between items-start mb-4">
                       <span className="text-[9px] md:text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{c.status}</span>
                       
                       {/* ⚠️ ÍCONE DE ANSIEDADE COM TOOLTIP */}
                       {c.anxietyScore > 70 && (
                         <div className="relative group/tooltip cursor-help">
                           <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                           <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl z-50 text-center pointer-events-none">
                             Cliente ansioso ou sem contato há muito tempo. Priorize o atendimento.
                           </div>
                         </div>
                       )}
                     </div>

                     <h3 className="font-extrabold text-slate-800 text-base md:text-lg mb-1">{c.client?.name}</h3>
                     <p className="text-xs text-slate-500 mb-4 line-clamp-2">{c.title}</p>
                     
                     <div className="mb-4">
                        <span className="text-[11px] md:text-xs text-slate-400">Fase atual: <span className="font-bold text-slate-700">{c.stage}</span></span>
                     </div>
                   </div>

                   {/* BARRA DE AÇÕES INFERIOR */}
                   <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
                      <button 
                        onClick={() => handleWhatsAppClick(c)} 
                        className="flex-1 md:flex-none flex justify-center items-center gap-1 text-[10px] md:text-[11px] font-bold text-green-600 bg-green-50 px-2 py-2 rounded-lg hover:bg-green-100 transition whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Avisar</span>
                      </button>

                      <button onClick={() => onMoveCase(c.id)} className="flex-1 md:flex-none text-[10px] bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md whitespace-nowrap text-center">
                        Avançar Fase ➔
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- APP PRINCIPAL (CONECTADO) ---

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cases, setCases] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 📡 1. BUSCAR DADOS
  useEffect(() => {
    const fetchCases = async () => {
      try {
        console.log("📡 A conectar à Vercel/Render...");
        const response = await fetch(`${API_URL}/cases`);
        if (!response.ok) throw new Error('Erro servidor');
        const data = await response.json();
        setCases(data);
      } catch (error) {
        console.warn("⚠️ Servidor inacessível. MODO DEMO ativado.");
        setCases(DEFAULT_CASES);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // 📡 2. GRAVAR DADOS (MOVER PROCESSO)
  const moveCase = async (caseId) => {
    const originalCases = [...cases];
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, stage: 'sentenca', status: 'Concluído' } : c));

    try {
      const response = await fetch(`${API_URL}/cases/${caseId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'sentenca', status: 'Concluído' })
      });
      if (!response.ok) throw new Error('Falha ao gravar');
      console.log("✅ Mudança gravada na base de dados!");
    } catch (e) {
      console.error("Erro de gravação", e);
      setCases(originalCases);
      alert("Não foi possível salvar a alteração. Verifique a internet.");
    }
  };

  // 📡 3. GRAVAR DADOS (NOVO LEAD)
  const addLead = async (leadData) => {
    try {
      await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      console.log("✅ Lead enviado para o servidor");
    } catch (e) {
      console.error("Erro ao enviar lead", e);
    }
  };

  const renderView = () => {
    switch(currentView) {
      case 'landing': return <LandingPage onNavigate={setCurrentView} onAddLead={addLead} />;
      case 'login': return <LoginPage onLogin={() => { setIsAuthenticated(true); setCurrentView('dashboard'); }} />;
      case 'portal': return <ClientPortal onNavigate={setCurrentView} caseData={cases[0]} />;
      case 'dashboard': 
        if (!isAuthenticated) return <LoginPage onLogin={() => { setIsAuthenticated(true); setCurrentView('dashboard'); }} />;
        return <LawyerDashboard onNavigate={setCurrentView} cases={cases} onMoveCase={moveCase} onLogout={() => { setIsAuthenticated(false); setCurrentView('login'); }} />;
      default: return <LandingPage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="antialiased min-h-screen relative selection:bg-indigo-200">
      
      {/* BARRA DE CONTROLO MASTER - OTIMIZADA PARA MOBILE */}
      <div className="fixed bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-auto z-[200] bg-slate-950/95 backdrop-blur-2xl text-white px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-wrap justify-center md:justify-start gap-2 md:gap-8 items-center border border-white/10 ring-1 ring-white/10">
        <span className="hidden md:inline text-slate-600 text-[11px] uppercase tracking-[0.3em] border-r border-slate-800 pr-8 py-1">SERVER MODE</span>
        <button onClick={() => setCurrentView('landing')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl transition text-[10px] md:text-[11px] font-extrabold ${currentView === 'landing' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>1. SITE</button>
        <button onClick={() => setCurrentView('portal')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl transition text-[10px] md:text-[11px] font-extrabold ${currentView === 'portal' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>2. PORTAL</button>
        <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl transition text-[10px] md:text-[11px] font-extrabold ${currentView === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>3. PAINEL</button>
      </div>

      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
          <Activity className="w-10 h-10 md:w-12 md:h-12 text-indigo-500 animate-spin mb-4" />
          <p className="font-bold tracking-widest uppercase text-[10px] md:text-xs">A Sincronizar com a Nuvem...</p>
        </div>
      ) : (
        renderView()
      )}
    </div>
  );
}