
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyProfile, Transaction, AIAdvice } from "./types.ts";

/**
 * Captura a chave exclusivamente do ambiente
 */
const API_KEY = process.env.API_KEY as string;

/**
 * Função utilitária para limpar o texto da resposta antes do parse JSON
 */
const cleanJsonResponse = (text: string) => {
  // Remove blocos de código markdown (```json ... ```) se existirem
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return cleaned;
};

export const analyzeCNPJCard = async (
  fileData: { data: string; mimeType: string }
): Promise<Partial<CompanyProfile>> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `Você é um assistente de onboarding da APOLO FINANCE. 
    Analise o Cartão CNPJ anexo.
    Extraia Razão Social (name), Nome Fantasia (tradingName), CNPJ, Atividade (industry) e Endereço.
    Retorne apenas o JSON puro, sem markdown.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: fileData.data, mimeType: fileData.mimeType } }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          tradingName: { type: Type.STRING },
          cnpj: { type: Type.STRING },
          industry: { type: Type.STRING },
          address: { type: Type.STRING }
        }
      }
    }
  });

  try {
    return JSON.parse(cleanJsonResponse(response.text || '{}'));
  } catch(e) {
    console.error("Erro no Parse JSON do CNPJ", e);
    return {};
  }
};

export const generateAIStrategy = async (
  company: CompanyProfile,
  transactions: Transaction[]
): Promise<AIAdvice> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const summaryData = transactions.slice(-100).map(t => ({
    desc: t.description,
    val: t.amount,
    type: t.type,
    cat: t.category,
    date: t.date
  }));

  const systemInstruction = `Como consultor financeiro sênior da APOLO FINANCE, analise a empresa ${company.name} (${company.industry}).
    Considere a saúde financeira e forneça um parecer iluminado e estratégico.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Dados Financeiros: ${JSON.stringify(summaryData)}`,
    config: {
      systemInstruction,
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

  try {
    return JSON.parse(cleanJsonResponse(response.text || '{}'));
  } catch(e) {
    console.error("Erro no Parse da Estratégia", e);
    throw new Error("Falha na inteligência estratégica.");
  }
};

export const processStatementFile = async (
  company: CompanyProfile,
  fileData: { data: string; mimeType: string; fileName: string }
): Promise<Transaction[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const isPDF = fileData.mimeType === 'application/pdf';
  
  const systemInstruction = `Analise o extrato bancário ${fileData.fileName} da empresa ${company.name}.
    Extraia TODAS as transações (Data ISO, Descrição, Valor, Tipo INCOME/EXPENSE).
    Classifique em categorias do plano de contas brasileiro.`;
    
  const parts: any[] = [];
  if (isPDF) {
    parts.push({ inlineData: { data: fileData.data, mimeType: fileData.mimeType } });
  } else {
    try {
      const decodedText = atob(fileData.data);
      parts.push({ text: decodedText });
    } catch(e) {
      parts.push({ text: "Erro ao decodificar arquivo de texto." });
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            bankName: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["id", "date", "description", "amount", "type", "category", "subCategory", "bankName"]
        }
      }
    }
  });

  try {
    return JSON.parse(cleanJsonResponse(response.text || '[]'));
  } catch(e) {
    console.error("Erro no Parse do Extrato", e);
    return [];
  }
};
