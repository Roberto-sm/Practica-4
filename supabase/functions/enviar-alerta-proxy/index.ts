// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req: Request) => {
  // 1. Manejo de CORS para que Angular pueda llamarlo
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    // 2. Extraer el mensaje que viene desde Angular
    const { mensaje } = await req.json();
    if (!mensaje) throw new Error("Falta el mensaje");

    // 3. Conectar a Supabase para saber QUIÉN está haciendo la petición
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Pasamos el JWT del usuario de Angular para que actúe en su nombre
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No autorizado");

    // 4. Obtener el número de teléfono (usamos service_role para brincar RLS si es necesario)
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: profile } = await supabaseAdmin.from('profiles').select('phone_number').eq('id', user.id).single();
    
    if (!profile?.phone_number) throw new Error("Usuario sin teléfono");

    // 5. HACER LA PETICIÓN A WHAPI (El token está seguro aquí en el servidor)
    const whapiToken = Deno.env.get('WHAPI_TOKEN'); 
    
    const whapiResponse = await fetch(
  "https://gate.whapi.cloud/messages/text",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${whapiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: profile.phone_number,
      body: mensaje,
    }),
  }
);

    // 💡 NUEVO: Verificamos explícitamente si Whapi falló
    if (!whapiResponse.ok) {
      const errorDetails = await whapiResponse.text();
      throw new Error(`Fallo en Whapi (Status ${whapiResponse.status}): ${errorDetails}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400 
    });
  }
});