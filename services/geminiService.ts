
import { GoogleGenAI, Type } from "@google/genai";
import { PropertyData, AdResponse, UserProfile } from "../types";

const getSystemPrompt = (profile: UserProfile) => `
    Você é o melhor copywriter do mercado imobiliário brasileiro. Sua missão é transformar dados técnicos em anúncios magnéticos de alta conversão.

    DADOS OBRIGATÓRIOS DO CORRETOR PARA O FINAL DE CADA LEGENDA:
    Nome: ${profile.name || 'Corretor'}
    CRECI: ${profile.creci || 'Não informado'}
    WhatsApp: ${profile.telefone || 'A consultar'}

    REGRAS DE OURO:
    1. NÃO INCLUA o nome da plataforma no início do texto (Ex: Não comece com "OLX:").
    2. Use frameworks de persuasão como AIDA (Atenção, Interesse, Desejo, Ação).
    3. Fale de BENEFÍCIOS e ESTILO DE VIDA, não apenas características técnicas.
    4. Formatação impecável com quebras de linha estratégicas para facilitar a leitura.
    5. Use emojis de forma moderada e elegante.
    6. ASSINATURA OBRIGATÓRIA: Todo e qualquer texto gerado DEVE terminar obrigatoriamente com o bloco de contato do corretor.
       Exemplo de formato sugerido: 
       "📞 Fale agora com ${profile.name || 'o corretor'}
       🆔 CRECI: ${profile.creci || 'Não informado'}
       💬 WhatsApp: ${profile.telefone || 'A consultar'}"
`;

const getPlatformInstructions = (platform: string) => {
  switch (platform) {
    case 'olx': return "OLX/ZAP/VIVA: Descrição técnica completa, tom amigável, profissional e informativo. Liste as características principais de forma clara.";
    case 'whatsapp': return "WHATSAPP: Texto direto, pessoal e persuasivo. Use bullet points para os destaques. Comece com uma saudação que quebre o gelo. Formate para leitura rápida em telas pequenas.";
    case 'instagram': return "INSTAGRAM: Legenda aspiracional, foco na experiência de morar no imóvel. Use parágrafos curtos e hashtags relevantes no final, logo após os dados de contato.";
    case 'tiktok': return "TIKTOK: Legenda curta, dinâmica e 'hypada'. Use um gancho forte na primeira frase. CTA focado em comentários ou direct.";
    default: return "";
  }
};

export const generateAds = async (data: PropertyData, profile: UserProfile): Promise<AdResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ${getSystemPrompt(profile)}

    DADOS DO IMÓVEL:
    Tipo: ${data.tipo} | Cidade: ${data.cidade} | Bairro: ${data.bairro} | Valor: ${data.preco}
    Área: ${data.area} m² | Quartos: ${data.quartos} | Banheiros: ${data.banheiros} | Vagas: ${data.vagas}
    Diferenciais: ${data.diferenciais}

    TAREFA: Gere 4 opções de anúncios, uma para cada plataforma abaixo, garantindo que TODAS contenham os dados do corretor no final.

    ESTRUTURA DESEJADA:
    - ${getPlatformInstructions('olx')}
    - ${getPlatformInstructions('whatsapp')}
    - ${getPlatformInstructions('instagram')}
    - ${getPlatformInstructions('tiktok')}

    Retorne estritamente um JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          olx: { type: Type.STRING },
          whatsapp: { type: Type.STRING },
          instagram: { type: Type.STRING },
          tiktok: { type: Type.STRING },
        },
        required: ["olx", "whatsapp", "instagram", "tiktok"],
      },
    },
  });

  const resultText = response.text;
  if (!resultText) throw new Error("Resposta vazia da IA");
  return JSON.parse(resultText) as AdResponse;
};

export const generateSingleAd = async (platform: keyof AdResponse, data: PropertyData, profile: UserProfile): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ${getSystemPrompt(profile)}

    DADOS DO IMÓVEL:
    ${JSON.stringify(data)}

    TAREFA: Gere APENAS uma NOVA descrição para a plataforma: ${platform.toUpperCase()}.
    INSTRUÇÃO ESPECÍFICA: ${getPlatformInstructions(platform)}

    IMPORTANTE: Não esqueça de incluir o Nome, CRECI e WhatsApp do corretor ao final do texto, conforme as regras de ouro definidas no sistema.
    
    Retorne APENAS o texto da descrição final, pronto para uso.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const text = response.text;
  if (!text) throw new Error("Resposta vazia da IA");
  return text.trim();
};
