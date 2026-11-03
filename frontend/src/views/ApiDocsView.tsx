import React, { useState, useEffect } from 'react';
import { Code2, Play, CheckCircle2, ShieldCheck, Copy, Terminal } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [endpoint, setEndpoint] = useState('/api/v0/units/upa_canudos');
  const [responseJson, setResponseJson] = useState<string>('Clique em "Executar Teste" para ver a resposta em tempo real.');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runTest = async (url: string = endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseJson(JSON.stringify({ erro: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
            <Code2 className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            API Aberta Municipal de Dados de Saúde (v0 Specification)
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Dados abertos com assinatura criptográfica Ed25519 e total conformidade com a LGPD (sem PII)
        </p>
      </div>

      {/* Schema Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="font-extrabold text-cyan-700 block">PoW (Proof-of-Wait)</span>
          <p className="text-slate-600 leading-relaxed">
            Publica os tempos medianos de espera por cor do Protocolo de Manchester (Vermelho a Azul),
            tamanho da fila e índice de confiança estatística.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="font-extrabold text-blue-700 block">PoO (Proof-of-Occupancy)</span>
          <p className="text-slate-600 leading-relaxed">
            Disponibiliza a taxa de ocupação de leitos de observação, número de consultórios ativos
            e filas de exames diagnósticos (Raio-X e Laboratório).
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="font-extrabold text-emerald-700 block">Assinatura Ed25519</span>
          <p className="text-slate-600 leading-relaxed">
            Cada payload possui uma assinatura digital da prefeitura, garantindo que o dado não
            foi alterado por intermediários e permitindo auditoria por órgãos de controle.
          </p>
        </div>
      </div>

      {/* Interactive API Tester */}
      <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Explorador Interativo de Endpoints</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEndpoint('/api/v0/units/upa_canudos');
                runTest('/api/v0/units/upa_canudos');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                endpoint === '/api/v0/units/upa_canudos'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              GET /units/upa_canudos
            </button>

            <button
              onClick={() => {
                setEndpoint('/api/v0/states');
                runTest('/api/v0/states');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                endpoint === '/api/v0/states'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              GET /states (Rede Toda)
            </button>

            <button
              onClick={() => {
                setEndpoint('/api/v0/public-key');
                runTest('/api/v0/public-key');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                endpoint === '/api/v0/public-key'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              GET /public-key
            </button>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-2 border border-slate-800 font-mono text-xs">
          <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
            GET
          </span>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 focus:outline-none"
          />
          <button
            onClick={() => runTest()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? 'Consultando...' : 'Executar'}
          </button>
        </div>

        {/* JSON Output */}
        <div className="relative">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Resposta do Servidor (JSON Formatted):</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 hover:text-white transition"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copiado!' : 'Copiar JSON'}
            </button>
          </div>
          <pre className="bg-slate-900 p-4 rounded-2xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-cyan-300 max-h-[380px] leading-relaxed">
            {responseJson}
          </pre>
        </div>
      </div>
    </div>
  );
};
