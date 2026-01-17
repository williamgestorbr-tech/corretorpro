
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    is_active?: boolean;
    subscription_status?: string;
}

interface AdminDashboardProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ showToast, onBack }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const itemsPerPage = 6;

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Form states for editing
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setEditName(user.name || '');
        setEditEmail(user.email || '');
        setEditPassword('');
    };

    const toggleUserStatus = async (user: UserProfile) => {
        setLoading(true);
        setError(null);
        try {
            const newStatus = user.is_active === false ? true : false;
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ is_active: newStatus })
                .eq('id', user.id)
                .select();

            if (updateError) throw updateError;
            if (!data || data.length === 0) throw new Error("⚠️ PERMISSÃO NEGADA");

            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setLoading(true);
        setError(null);

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ name: editName })
                .eq('id', editingUser.id);

            if (profileError) throw profileError;

            const hasEmailChanged = editEmail !== editingUser.email;
            const hasPassword = editPassword.length >= 6;

            if (hasEmailChanged || hasPassword) {
                const { data, error: funcError } = await supabase.functions.invoke('update-user-credentials', {
                    body: {
                        userId: editingUser.id,
                        email: hasEmailChanged ? editEmail : undefined,
                        password: hasPassword ? editPassword : undefined
                    }
                });

                if (funcError) throw funcError;
                if (data?.error) throw new Error(data.error);
            }

            setEditingUser(null);
            setEditPassword('');
            fetchUsers();
            showToast("Dados atualizados com sucesso.", "success");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadPendingUsers = () => {
        const pendingUsers = users.filter(u => u.subscription_status === 'inactive' || u.is_active === false);
        if (pendingUsers.length === 0) {
            showToast("Não há usuários pendentes.", "info");
            return;
        }
        const headers = ["ID", "Nome", "E-mail", "Status", "Criado em"];
        const rows = pendingUsers.map(u => [u.id, u.name || "N/A", u.email, u.subscription_status || (u.is_active === false ? "Suspenso" : "Pendente"), new Date(u.created_at).toLocaleDateString('pt-BR')]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `usuarios_pendentes.csv`);
        link.click();
    };

    const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white px-6 md:px-8 py-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
                                <i className="fa-solid fa-shield-halved text-lg"></i>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Painel de Controle</h1>
                        </div>
                        <p className="text-slate-400 font-medium text-sm md:text-base">Gestão centralizada de corretores e acessos</p>
                    </div>

                    <button
                        onClick={onBack}
                        className="md:absolute md:top-0 md:right-0 bg-white hover:bg-slate-50 text-slate-900 px-5 py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-xl border border-slate-200 flex items-center gap-2 transition-all active:scale-95 z-20"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Voltar para App
                    </button>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto mt-4 md:mt-24 lg:mt-0 xl:mt-0">
                    </div>
                </header>

                <div className="flex flex-wrap gap-4 w-full mb-12">
                    <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/10 flex-1 min-w-[140px]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Faturamento Previsto</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-green-400">
                                {(users.filter(u => u.subscription_status === 'active' || u.is_active !== false).length * 49.9).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/10 flex-1 min-w-[140px]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Não Renovados</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-red-400">
                                {users.filter(u => u.subscription_status === 'inactive' || u.is_active === false).length}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Contas</span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/10 flex-1 min-w-[140px]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Corretores</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-blue-400">{users.length}</span>
                            <i className="fa-solid fa-users text-blue-400/30"></i>
                        </div>
                    </div>
                </div>

                <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-white/10 shadow-xl">
                    <div className="relative w-full md:max-w-md">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou e-mail..."
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={downloadPendingUsers}
                            className="flex-1 md:flex-none px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-file-csv"></i>
                            Baixar Pendentes
                        </button>
                        <button
                            onClick={fetchUsers}
                            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90 border border-white/10"
                            title="Atualizar lista"
                        >
                            <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-[24px] mb-8 text-red-200 text-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <i className="fa-solid fa-circle-exclamation text-xl"></i>
                        <p className="font-bold">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {paginatedUsers.length === 0 && !loading ? (
                        <div className="col-span-full bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-20 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <i className="fa-solid fa-users-slash text-2xl text-slate-600"></i>
                            </div>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhum corretor encontrado</p>
                        </div>
                    ) : (
                        paginatedUsers.map(user => (
                            <div key={user.id} className="bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 p-6 hover:bg-white/[0.08] transition-all group relative overflow-hidden flex flex-col h-full border-b-4 border-b-transparent hover:border-b-blue-600 shadow-lg">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-black text-sm border border-blue-600/20 shadow-inner">
                                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <p className="font-black text-base text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">{user.name || 'Sem Nome'}</p>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mt-1 ${user.role === 'admin'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {user.role === 'admin' ? '🛡️ Admin' : '👤 Corretor'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.is_active !== false
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                        <span className={`w-1 h-1 rounded-full ${user.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {user.is_active !== false ? 'Ativo' : 'Suspenso'}
                                    </span>
                                </div>

                                <div className="space-y-4 mb-8 flex-grow">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">E-mail de Acesso</label>
                                        <p className="text-sm font-medium text-slate-300 break-all">{user.email}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Membro Desde</label>
                                            <p className="text-[10px] text-slate-400 font-bold">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <p className="text-[9px] text-slate-600 font-mono">ID: {user.id.substring(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleUserStatus(user)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all border font-black text-[10px] uppercase tracking-widest ${user.is_active !== false
                                            ? 'bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                                            : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                                            }`}
                                    >
                                        <i className={`fa-solid ${user.is_active !== false ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                                        {user.is_active !== false ? 'Suspender' : 'Ativar'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-blue-600 hover:text-white rounded-2xl transition-all text-blue-400 border border-white/5 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <i className="fa-solid fa-sliders"></i>
                                        Gerenciar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 pb-10">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-md p-10 shadow-3xl animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10">
                            <header className="mb-8 text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-blue-500/20">
                                    <i className="fa-solid fa-user-gear text-2xl"></i>
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Editar Credenciais</h2>
                                <p className="text-slate-500 text-xs font-bold mt-1">Alterando dados para: {editingUser.email}</p>
                            </header>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nome de Exibição</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Endereço de E-mail</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium"
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium"
                                        value={editPassword}
                                        onChange={e => setEditPassword(e.target.value)}
                                    />
                                    <p className="text-[9px] text-blue-400 px-1 italic">Alteração segura via Edge Function Admin ativa.</p>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all text-slate-400"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-blue-500/20 text-white flex items-center justify-center gap-2"
                                    >
                                        {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <><i className="fa-solid fa-check"></i> Salvar Transação</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-8 right-8 w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-[100] border-2 border-white/20 hover:scale-110 active:scale-90 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
                <i className="fa-solid fa-chevron-up"></i>
            </button>
        </div>
    );
};

export default AdminDashboard;
