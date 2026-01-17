
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
    onBack: () => void;
    initialMode?: 'signin' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ onBack, initialMode = 'signup' }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name
                        }
                    }
                });
                if (error) throw error;
                setMessage('Cadastro realizado com sucesso! Agora você pode acessar a plataforma.');
                setIsSignUp(false); // Muda para o login após cadastrar
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro durante a autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4 font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[40px] shadow-2xl">
                    <div className="text-center mb-8 relative">
                        <button onClick={onBack} className="absolute -top-2 -left-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <i className="fa-solid fa-home-user text-2xl"></i>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Corretor Pro</h1>
                        <p className="text-slate-400 text-sm font-medium">
                            {isSignUp ? 'Crie sua conta profissional' : 'Bem-vindo de volta!'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {isSignUp && (
                            <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                                <label className="text-xs font-black text-slate-300 uppercase tracking-widest px-1">Nome Completo</label>
                                <div className="relative">
                                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                    <input
                                        type="text"
                                        placeholder="Seu nome"
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-300 uppercase tracking-widest px-1">E-mail</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-300 uppercase tracking-widest px-1">Senha</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-xs font-bold animate-pulse text-center">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-2xl text-green-200 text-xs font-bold text-center">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch animate-spin"></i>
                            ) : (
                                <>
                                    <i className={`fa-solid ${isSignUp ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i>
                                    {isSignUp ? 'Finalizar Cadastro' : 'Entrar na Plataforma'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm font-bold text-slate-400 hover:text-blue-400 transition-colors"
                        >
                            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Comece agora gratuitamente'}
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    Tecnologia Segura por Supabase & AI
                </p>
            </div>
        </div>
    );
};


export default Auth;
