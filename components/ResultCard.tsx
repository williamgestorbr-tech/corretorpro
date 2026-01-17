
import React, { useState } from 'react';

interface ResultCardProps {
  title: string;
  icon: string;
  colorClass: string;
  content: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  title, 
  icon, 
  colorClass, 
  content, 
  onRegenerate,
  isRegenerating = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full transition-all hover:shadow-md group relative">
      <div className={`p-4 flex items-center justify-between ${colorClass} text-white relative`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <i className={`${icon} text-sm`}></i>
          </div>
          <h3 className="font-black tracking-tight uppercase text-[11px]">{title}</h3>
        </div>
        <div className="flex gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Gerar nova versão"
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate text-xs ${isRegenerating ? 'animate-spin' : ''}`}></i>
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              copied ? 'bg-green-500 scale-105' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {copied ? (
              <>
                <i className="fa-solid fa-check"></i>
                Copiado
              </>
            ) : (
              <>
                <i className="fa-solid fa-copy"></i>
                Copiar
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-6 flex-grow overflow-auto custom-scrollbar bg-white relative">
        {isRegenerating && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <i className="fa-solid fa-sparkles text-blue-500 animate-bounce text-xl"></i>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Criando nova versão...</span>
            </div>
          </div>
        )}
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm font-medium selection:bg-blue-100 selection:text-blue-900">
          {content}
        </div>
      </div>
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IA Copywriting Ativa</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
