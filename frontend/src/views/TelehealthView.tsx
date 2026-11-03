import React, { useState } from 'react';
import {
  TeleconsultationAppointment,
  SpecialistField
} from '../types.ts';
import {
  requestSpecialistReferral
} from '../services/api.ts';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  FileCheck2,
  Stethoscope,
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Clock
} from 'lucide-react';

interface TelehealthViewProps {
  initialAppointmentId?: string;
  onReferralCreated?: () => void;
}

export const TelehealthView: React.FC<TelehealthViewProps> = ({
  initialAppointmentId,
  onReferralCreated
}) => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenShared, setScreenShared] = useState(false);

  // Digital Prescription
  const [medication, setMedication] = useState('Paracetamol 500mg');
  const [dosage, setDosage] = useState('Tomar 1 comprimido a cada 6 horas se houver febre ou dor por 3 dias.');
  const [prescriptionIssued, setPrescriptionIssued] = useState(false);

  // Specialist Referral Modal
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [specialty, setSpecialty] = useState<SpecialistField>('Cardiologia');
  const [referralType, setReferralType] = useState<'TELEINTERCONSULTA_IMEDIATA' | 'REGULACAO_SISREG_PRIORITARIA'>(
    'TELEINTERCONSULTA_IMEDIATA'
  );
  const [clinicalJustification, setClinicalJustification] = useState(
    'Paciente com pressão arterial persistente de 160/100 mmHg apesar de medicação regular. Solicito teleinterconsulta para avaliar associação de Bloqueador dos Canais de Cálcio.'
  );
  const [referralSent, setReferralSent] = useState(false);

  const handleIssuePrescription = () => {
    setPrescriptionIssued(true);
    setTimeout(() => setPrescriptionIssued(false), 5000);
  };

  const handleSendSpecialistReferral = async () => {
    try {
      await requestSpecialistReferral({
        consulta_id: initialAppointmentId || 'tele_nh_001',
        especialidade: specialty,
        tipo: referralType,
        justificativa_clinica: clinicalJustification,
        crm_solicitante: 'CRM/RS 41092 (Dr. Lucas Mendes - MFC Telessaúde)'
      });
      setReferralSent(true);
      if (onReferralCreated) onReferralCreated();
      setTimeout(() => {
        setReferralSent(false);
        setReferralModalOpen(false);
      }, 2500);
    } catch {
      alert('Erro ao enviar solicitação de especialista');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
              <Video className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sala Segura de Teleconsulta & Teleinterconsulta (CFM 2.314/2022)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atendimento digital da Atenção Primária integrado à rede de especialistas de Novo Hamburgo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Criptografia Ponta a Ponta Ativa
          </span>
        </div>
      </div>

      {/* Main Grid: Video Room on Left, Clinical Pad on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Room (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
            {/* Remote Video (Patient / Doctor) */}
            <div className="text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-cyan-900/60 border-2 border-cyan-400 mx-auto flex items-center justify-center text-cyan-300">
                <User className="w-12 h-12" />
              </div>
              <div className="text-white space-y-1">
                <h3 className="font-bold text-base">Paciente: Maria da Silva (PAC-NH-8941)</h3>
                <p className="text-xs text-slate-400">Novo Hamburgo - RS • Acolhida via Teletriagem</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Chamada em Andamento: 08:42
              </span>
            </div>

            {/* Local Video Inset (Doctor Self-View) */}
            <div className="absolute bottom-4 right-4 w-32 md:w-44 aspect-video bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
              {videoOn ? (
                <div className="text-center text-[10px] text-slate-300 font-medium">
                  <div className="w-8 h-8 rounded-full bg-slate-700 mx-auto mb-1 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-cyan-400" />
                  </div>
                  Dr. Lucas Mendes (Você)
                </div>
              ) : (
                <div className="text-slate-500 text-[10px]">Câmera Desligada</div>
              )}
            </div>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2.5 rounded-xl transition ${
                  micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Desativar Microfone' : 'Ativar Microfone'}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-2.5 rounded-xl transition ${
                  videoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={videoOn ? 'Desativar Câmera' : 'Ativar Câmera'}
              >
                {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setScreenShared(!screenShared)}
                className={`p-2.5 rounded-xl transition ${
                  screenShared ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title="Compartilhar Tela"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => alert('Consulta finalizada com registro em prontuário')}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition"
                title="Encerrar Chamada"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Call Protocol Info */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 block">Protocolo Municipal de Atendimento:</span>
              <strong className="text-slate-900 font-mono">2026-NH-TELE-8941</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Unidade de Vínculo APS:</span>
              <strong className="text-slate-900">USF Santo Afonso / Polo Telessaúde</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Responsável Clínico:</span>
              <strong className="text-slate-900">Dr. Lucas Mendes (CRM/RS 41092)</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Doctor Clinical Tools & Specialist Referral (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Trigger for Specialist Teleinterconsultation */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-blue-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Stethoscope className="w-4 h-4" />
              Matriciamento Especializado do SUS
            </div>

            <h3 className="font-extrabold text-base leading-snug">
              Precisa da opinião de um especialista focal durante a consulta?
            </h3>

            <p className="text-xs text-blue-200 leading-relaxed">
              Acione um médico especialista de plantão (Cardiologia, Ortopedia, Dermatologia)
              ou faça um encaminhamento com fila rápida no SISREG.
            </p>

            <button
              onClick={() => setReferralModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Solicitar Teleinterconsulta com Especialista
            </button>
          </div>

          {/* Digital Prescription Pad */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Receituário Digital ICP-Brasil</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Assinatura Válida
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medicamento / Apresentação:</label>
                <input
                  type="text"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Posologia e Orientações:</label>
                <textarea
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-xs"
                />
              </div>

              {prescriptionIssued && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Receita assinada com certificado ICP-Brasil e enviada por SMS/WhatsApp ao paciente!</span>
                </div>
              )}

              <button
                onClick={handleIssuePrescription}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                Emitir Receita & Notificar Paciente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE ENCAMINHAMENTO A ESPECIALISTA */}
      {referralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-cyan-700 uppercase">
                  Regulação Clínica Integrada
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Solicitação de Teleinterconsulta de Especialista
                </h3>
              </div>
              <button
                onClick={() => setReferralModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {referralSent ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-emerald-900 text-sm">
                  Solicitação Enviada com Sucesso!
                </h4>
                <p className="text-xs text-emerald-800">
                  O especialista de plantão foi notificado no painel da regulação de Novo Hamburgo.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Especialidade Médica Necessária:
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as SpecialistField)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 font-semibold"
                  >
                    <option value="Cardiologia">Cardiologia</option>
                    <option value="Dermatologia">Dermatologia</option>
                    <option value="Ortopedia">Ortopedia</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Neurologia">Neurologia</option>
                    <option value="Psiquiatria">Psiquiatria</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Interação:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReferralType('TELEINTERCONSULTA_IMEDIATA')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        referralType === 'TELEINTERCONSULTA_IMEDIATA'
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <strong className="block">Imediata (Vídeo)</strong>
                      <span className="text-[10px] text-slate-500">
                        Especialista entra nesta chamada
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReferralType('REGULACAO_SISREG_PRIORITARIA')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        referralType === 'REGULACAO_SISREG_PRIORITARIA'
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <strong className="block">Fila Regulada SISREG</strong>
                      <span className="text-[10px] text-slate-500">
                        Parecer com prioridade clínica
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Justificativa Clínica e Dúvida para o Especialista:
                  </label>
                  <textarea
                    value={clinicalJustification}
                    onChange={(e) => setClinicalJustification(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => setReferralModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendSpecialistReferral}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar ao Matriciamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
