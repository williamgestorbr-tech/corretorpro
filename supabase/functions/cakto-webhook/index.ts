import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cakto-secret',
}

serve(async (req) => {
    // Lidar com o preflight do CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        console.log('Webhook Processado. Payload:', JSON.stringify(payload, null, 2))

        // 1. Mapeamento de Status (Case Insensitive)
        const rawStatus = (payload.status || payload.event || payload.eventType || payload.action || '').toString().toLowerCase()

        // 2. Extração de Email (Busca exaustiva)
        let email = payload.customer?.email ||
            payload.email ||
            payload.customer_email ||
            payload.buyer?.email ||
            payload.data?.customer?.email ||
            payload.data?.email ||
            payload.data?.attributes?.customer_email ||
            payload.data?.attributes?.email

        // 3. Fallback Regex
        if (!email) {
            const payloadString = JSON.stringify(payload)
            const emailMatch = payloadString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
            if (emailMatch) email = emailMatch[0]
        }

        const processedEmail = email ? email.toLowerCase().trim() : 'N/A'

        // Logar o payload bruto para depuração
        await supabaseClient.from('webhook_debug').insert({
            payload,
            processed_email: processedEmail,
            event_status: rawStatus
        })

        // Verificação de segurança
        const caktoSecret = req.headers.get('x-cakto-secret') || payload.secret || payload.cakto_secret
        const expectedSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET')

        if (expectedSecret && caktoSecret !== expectedSecret) {
            console.error('Acesso não autorizado: Segredo inválido')
            await supabaseClient.from('webhook_debug').update({ action_taken: 'Erro: Secret Inválido' }).match({ processed_email: processedEmail, event_status: rawStatus })
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!email) {
            console.error('Falha crítica: Email não encontrado')
            await supabaseClient.from('webhook_debug').update({ action_taken: 'Erro: Email não encontrado' }).match({ event_status: rawStatus })
            return new Response(JSON.stringify({ error: 'Email missing' }), { status: 400 })
        }

        // Eventos de ativação
        const activationEvents = ['purchase_approved', 'paid', 'approved', 'subscription_renewed', 'renewed', 'active', 'order.completed', 'charged']
        const isActivation = activationEvents.includes(rawStatus)

        // Eventos de desativação
        const deactivationEvents = ['subscription_canceled', 'refund', 'refunded', 'chargeback', 'canceled', 'deleted', 'inactive']
        const isDeactivation = deactivationEvents.includes(rawStatus)

        if (isActivation) {
            const { error, data } = await supabaseClient
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    is_active: true,
                    subscription_expires_at: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString()
                })
                .ilike('email', processedEmail)
                .select()

            if (data && data.length > 0) {
                await supabaseClient.from('webhook_debug').update({ action_taken: 'Ativado: ' + processedEmail }).match({ processed_email: processedEmail, event_status: rawStatus })
            } else {
                await supabaseClient.from('webhook_debug').update({ action_taken: 'Erro: Perfil não encontrado no banco' }).match({ processed_email: processedEmail, event_status: rawStatus })
            }
            if (error) throw error
        } else if (isDeactivation) {
            await supabaseClient.from('profiles').update({ subscription_status: 'inactive', is_active: false }).ilike('email', processedEmail)
            await supabaseClient.from('webhook_debug').update({ action_taken: 'Desativado' }).match({ processed_email: processedEmail, event_status: rawStatus })
        } else {
            await supabaseClient.from('webhook_debug').update({ action_taken: 'Ignorado: Status ' + rawStatus }).match({ processed_email: processedEmail, event_status: rawStatus })
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Erro no processamento do webhook:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})


