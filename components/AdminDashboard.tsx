
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

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            // Nota: Para listar todos os usuários do AUTH, normalmente precisaríamos do Admin API.
            // Aqui estamos listando da nossa tabela 'public.profiles' que espelha os usuários.
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
        setEditPassword(''); // Senha sempre vazia por segurança
    };

    const toggleUserStatus = async (user: UserProfile) => {
        setLoading(true);
        setError(null);
        try {
            const newStatus = user.is_active === false ? true : false;
            console.log(`Tentando mudar status de ${user.email} para ${newStatus}...`);

            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ is_active: newStatus })
                .eq('id', user.id)
                .select();

            if (updateError) {
                console.error("Erro técnico do Supabase:", updateError);
                if (updateError.message.includes('is_active') || updateError.code === 'PGRST204') {
                    throw new Error(`⚠️ BANCO DESATUALIZADO: A coluna 'is_active' não existe na tabela 'profiles'. 
                    ERRO TÉCNICO: ${updateError.message}
                    SOLUÇÃO: O SQL que você rodou pode não ter sido aplicado na tabela correta ou o cache não limpou.`);
                }
                throw updateError;
            }

            if (!data || data.length === 0) {
                console.warn("Update bem sucedido tecnicamente, mas 0 linhas alteradas. RLS?");
                throw new Error("⚠️ PERMISSÃO NEGADA: O comando foi enviado, mas o banco de dados não permitiu a alteração. Isso acontece por causa das políticas de segurança (RLS) do Supabase.");
            }

            console.log("Status atualizado com sucesso:", data[0]);
            fetchUsers();
        } catch (err: any) {
            console.error("Erro ao alternar status:", err);
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
            // 1. Atualizar Perfil Público (Nome) - Isso continua via Tabela de Perfis
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ name: editName })
                .eq('id', editingUser.id);

            if (profileError) throw profileError;

            // 2. Atualizar Credenciais de Autenticação (Email/Senha) via Edge Function
            // Só chamamos se houver alteração de email ou se houver nova senha
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

                if (funcError) {
                    // Tentar extrair mensagem se for um erro de sistema do Supabase
                    const errorMsg = funcError instanceof Error ? funcError.message : JSON.stringify(funcError);
                    throw new Error(`Erro na Função: ${errorMsg}`);
                }

                if (data?.error) {
                    throw new Error(data.error);
                }
            }

            setEditingUser(null);
            setEditPassword('');
            fetchUsers();
            alert("✅ Transação concluída! Os dados do corretor foram atualizados com sucesso.");
        } catch (err: any) {
            console.error("Erro ao salvar:", err);
            // Se for um erro de invoke, ele pode estar dentro de um objeto
            const finalError = err.message || "Erro desconhecido na Edge Function";
            setError(finalError);
        } finally {
            setLoading(false);
        }
    };

    const downloadPendingUsers = () => {
        const pendingUsers = users.filter(u => u.subscription_status === 'inactive' || u.is_active === false);

        if (pendingUsers.length === 0) {
            alert("Não há usuários pendentes para baixar.");
            return;
        }

        // CSV Header
        const headers = ["ID", "Nome", "E-mail", "Status", "Criado em"];

        // CSV Rows
        const rows = pendingUsers.map(u => [
            u.id,
            u.name || "N/A",
            u.email,
            u.subscription_status || (u.is_active === false ? "Suspenso" : "Pendente"),
            new Date(u.created_at).toLocaleDateString('pt-BR')
        ]);

        // Combine
        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `usuarios_pendentes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
                                <i className="fa-solid fa-shield-halved text-lg"></i>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Painel de Controle</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Gestão centralizada de corretores e acessos</p>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
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
                </header>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-[24px] mb-8 text-red-200 text-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <i className="fa-solid fa-circle-exclamation text-xl"></i>
                        <p className="font-bold">{error}</p>
                    </div>
                )}

                <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Lista de Corretores</h3>
                            <button
                                onClick={downloadPendingUsers}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                title="Baixar lista de pendentes (.csv)"
                            >
                                <i className="fa-solid fa-file-csv"></i>
                                Baixar Pendentes
                            </button>
                        </div>
                        <button
                            onClick={fetchUsers}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
                            title="Atualizar lista"
                        >
                            <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-black/20">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contato Profissional</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nível de Acesso</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Membro Desde</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Controles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                                <i className="fa-solid fa-users-slash text-2xl text-slate-600"></i>
                                            </div>
                                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhum usuário encontrado</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(user => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-black text-xs border border-blue-600/20">
                                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.name || 'Sem Nome Definido'}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold">UID: {user.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-medium text-slate-300">{user.email}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap ${user.role === 'admin'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    }`}>
                                                    {user.role === 'admin' ? '🛡️ Administrador' : '👤 Corretor'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 text-xs font-bold">
                                                {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap ${user.is_active !== false
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full ${user.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {user.is_active !== false ? 'Ativo' : 'Suspenso'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleUserStatus(user)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${user.is_active !== false
                                                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                                                            : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                                                            }`}
                                                        title={user.is_active !== false ? "Suspender Usuário" : "Reativar Usuário"}
                                                    >
                                                        <i className={`fa-solid ${user.is_active !== false ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="px-4 py-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-blue-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        <i className="fa-solid fa-sliders"></i>
                                                        Gerenciar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Edição */}
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
        </div>
    );
};

export default AdminDashboard;
