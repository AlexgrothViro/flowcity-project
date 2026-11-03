import React, { useState } from 'react';
import { sendWhatsAppMessage } from '../services/api.ts';
import { Send, Bot, User, CheckCheck, Sparkles, PhoneCall, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const WhatsAppBotView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Olá! Sou o assistente virtual do *FlowCity Saúde de Novo Hamburgo* 🏥.\n\nComo posso ajudar você hoje?\n- Digite *FILA* para ver os tempos de espera da UPA e Hospital.\n- Digite *TRIAGEM* para avaliar seus sintomas.\n- Digite *TELECONSULTA* para falar com um médico agora sem sair de casa.',
      time: '10:00'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendWhatsAppMessage(text);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: res.reply_text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Desculpe, tive um problema de conexão com o sistema municipal. Tente novamente em instantes.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Description Header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
          <Bot className="w-5 h-5 text-emerald-600" />
          Simulador de Canal Cidadão — WhatsApp Oficial SUS
        </h2>
        <p className="text-xs text-slate-500">
          Atendimento de baixo atrito para cidadãos sem necessidade de baixar aplicativos
        </p>
      </div>

      {/* Smartphone Shell */}
      <div className="bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800">
        <div className="bg-[#0b141a] text-slate-100 rounded-[32px] overflow-hidden flex flex-col h-[600px]">
          {/* WhatsApp Header */}
          <div className="bg-[#202c33] p-3.5 flex items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                FC
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  FlowCity Saúde NH
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                </h3>
                <p className="text-[11px] text-slate-400">Canal Oficial • Prefeitura de Novo Hamburgo</p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: '1',
                    sender: 'bot',
                    text: 'Olá! Sou o assistente virtual do *FlowCity Saúde de Novo Hamburgo* 🏥.\n\nComo posso ajudar você hoje?\n- Digite *FILA* para ver os tempos de espera da UPA e Hospital.\n- Digite *TRIAGEM* para avaliar seus sintomas.\n- Digite *TELECONSULTA* para falar com um médico agora sem sair de casa.',
                    time: '10:00'
                  }
                ]);
              }}
              className="text-slate-400 hover:text-white p-1"
              title="Reiniciar Conversa"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Triggers */}
          <div className="bg-[#111b21] p-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 text-xs">
            <button
              onClick={() => handleSend('Consultar fila agora')}
              className="px-2.5 py-1 rounded-full bg-[#202c33] text-emerald-400 hover:bg-slate-700 font-semibold whitespace-nowrap text-[11px] border border-slate-700"
            >
              ⏱️ Consultar Fila
            </button>
            <button
              onClick={() => handleSend('Fazer triagem')}
              className="px-2.5 py-1 rounded-full bg-[#202c33] text-cyan-400 hover:bg-slate-700 font-semibold whitespace-nowrap text-[11px] border border-slate-700"
            >
              🩺 Fazer Teletriagem
            </button>
            <button
              onClick={() => handleSend('Quero teleconsulta agora')}
              className="px-2.5 py-1 rounded-full bg-[#202c33] text-amber-400 hover:bg-slate-700 font-semibold whitespace-nowrap text-[11px] border border-slate-700"
            >
              📹 Teleconsulta
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#005c4b] text-white rounded-tr-none'
                      : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                    <span>{msg.time}</span>
                    {msg.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#202c33] text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                  Digitando resposta...
                </div>
              </div>
            )}
          </div>

          {/* Message Input Footer */}
          <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-slate-700/50">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-[#2a3942] text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-slate-950 font-bold transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
