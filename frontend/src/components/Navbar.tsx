import React from 'react';
import {
  Activity,
  Users,
  LayoutDashboard,
  Tv,
  Video,
  MessageSquare,
  Code2,
  ShieldCheck,
  Building2
} from 'lucide-react';

export type ActiveTab = 'citizen' | 'dashboard' | 'totem' | 'telehealth' | 'whatsapp' | 'api';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unitsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, unitsCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & City Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('citizen')}>
            <div className="bg-gradient-to-tr from-cyan-600 to-blue-700 p-2 rounded-xl text-white shadow-md shadow-cyan-600/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-700 to-blue-800 bg-clip-text text-transparent">
                  FlowCity Saúde
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Novo Hamburgo / RS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Inteligência de Fluxo & Regulação do SUS
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'citizen'
                  ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Portal do Cidadão
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Painel Regulação / SAMU
            </button>

            <button
              onClick={() => setActiveTab('totem')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'totem'
                  ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Totem Recepção
            </button>

            <button
              onClick={() => setActiveTab('telehealth')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'telehealth'
                  ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Teleconsulta & Especialistas
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Bot
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'api'
                  ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              API Aberta
            </button>
          </nav>

          {/* Network Live Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{unitsCount} Unidades Ativas</span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-slate-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>LGPD by Design</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 gap-2 border-t border-slate-100 bg-slate-50">
        <button
          onClick={() => setActiveTab('citizen')}
          className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
            activeTab === 'citizen' ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 border'
          }`}
        >
          Cidadão
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 border'
          }`}
        >
          Regulação/SAMU
        </button>
        <button
          onClick={() => setActiveTab('totem')}
          className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
            activeTab === 'totem' ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 border'
          }`}
        >
          Totem
        </button>
        <button
          onClick={() => setActiveTab('telehealth')}
          className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
            activeTab === 'telehealth' ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 border'
          }`}
        >
          Teleconsulta
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
            activeTab === 'whatsapp' ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 border'
          }`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
            activeTab === 'api' ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 border'
          }`}
        >
          API
        </button>
      </div>
    </header>
  );
};
