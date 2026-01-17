
import React from 'react';
import { PropertyData } from '../types';

interface PropertyFormProps {
  data: PropertyData;
  onChange: (field: keyof PropertyData, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ data, onChange, onSubmit, loading }) => {

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value === '') {
      onChange('preco', '');
      return;
    }

    // Convert to number and format as BRL
    const amount = parseInt(value) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

    onChange('preco', formatted);
  };

  const propertyTypes = [
    "Apartamento",
    "Casa de Condomínio",
    "Casa de Rua",
    "Sobrado",
    "Terreno / Lote",
    "Sala Comercial",
    "Galpão",
    "Fazenda / Sítio",
    "Cobertura",
    "Flat / Studio"
  ];

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-blue-50 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-0"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fa-solid fa-house-chimney text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Dados do Imóvel</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Preencha os detalhes técnicos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">O que você vai anunciar?</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all group-hover:border-slate-300 font-medium appearance-none"
                value={data.tipo}
                onChange={(e) => onChange('tipo', e.target.value)}
              >
                <option value="">Selecione o tipo...</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">Valor</label>
            <input
              type="text"
              placeholder="R$ 0,00"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
              value={data.preco}
              onChange={handlePriceChange}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">Cidade</label>
            <input
              type="text"
              placeholder="Ex: Belém"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
              value={data.cidade}
              onChange={(e) => onChange('cidade', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">Bairro</label>
            <input
              type="text"
              placeholder="Ex: Batista Campos"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
              value={data.bairro}
              onChange={(e) => onChange('bairro', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">Área (m²)</label>
            <input
              type="text"
              placeholder="Ex: 120"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
              value={data.area}
              onChange={(e) => onChange('area', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase text-center">Dorms</label>
              <input
                type="text"
                placeholder="0"
                className="w-full px-2 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-center outline-none transition-all font-bold"
                value={data.quartos}
                onChange={(e) => onChange('quartos', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase text-center">Suítes/WC</label>
              <input
                type="text"
                placeholder="0"
                className="w-full px-2 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-center outline-none transition-all font-bold"
                value={data.banheiros}
                onChange={(e) => onChange('banheiros', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase text-center">Vagas</label>
              <input
                type="text"
                placeholder="0"
                className="w-full px-2 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-center outline-none transition-all font-bold"
                value={data.vagas}
                onChange={(e) => onChange('vagas', e.target.value)}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">Diferenciais e Lazer</label>
            <textarea
              placeholder="Descreva o que torna o imóvel único: Sol da manhã, vista para o parque, condomínio clube..."
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all min-h-[140px] resize-none font-medium text-sm"
              value={data.diferenciais}
              onChange={(e) => onChange('diferenciais', e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-2 px-1 font-medium">💡 Dica: Quanto mais detalhes aqui, mais persuasivo será o anúncio.</p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 uppercase tracking-widest text-[11px] sm:text-sm"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-circle-notch animate-spin"></i>
              <span>Criando sua Copy...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <i className="fa-solid fa-rocket"></i>
              <span>Gerar Legendas que Vendem</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default PropertyForm;
