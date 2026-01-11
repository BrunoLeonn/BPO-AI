
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyProfile, Transaction, AIAdvice } from "./types.ts";

export const analyzeCNPJCard = async (
  fileData: { data: string; mimeType: string }
): Promise<Partial<CompanyProfile>> => {
  // Inicialização robusta com fallback para string vazia conforme solicitado
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const prompt = `Você é um assistente de onboarding de BPO. Analise o Cartão CNPJ anexo.
    Extraia os seguintes dados estruturados:
    - Razão Social (name)
    - Nome Fantasia (tradingName)
    - CNPJ
    - Atividade Econômica Principal (CNAE e descrição)
    - Endereço completo
    - Data de Abertura
    
    Retorne apenas o JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: fileData.data, mimeType: fileData.mimeType } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          tradingName: { type: Type.STRING },
          cnpj: { type: Type.STRING },
          industry: { type: Type.STRING },
          cnae: { type: Type.STRING },
          address: { type: Type.STRING },
          openingDate: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateAIStrategy = async (
  company: CompanyProfile,
  transactions: Transaction[]
): Promise<AIAdvice> => {
  // Inicialização robusta com fallback para string vazia
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const summaryData = transactions.slice(-50).map(t => ({
    desc: t.description,
    val: t.amount,
    type: t.type,
    cat: t.category,
    date: t.date
  }));

  const prompt = `Como consultor financeiro sênior especializado no ramo ${company.industry}, analise o perfil da empresa ${company.name} (CNPJ: ${company.cnpj}) e suas transações recentes: ${JSON.stringify(summaryData)}.
    
    Forneça:
    1. Um Health Score de 0 a 100 baseado em liquidez e diversificação de gastos.
    2. Um resumo executivo da saúde financeira.
    3. Pontos fortes (ex: controle de custos, margem alta).
    4. Pontos fracos (ex: dependência de poucos clientes, altas taxas bancárias).
    5. Plano de ação com 3 a 5 recomendações práticas.
    
    Seja crítico, profissional e direto.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["healthScore", "summary", "strengths", "weaknesses", "recommendations"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const processStatementFile = async (
  company: CompanyProfile,
  fileData: { data: string; mimeType: string; fileName: string }
): Promise<Transaction[]> => {
  // Inicialização robusta com fallback para string vazia
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const isPDF = fileData.mimeType === 'application/pdf';
  const prompt = `Analise o extrato bancário (Arquivo: ${fileData.fileName}) da empresa ${company.name} (${company.industry || 'Geral'}). 
    Extraia TODAS as transações e classifique-as no plano de contas.
    IMPORTANTE: Atribua um percentual de confiança (0-100) for cada classificação baseada na descrição.
    A data deve estar obrigatoriamente no formato ISO YYYY-MM-DD.
    Identifique o banco (ex: Santander, Mercado Pago, Itaú) a partir do conteúdo do extrato.
    Seja preciso com valores negativos (saídas) e positivos (entradas).`;
    
  const parts: any[] = [{ text: prompt }];

  if (isPDF) {
    parts.push({ inlineData: { data: fileData.data, mimeType: fileData.mimeType } });
  } else {
    const decodedText = atob(fileData.data);
    parts.push({ text: `Conteúdo do Arquivo: ${decodedText}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            costCenter: { type: Type.STRING },
            bankName: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["id", "date", "description", "amount", "type", "category", "subCategory", "bankName", "confidence"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
