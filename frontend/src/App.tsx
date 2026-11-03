import React, { useState, useEffect } from 'react';
import { HealthUnit, UnitLiveState } from './types.ts';
import { fetchUnits, fetchStates, subscribeToLiveStates } from './services/api.ts';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { CitizenView } from './views/CitizenView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { TotemView } from './views/TotemView.tsx';
import { TelehealthView } from './views/TelehealthView.tsx';
import { WhatsAppBotView } from './views/WhatsAppBotView.tsx';
import { ApiDocsView } from './views/ApiDocsView.tsx';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('citizen');
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [states, setStates] = useState<UnitLiveState[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTelehealthId, setCurrentTelehealthId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function init() {
      try {
        const [unitsRes, statesRes] = await Promise.all([fetchUnits(), fetchStates()]);
        setUnits(unitsRes.unidades);
        setStates(statesRes.unidades);
      } catch (err) {
        console.error('Erro na inicialização:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    // Inicia assinatura em tempo real de telemetria
    const unsubscribe = subscribeToLiveStates((updatedStates) => {
      setStates(updatedStates);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenTelehealth = (appointmentId?: string) => {
    setCurrentTelehealthId(appointmentId);
    setActiveTab('telehealth');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unitsCount={units.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
              Sincronizando com a rede municipal de Novo Hamburgo...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'citizen' && (
              <CitizenView
                units={units}
                states={states}
                onOpenTelehealth={handleOpenTelehealth}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView units={units} states={states} />
            )}

            {activeTab === 'totem' && (
              <TotemView units={units} states={states} />
            )}

            {activeTab === 'telehealth' && (
              <TelehealthView
                initialAppointmentId={currentTelehealthId}
                onReferralCreated={() => {}}
              />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppBotView />
            )}

            {activeTab === 'api' && (
              <ApiDocsView />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-cyan-600" />
            <span>
              <strong>FlowCity Saúde</strong> — Projeto Piloto Novo Hamburgo / RS (HMNH, UPA Canudos, USF Santo Afonso, USF Canudos)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              LGPD by Design • Apenas Dados Agregados
            </span>
            <span>Resolução CFM nº 2.314/2022</span>
            <span>Padrão HL7 FHIR R4 & Manchester</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
