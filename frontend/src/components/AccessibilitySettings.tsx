import React from 'react';
import { Volume2, VolumeX, Contrast, Type } from 'lucide-react';

type AccessibilitySettingsProps = {
  contrast: boolean;
  fontScale: 'normal' | 'large' | 'largest';
  onContrastChange: (enabled: boolean) => void;
  onFontScaleChange: (scale: 'normal' | 'large' | 'largest') => void;
};

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ contrast, fontScale, onContrastChange, onFontScaleChange }) => {
  const [speaking, setSpeaking] = React.useState(false);
  const readPage = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 12000));
    utterance.lang = 'pt-BR';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };
  return (
    <section aria-label="Acessibilidade" className="accessibility-toolbar flex flex-wrap items-center justify-end gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <span className="flex items-center gap-1 text-xs font-semibold text-slate-700"><Type aria-hidden="true" className="h-4 w-4" /> Acessibilidade</span>
      <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
        <span>Tamanho do texto</span>
        <select aria-label="Tamanho do texto" value={fontScale} onChange={(event) => onFontScaleChange(event.target.value as AccessibilitySettingsProps['fontScale'])} className="rounded border border-slate-400 bg-white px-2 py-1 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">
          <option value="normal">Normal</option><option value="large">Grande</option><option value="largest">Muito grande</option>
        </select>
      </label>
      <button type="button" aria-pressed={contrast} onClick={() => onContrastChange(!contrast)} className="flex items-center gap-1 rounded border border-slate-500 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">
        <Contrast aria-hidden="true" className="h-4 w-4" /> {contrast ? 'Contraste padrão' : 'Alto contraste'}
      </button>
      <button type="button" onClick={readPage} disabled={!('speechSynthesis' in window)} aria-pressed={speaking} className="flex items-center gap-1 rounded border border-slate-500 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 disabled:opacity-50">
        {speaking ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}{speaking ? 'Parar leitura' : 'Ler conteúdo'}
      </button>
    </section>
  );
};
