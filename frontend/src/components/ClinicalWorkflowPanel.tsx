import React, { useState } from 'react';
import { FileText, ShieldAlert, ShieldCheck, Save, SearchCheck } from 'lucide-react';
import { saveClinicalSoapNote, verifySignedClinicalDocument } from '../services/api.ts';

interface ClinicalWorkflowPanelProps {
  appointmentId?: string;
}

export const ClinicalWorkflowPanel: React.FC<ClinicalWorkflowPanelProps> = ({ appointmentId }) => {
  const [soap, setSoap] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    cid10: '',
    ciap2: '',
    professionalRegistration: ''
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [saveError, setSaveError] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [verification, setVerification] = useState<{ integrityValid: boolean; issuerVerified: false; message: string } | null>(null);
  const [verificationError, setVerificationError] = useState('');

  const saveSoap = async () => {
    if (!appointmentId) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await saveClinicalSoapNote(appointmentId, {
        ...soap,
        cid10: soap.cid10 || undefined,
        ciap2: soap.ciap2 || undefined
      });
      setSavedAt(result.updatedAt);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o registro.');
    } finally {
      setSaving(false);
    }
  };

  const verifyDocument = async () => {
    setVerification(null);
    setVerificationError('');
    try {
      const parsed = JSON.parse(verificationInput);
      const result = await verifySignedClinicalDocument(parsed);
      setVerification(result);
    } catch (error) {
      setVerificationError(error instanceof SyntaxError
        ? 'Cole um pacote JSON válido com document, signature, public_key_hex e sha256.'
        : error instanceof Error ? error.message : 'Não foi possível validar o pacote.');
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" aria-labelledby="soap-title">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="h-4 w-4 text-cyan-700" />
          <h3 id="soap-title" className="font-bold text-sm text-slate-900">Registro clínico estruturado SOAP</h3>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          Protótipo demonstrativo sem autenticação profissional. Use apenas dados sintéticos: não digite nomes, documentos ou informações de pacientes reais.
        </div>
        <div className="grid gap-3">
          {([
            ['subjective', 'S — Subjetivo', 'Relato e contexto informado'],
            ['objective', 'O — Objetivo', 'Achados e medidas observadas'],
            ['assessment', 'A — Avaliação', 'Avaliação profissional'],
            ['plan', 'P — Plano', 'Condutas registradas pelo profissional']
          ] as const).map(([key, label, hint]) => (
            <label key={key} className="block text-xs font-semibold text-slate-700">
              {label}
              <span className="mb-1 mt-0.5 block font-normal text-slate-500">{hint}</span>
              <textarea
                value={soap[key]}
                onChange={(event) => setSoap((current) => ({ ...current, [key]: event.target.value }))}
                rows={2}
                maxLength={4000}
                className={fieldClass}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">
            CID-10
            <input value={soap.cid10} onChange={(event) => setSoap((current) => ({ ...current, cid10: event.target.value.toUpperCase() }))} placeholder="Ex.: A90" className={fieldClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            CIAP-2
            <input value={soap.ciap2} onChange={(event) => setSoap((current) => ({ ...current, ciap2: event.target.value.toUpperCase() }))} placeholder="Ex.: A77" className={fieldClass} />
          </label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">
          Registro profissional do responsável
          <input value={soap.professionalRegistration} onChange={(event) => setSoap((current) => ({ ...current, professionalRegistration: event.target.value }))} placeholder="Identificador profissional no ambiente de demonstração" maxLength={80} className={fieldClass} />
        </label>
        <p className="text-[11px] text-slate-500">CID-10 e CIAP-2 passam por validação de formato; a lista oficial de códigos e o vínculo com o profissional não são consultados.</p>
        {!appointmentId && <p className="text-xs text-amber-800">Abra uma consulta demonstrativa para salvar o SOAP.</p>}
        {savedAt && <p role="status" className="text-xs text-emerald-700">Registro demonstrativo salvo às {new Date(savedAt).toLocaleTimeString('pt-BR')}.</p>}
        {saveError && <p role="alert" className="text-xs text-rose-700">{saveError}</p>}
        <button type="button" disabled={!appointmentId || saving} onClick={() => void saveSoap()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50">
          <Save className="h-4 w-4" />{saving ? 'Salvando…' : 'Salvar registro demonstrativo'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3" aria-labelledby="verify-title">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <SearchCheck className="h-4 w-4 text-emerald-700" />
          <h3 id="verify-title" className="font-bold text-sm text-slate-900">Verificador de integridade documental</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">Cole o pacote JSON fornecido pelo sistema emissor, com conteúdo, assinatura Ed25519, chave pública e hash SHA-256.</p>
        <textarea value={verificationInput} onChange={(event) => setVerificationInput(event.target.value)} rows={5} spellCheck={false} placeholder={'{"document":{},"signature":"ed25519:…","public_key_hex":"…","sha256":"…"}'} className={fieldClass + ' font-mono'} />
        {verification && (
          <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${verification.integrityValid ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
            {verification.integrityValid ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
            <span>{verification.message}<br /><strong>Emissor verificado: não.</strong></span>
          </div>
        )}
        {verificationError && <p role="alert" className="text-xs text-rose-700">{verificationError}</p>}
        <button type="button" onClick={() => void verifyDocument()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
          <ShieldCheck className="h-4 w-4" />Verificar hash e assinatura
        </button>
        <p className="text-[11px] leading-relaxed text-amber-800">Este resultado verifica apenas integridade matemática. Não confirma identidade, CRM, ICP-Brasil, prescrição ou validade jurídica; não use como liberação de medicamentos ou validação de atestado.</p>
      </section>
    </div>
  );
};
