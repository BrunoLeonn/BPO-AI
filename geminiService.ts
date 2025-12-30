
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyProfile, Transaction } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processStatementFile = async (
  company: CompanyProfile,
  fileData: { data: string; mimeType: string; fileName: string }
): Promise<Transaction[]> => {
  
  const isPDF = fileData.mimeType === 'application/pdf';
  
  const prompt = `Você é um especialista em BPO Financeiro. 
    Analise o arquivo anexo (extrato bancário) da empresa: ${company.name}, ramo: ${company.industry}.
    
    TAREFAS:
    1. Identifique o banco emissor (ex: Santander, Mercado Pago, Itaú).
    2. Extraia cada transação com data, descrição e valor.
    3. Classifique cada item em um Plano de Contas ideal (Categoria e Subcategoria).
    4. Atribua um Centro de Custo apropriado.
    
    REGRAS DE VALOR:
    - Entradas (depósitos, vendas) = INCOME
    - Saídas (pagamentos, transferências enviadas, tarifas) = EXPENSE
    - Retorne valores numéricos positivos para ambos, o campo 'type' definirá o sinal.

    Retorne apenas o JSON puro, sem markdown.`;

  const parts: any[] = [{ text: prompt }];

  if (isPDF) {
    parts.push({
      inlineData: {
        data: fileData.data,
        mimeType: fileData.mimeType
      }
    });
  } else {
    // Para OFX ou TXT, enviamos como texto extraído
    const decodedText = atob(fileData.data);
    parts.push({ text: `Conteúdo do arquivo ${fileData.fileName}:\n${decodedText}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            costCenter: { type: Type.STRING },
            bankName: { type: Type.STRING }
          },
          required: ["id", "date", "description", "amount", "type", "category", "subCategory", "costCenter", "bankName"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Erro ao processar resposta da IA", e);
    return [];
  }
};
