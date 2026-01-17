import React, { useState } from 'react';
import { UserProfile as UserProfileType } from '../types';
import { supabase } from '../services/supabaseClient';

interface UserProfileProps {
  profile: UserProfileType;
  onUpdate: (updatedProfile: UserProfileType) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sincronizar dados do formulário quando o perfil mudar (carregamento inicial do Supabase)
  React.useEffect(() => {
    if (!isEditing) {
      setFormData(profile);
    }
  }, [profile, isEditing]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("A imagem é muito grande. Escolha uma foto com menos de 10MB.");
      return;
    }

    setIsProcessingPhoto(true);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const SIZE = 250;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        width = height;
      } else {
        height = width;
      }

      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const sourceX = (img.width - width) / 2;
        const sourceY = (img.height - height) / 2;
        ctx.drawImage(img, sourceX, sourceY, width, height, 0, 0, SIZE, SIZE);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
      }

      URL.revokeObjectURL(objectUrl);
      setIsProcessingPhoto(false);
    };

    img.onerror = () => {
      alert("Erro ao processar a imagem. Tente outro arquivo.");
      URL.revokeObjectURL(objectUrl);
      setIsProcessingPhoto(false);
    };

    img.src = objectUrl;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          creci: formData.creci,
          telefone: formData.telefone,
          cidade: formData.cidade,
          estado: formData.estado,
          photo_url: formData.photoUrl
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdate(formData);
      setIsEditing(false);
      setSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setError(err.message || "Erro ao salvar perfil no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwords.new !== passwords.confirm) {
      setError("As novas senhas não coincidem!");
      return;
    }

    if (passwords.new.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setSuccess("Senha alterada com sucesso!");
      setPasswords({ old: '', new: '', confirm: '' });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao alterar senha.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRemainingDays = () => {
    if (!profile.subscription_expires_at) return null;
    const expiresAt = new Date(profile.subscription_expires_at).getTime();
    const now = new Date().getTime();
    const diff = expiresAt - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const remainingDays = getRemainingDays();
  const isExpiringSoon = remainingDays !== null && remainingDays <= 3 && remainingDays > 0;

  return (
    <div className="space-y-6">
      {/* Alerta de Expiração Próxima */}
      {isExpiringSoon && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[32px] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-xl shadow-amber-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <h4 className="text-amber-900 font-black text-lg">Sua assinatura vence em {remainingDays} {remainingDays === 1 ? 'dia' : 'dias'}!</h4>
              <p className="text-amber-700 text-sm font-medium">Renove agora para não perder o acesso às suas ferramentas pro.</p>
            </div>
          </div>
          <a
            href="https://pay.cakto.com.br/x6g6a8g_716361"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap shadow-lg shadow-amber-200 uppercase tracking-widest"
          >
            Renovar Agora
          </a>
        </div>
      )}

      {/* Status da Assinatura (Mini Painel) */}
      <div className="bg-slate-900 border border-white/10 p-6 rounded-[32px] flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${profile.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <i className={`fa-solid ${profile.is_active ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Status da Assinatura</p>
            <h4 className={`text-lg font-black ${profile.is_active ? 'text-green-400' : 'text-red-400'}`}>
              {profile.is_active ? 'PLANO MENSAL ATIVO' : 'ASSINATURA INATIVA'}
            </h4>
          </div>
        </div>

        {profile.subscription_expires_at && (
          <div className="text-right">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Próxima Renovação</p>
            <h4 className="text-white font-black text-lg">
              {new Date(profile.subscription_expires_at).toLocaleDateString('pt-BR')}
            </h4>
          </div>
        )}
      </div>

      {/* Instrução de Preenchimento de Perfil */}
      <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[32px] flex items-center gap-5 shadow-sm">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
          <i className="fa-solid fa-address-card"></i>
        </div>
        <div className="flex-1">
          <h4 className="text-slate-900 font-black text-lg tracking-tight leading-tight mb-1">Passo Importante: Complete seu Perfil!</h4>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            Clique em <strong className="text-blue-600">"Editar Perfil"</strong> abaixo e preencha seus dados (CRECI, Telefone e Cidade). Isso é fundamental para que as descrições geradas pela IA já incluam automaticamente suas informações de contato!
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-blue-50 border border-slate-100 mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300">
                {isProcessingPhoto ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-2xl text-blue-500"></i>
                ) : formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-user-tie text-4xl"></i>
                )}
              </div>
              {isEditing && !isProcessingPhoto && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-camera text-white"></i>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {formData.name || "Perfil do Corretor"}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.creci && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-md border border-blue-100">
                    CRECI {formData.creci}
                  </span>
                )}
                {formData.telefone && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-md border border-green-100 flex items-center gap-1">
                    <i className="fa-brands fa-whatsapp"></i>
                    {formData.telefone}
                  </span>
                )}
                {formData.cidade && (
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase rounded-md border border-slate-100">
                    {formData.cidade} / {formData.estado}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-user-pen"></i>
                Editar Perfil
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isProcessingPhoto || isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                {isSaving ? "Salvando..." : "Confirmar"}
              </button>
            )}
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            >
              <i className="fa-solid fa-key mr-2"></i>
              Senha
            </button>
          </div>
        </div>

        {(error || success) && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-3 ${error ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-green-50 border border-green-100 text-green-600'
            }`}>
            <i className={`fa-solid ${error ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            {error || success}
          </div>
        )}

        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Profissional</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                placeholder="Nome Completo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CRECI</label>
              <input
                type="text"
                value={formData.creci}
                onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                placeholder="000.000-X"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cidade</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                placeholder="Ex: São Paulo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
              >
                <option value="">UF</option>
                {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {showPasswordForm && (
          <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <i className="fa-solid fa-lock text-amber-500"></i>
              Segurança da Conta
            </h3>
            <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Senha Atual</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={passwords.old}
                  onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Confirmar Nova Senha</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 rounded-2xl font-bold shadow-lg shadow-amber-100 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                    {isSaving ? "Alterando..." : "Alterar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
