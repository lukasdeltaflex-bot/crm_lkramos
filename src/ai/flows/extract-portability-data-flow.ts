'use server';
/**
 * @fileOverview Fluxo Genkit para extrair APENAS OS DADOS de clientes a partir de imagens ou PDFs (OCR) para simulação de portabilidade. Não toma decisões bancárias.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContractExtractionSchema = z.object({
    sourceBank: z.string().optional().describe('Nome do banco onde consta este contrato/empréstimo de origem.'),
    installmentValue: z.number().optional().describe('Valor da parcela (R$).'),
    installmentsPaid: z.number().optional().describe('Quantidade de parcelas já pagas.'),
    totalInstallments: z.number().optional().describe('Quantidade total de parcelas do contrato original.'),
    outstandingBalance: z.number().optional().describe('Saldo devedor restante (R$).'),
    interestRate: z.number().optional().describe('Taxa de juros atual (%) se informada.'),
});

const ExtractPortabilityDataOutputSchema = z.object({
    name: z.string().optional().describe('Nome completo do cliente.'),
    cpf: z.string().optional().describe('CPF do cliente.'),
    age: z.number().optional().describe('Idade do cliente, se possível calcular/encontrar. Retornar APENAS número.'),
    benefitSpecies: z.string().optional().describe('Espécie do benefício listado (ex: 42, 87, Aposentadoria por Idade).'),
    availableMargin: z.number().optional().describe('Margem consignável livre (R$) se existir.'),
    contracts: z.array(ContractExtractionSchema).optional().describe('Lista de empréstimos/contratos extraídos do documento.'),
}).describe('Estrutura rígida de dados brutos extraídos do HISCON ou Extrato.');

export type ExtractPortabilityDataOutput = z.infer<typeof ExtractPortabilityDataOutputSchema>;

/**
 * Server Action exportada para extrair dados sem inferir regras.
 */
export async function extractPortabilityDataFromImage(photoDataUri: string): Promise<ExtractPortabilityDataOutput> {
    if (!photoDataUri) throw new Error("Documento não fornecido para extração.");

    let contentType = 'image/jpeg';
    const match = photoDataUri.match(/^data:([^;]+);base64,/);
    if (match) {
        contentType = match[1];
    }

    try {
        console.log(`🤖 IA LK RAMOS (Simulador Fase 2): Iniciando Extração Vision OCR...`);
        
        const { output } = await ai.generate({
          model: "googleai/gemini-2.5-flash-lite",
          prompt: [
            { text: `Você é um robô de leitura de dados. Sua ÚNICA função é examinar este documento (geralmente HISCON, extrato de empréstimos) e devolver os dados brutos encontrados organizados no JSON.
            - NUNCA invente contratos. NUNCA adivinhe bancos ou taxas se não estiverem legíveis.
            - EXTRAIA: Banco de Origem, Quantidade de Parcelas Pagas, Saldo Devedor Deste Contrato, Valor da Parcela.
            - DEVOLVA SOMENTE FONTES DE DADOS ESTRUTURADAS. Não opine se o cliente pode portar.` },
            { media: { url: photoDataUri, contentType: contentType } }
          ],
          output: { schema: ExtractPortabilityDataOutputSchema }
        });

        return output || {};
    } catch (error: any) {
        console.error("❌ ERRO NA CHAMADA DA IA (Simulador Extração):", error);
        throw new Error(`Falha na IA ao analisar documento. Detalhes: ${error.message || 'Erro de rede'}`);
    }
}
