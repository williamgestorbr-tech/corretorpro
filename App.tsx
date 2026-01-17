
import React, { useState, useEffect } from 'react';
import PropertyForm from './components/PropertyForm';
import ResultCard from './components/ResultCard';
import ImageWatermark from './components/ImageWatermark';
import UserProfile from './components/UserProfile';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { PropertyData, AdResponse, UserProfile as UserProfileType, HistoryItem } from './types';
import { generateAds, generateSingleAd } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Toast, { ToastType } from './components/Toast';


const MainAppContent: React.FC<{
  session: Session;
  onSignOut: () => Promise<void>;
  showToast: (message: string, type?: any) => void;
}> = ({ session, onSignOut, showToast }) => {
  const [property, setProperty] = useState<PropertyData>({
    tipo: '',
    cidade: '',
    bairro: '',
    preco: '',
    area: '',
    quartos: '',
    banheiros: '',
    vagas: '',
    diferenciais: ''
  });

  const [profile, setProfile] = useState<UserProfileType>({
    id: '',
    email: '',
    name: '',
    creci: '',
    telefone: '',
    cidade: '',
    estado: '',
    photoUrl: null,
    is_active: true,
    subscription_status: 'inactive',
    subscription_expires_at: null
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ads, setAds] = useState<AdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<keyof AdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    if (session) {
      fetchUserData(session.user.id);
    }
  }, [session]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name || '',
          creci: profileData.creci || '',
          telefone: profileData.telefone || '',
          cidade: profileData.cidade || '',
          estado: profileData.estado || '',
          photoUrl: profileData.photo_url || null,
          is_active: profileData.is_active !== false,
          subscription_status: profileData.subscription_status || 'inactive',
          subscription_expires_at: profileData.subscription_expires_at || null
        });

        const role = profileData.role?.toLowerCase();
        setIsAdmin(role === 'admin' || role === 'administrator');
      }

      const { data: historyData } = await supabase
        .from('property_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (historyData) {
        const formattedHistory: HistoryItem[] = historyData.map(item => ({
          id: item.id,
          timestamp: new Date(item.created_at).getTime(),
          property: item.property_data,
          ads: item.ads_data
        }));
        setHistory(formattedHistory);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err);
    }

  };


  const handleFieldChange = (field: keyof PropertyData, value: string) => {
    setProperty(prev => ({ ...prev, [field]: value }));
  };

  // handleSignOut removido daqui e movido para o componente raiz App

  const handleGenerate = async () => {
    if (!property.tipo || !property.preco || !property.cidade) {
      setError("Por favor, preencha ao menos o tipo, valor e cidade do imóvel.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateAds(property, profile);
      setAds(result);
      if (session?.user) {
        const { data: historyItem, error: historyError } = await supabase
          .from('property_history')
          .insert([{
            user_id: session.user.id,
            property_data: property,
            ads_data: result
          }])
          .select()
          .single();
        if (historyError) throw historyError;
        if (historyItem) {
          const newItem: HistoryItem = {
            id: historyItem.id,
            timestamp: new Date(historyItem.created_at).getTime(),
            property: historyItem.property_data,
            ads: historyItem.ads_data
          };
          setHistory(prev => [newItem, ...prev].slice(0, 5));
        }
      }
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError("Ocorreu um erro ao gerar os anúncios.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePlatform = async (platform: keyof AdResponse) => {
    if (!ads) return;
    setRegeneratingPlatform(platform);
    try {
      const newCopy = await generateSingleAd(platform, property, profile);
      const updatedAds = { ...ads, [platform]: newCopy };
      setAds(updatedAds);
      if (history.length > 0) {
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[0] = { ...newHistory[0], ads: updatedAds };
          return newHistory;
        });
      }
    } catch (err) {
      showToast("Erro ao regerar descrição.", "error");
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setProperty(item.property);
    setAds(item.ads);
    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const isSubscriptionMissing = profile.subscription_status !== 'active';
  const isSuspended = profile.is_active === false;

  if ((isSuspended || isSubscriptionMissing) && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[60px]"></div>

          <div className="relative z-10">
            <div className={`w-20 h-20 ${isSuspended ? 'bg-red-600/20 border-red-500/30 text-red-500' : 'bg-amber-600/20 border-amber-500/30 text-amber-500'} rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-lg`}>
              <i className={`fa-solid ${isSuspended ? 'fa-user-lock' : 'fa-credit-card'} text-3xl`}></i>
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
              {isSuspended ? 'Acesso Restrito' : 'Assinatura Necessária'}
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Confirmar dados da assinatura</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Corretor:</span>
                  <span className="text-white font-bold">{profile.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">E-mail:</span>
                  <span className="text-white font-bold">{session.user.email}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Senha:</span>
                  <span className="text-white font-bold">••••••••</span>
                </div>
              </div>
            </div>

            <p className="text-slate-400 font-medium mb-8 leading-relaxed">
              {isSuspended
                ? 'Sua conta foi temporariamente desativada. Para regularizar seu acesso, entre em contato com o suporte.'
                : 'Tudo pronto! Agora só falta ativar sua licença para liberar o gerador de anúncios ilimitado e todas as funções premium.'}
            </p>

            {!isSuspended && isSubscriptionMissing && (
              <div className="mb-8 space-y-3">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left">
                  <p className="text-amber-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <i className="fa-solid fa-circle-info mr-2"></i>
                    Dica de E-mail
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Use o <strong>mesmo e-mail</strong> no pagamento. Se houver erro de digitação, o acesso não será liberado.
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left">
                  <p className="text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <i className="fa-solid fa-circle-check mr-2"></i>
                    Instrução Pós-Pagamento
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Após pagar, <strong>não clique</strong> no botão verde "Acessar Produto" na Cakto. Apenas volte aqui e clique em <strong>"Verificar Assinatura"</strong> ou aperte <strong>F5</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!isSuspended && (
                <>
                  <a
                    href="https://pay.cakto.com.br/x6g6a8g_716361"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 animate-bounce"
                  >
                    <i className="fa-solid fa-rocket"></i>
                    Assinar Agora e Liberar Acesso
                  </a>

                  <button
                    onClick={() => fetchUserData(session.user.id)}
                    className="block w-full py-4 bg-white/10 hover:bg-white/20 text-blue-400 font-black rounded-2xl transition-all border border-blue-500/20 uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                  >
                    <i className="fa-solid fa-rotate"></i>
                    Já paguei? Verificar Assinatura
                  </button>
                </>
              )}

              <a
                href="mailto:suporte@exemplo.com"
                className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-headset text-blue-400"></i>
                Contactar Suporte
              </a>

              <button
                onClick={onSignOut}
                className="block w-full py-4 text-slate-500 hover:text-slate-300 font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAdminPanel && isAdmin) {
    return (
      <AdminDashboard showToast={showToast} onBack={() => setShowAdminPanel(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-home-user text-lg"></i>
            </div>
            <div className="flex flex-col ml-1 md:ml-2">
              <h1 className="text-[15px] sm:text-lg font-black text-slate-900 leading-none">Corretor Pro</h1>
              <p className="text-[9px] sm:text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">Plataforma Tudo-em-Um</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black text-slate-800 tracking-tight">{profile.name || "Seu Perfil"}</span>
              {profile.creci && <span className="text-[9px] font-black text-blue-600 uppercase">CRECI {profile.creci}</span>}
            </div>
            <button onClick={() => document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 shadow-inner">
              {profile.photoUrl ? <img src={profile.photoUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-slate-400"></i>}
            </button>
            {isAdmin && (
              <button onClick={() => setShowAdminPanel(true)} className="w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 group">
                <i className="fa-solid fa-shield-halved"></i>
              </button>
            )}
            <button onClick={onSignOut} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-all border shadow-sm hover:scale-105 active:scale-95 group">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-10 space-y-16">
        <section id="profile-section">
          <div className="mb-6"><h2 className="text-3xl font-black text-slate-900 tracking-tight">Meu Perfil</h2></div>
          <UserProfile profile={profile} onUpdate={setProfile} />
        </section>
        <section id="copy-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                <h2 className="text-2xl font-black mb-2 tracking-tight">Gerador de Copy AI 🏆</h2>
                <p className="text-slate-300 text-sm leading-relaxed">Crie anúncios irresistíveis em minutos.</p>
              </div>
              <PropertyForm data={property} onChange={handleFieldChange} onSubmit={handleGenerate} loading={loading} />
              {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex gap-3 text-sm animate-in fade-in">
                <i className="fa-solid fa-circle-exclamation mt-0.5"></i><p className="font-medium">{error}</p>
              </div>}
              {history.length > 0 && (
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-history text-blue-500"></i> Últimas 5 Descrições
                  </h3>
                  <div className="space-y-3">
                    {history.map((item) => (
                      <button key={item.id} onClick={() => restoreFromHistory(item)} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border hover:border-blue-300 hover:bg-blue-50 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                            <i className="fa-solid fa-house-circle-check text-xs"></i>
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-black text-slate-700 truncate">{item.property.tipo} em {item.property.bairro}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{item.property.cidade} • {item.property.preco}</p>
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-blue-500"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-7" id="results-section">
              {!ads && !loading && (
                <div className="h-full min-h-[500px] border-4 border-dotted border-slate-200 rounded-[40px] bg-white/50 flex flex-col items-center justify-center text-slate-400 text-center">
                  <h3 className="text-xl font-black text-slate-800 mb-2">Aguardando dados...</h3>
                  <p className="max-w-xs text-sm text-slate-500 leading-relaxed font-medium">Preencha o formulário para gerar sua estratégia completa.</p>
                </div>
              )}
              {loading && <div className="h-full min-h-[500px] bg-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center space-y-8 animate-pulse">
                <div className="w-24 h-24 border-8 border-slate-50 border-t-blue-600 rounded-full animate-spin"></div>
              </div>}
              {ads && (
                <div className="space-y-6 animate-in fade-in duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ResultCard title="OLX / ZAP" icon="fa-solid fa-tag" colorClass="bg-indigo-600" content={ads.olx} onRegenerate={() => handleRegeneratePlatform('olx')} isRegenerating={regeneratingPlatform === 'olx'} />
                    <ResultCard title="WhatsApp" icon="fa-brands fa-whatsapp" colorClass="bg-green-600" content={ads.whatsapp} onRegenerate={() => handleRegeneratePlatform('whatsapp')} isRegenerating={regeneratingPlatform === 'whatsapp'} />
                    <ResultCard title="Instagram" icon="fa-brands fa-instagram" colorClass="bg-gradient-to-br from-pink-500 to-rose-500" content={ads.instagram} onRegenerate={() => handleRegeneratePlatform('instagram')} isRegenerating={regeneratingPlatform === 'instagram'} />
                    <ResultCard title="TikTok" icon="fa-brands fa-tiktok" colorClass="bg-slate-900" content={ads.tiktok} onRegenerate={() => handleRegeneratePlatform('tiktok')} isRegenerating={regeneratingPlatform === 'tiktok'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        <section id="image-section"><ImageWatermark /></section>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const handleSignOut = async () => {
    console.log("Tentando deslogar...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro no signOut do Supabase:", error);
        // Em caso de erro de sessão inválida, limpamos o estado local à força
        if (error.message.includes('session_not_found') || error.message.includes('JWT')) {
          setSession(null);
        }
      } else {
        console.log("Logout bem sucedido");
        setSession(null);
      }
    } catch (err) {
      console.error("Exceção ao tentar sair:", err);
      setSession(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Sessão inicial carregada:", session?.user?.email);
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Evento Auth Detectado:", event, session?.user?.email);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} initialMode={authMode} />;
    }
    return (
      <LandingPage
        onStart={() => {
          setAuthMode('signup');
          setShowAuth(true);
        }}
        onLogin={() => {
          setAuthMode('signin');
          setShowAuth(true);
        }}
      />
    );
  }

  return (
    <>
      <MainAppContent
        key={session.user.id}
        session={session}
        onSignOut={handleSignOut}
        showToast={showToast}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;
