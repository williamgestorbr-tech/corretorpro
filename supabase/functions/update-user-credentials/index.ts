
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Lidar com requisições OPTIONS (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Cabeçalho de autorização não encontrado. Verifique se o usuário está logado.')
        }

        const url = Deno.env.get('SUPABASE_URL')
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!url || !anonKey || !serviceRoleKey) {
            console.error('Missing env vars:', { url: !!url, anonKey: !!anonKey, serviceRoleKey: !!serviceRoleKey })
            throw new Error(`Configuração de ambiente inválida no Supabase.`)
        }

        const supabaseClient = createClient(url, anonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        // 1. Validar Token do Usuário
        const { data: { user: requester }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !requester) {
            console.error('Token validation failed:', userError?.message || 'No user found')
            return new Response(JSON.stringify({
                error: 'Token inválido ou expirado. Faça login novamente.',
                details: userError?.message
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        // 2. Verificar Permissão de Admin
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Acesso negado: Somente administradores.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403
            })
        }

        // 3. Executar o Update com Service Role
        const supabaseAdmin = createClient(url, serviceRoleKey)
        const { userId, email, password } = await req.json()

        if (!userId) throw new Error('ID do usuário alvo é obrigatório.')

        const updateData: any = {}
        if (email) updateData.email = email
        if (password) updateData.password = password

        const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
        if (updateError) throw new Error(`Erro no Supabase Auth: ${updateError.message}`)

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Erro na Edge Function:', error.message) // Log the error for debugging
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
