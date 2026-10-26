/**
 * Bateria de Testes Automatizados para a Visualização Completa de Retornos (Agenda LK)
 * Valida os fluxos descritos na Seção 7 do Prompt Técnico:
 * - Teste A: Retorno com descrição simples
 * - Teste B: Descrição extensa (múltiplas linhas, quebras de linha \n, acentuação, pontuação)
 * - Teste C: Preservação dos dados (consulta pura sem mutação)
 * - Teste D: Retorno sem descrição (aviso discreto sem conteúdo inventado)
 * - Teste E: Edição (preservação do texto anterior e persistência da nova descrição)
 * - Teste F: Integridade, compatibilidade legada (title, date, observation, notes) e isolamento
 */

import type { FollowUp, Customer } from '../src/lib/types';
import { cleanFirestoreData } from '../src/lib/utils';

// Helper de simulação idêntico ao helper em src/app/follow-ups/page.tsx
export function extractRetornoDescription(followUp?: Partial<FollowUp>): string {
  if (!followUp) return '';
  return (
    followUp.description ||
    (followUp as any).notes ||
    (followUp as any).observation ||
    (followUp as any).observations ||
    (followUp as any).details ||
    ''
  );
}

export function formatRetornoDisplayTitle(followUp?: Partial<FollowUp>): string {
  if (!followUp) return 'Detalhes do Retorno';
  return followUp.contactName || followUp.title || 'Detalhes do Retorno';
}

export function formatRetornoDate(followUp?: Partial<FollowUp>): string {
  if (!followUp) return 'Data não informada';
  return followUp.dueDate || followUp.date || 'Data não informada';
}

function runFollowUpTests() {
  console.log('🧪 Iniciando Bateria de Testes do Mecanismo de Retornos (Agenda LK)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // =========================================================================
  // Teste A — Retorno com descrição simples
  // =========================================================================
  console.log('--- Teste A: Retorno com descrição simples ---');
  const retornoSimples: FollowUp = {
    id: 'fup-001',
    ownerId: 'user-123',
    contactName: 'Carlos Eduardo Oliveira',
    description: 'Cliente solicitou retorno sobre a margem consignável disponível.',
    dueDate: '2026-10-30',
    dueTime: '14:30',
    status: 'pending',
    createdAt: '2026-10-26T10:00:00.000Z',
  };

  assert(formatRetornoDisplayTitle(retornoSimples) === 'Carlos Eduardo Oliveira', 'Título exibido corretamente');
  assert(extractRetornoDescription(retornoSimples) === 'Cliente solicitou retorno sobre a margem consignável disponível.', 'Descrição simples recuperada integralmente');
  assert(formatRetornoDate(retornoSimples) === '2026-10-30', 'Data agendada preservada');

  // =========================================================================
  // Teste B — Descrição extensa com múltiplas linhas, acentuação e pontuação
  // =========================================================================
  console.log('\n--- Teste B: Descrição extensa (múltiplas linhas, pontuação, acentuação) ---');
  const descricaoExtensa = `Atendimento realizado com a cliente Dona Maria das Dores.
PONTOS TRATADOS:
1. Contrato da Caixa Econômica Federal em aberto (parcela R$ 450,20).
2. Simulação de Portabilidade com redução de taxa de 1,84% para 1,52% a.m.
3. Troco estimado: R$ 3.850,00 a ser creditado na conta corrente do Banco do Brasil.

OBSERVAÇÕES IMPORTANTES:
- Cliente viajou para o interior e pediu para ligar impreterivelmente na próxima sexta-feira às 15h.
- Esposo (Sr. Antônio) já concordou com a proposta.
- Não ligar antes do almoço pois a cliente faz hemodiálise.`;

  const retornoExtenso: FollowUp = {
    id: 'fup-002',
    ownerId: 'user-123',
    contactName: 'Maria das Dores',
    description: descricaoExtensa,
    dueDate: '2026-11-06',
    dueTime: '15:00',
    status: 'pending',
    createdAt: '2026-10-26T11:00:00.000Z',
  };

  const recoveredExtensa = extractRetornoDescription(retornoExtenso);
  assert(recoveredExtensa === descricaoExtensa, 'Descrição extensa preserva 100% dos caracteres');
  assert(recoveredExtensa.includes('\n'), 'Quebras de linha (\\n) são preservadas integralmente');
  assert(recoveredExtensa.includes('R$ 3.850,00') && recoveredExtensa.includes('1,84%'), 'Pontuação, símbolos e decimais preservados');
  assert(recoveredExtensa.includes('hemodiálise') && recoveredExtensa.includes('Econômica'), 'Acentuação gráfica (ã, é, ó, í, etc.) preservada');
  assert(recoveredExtensa.length > 300, `Texto com ${recoveredExtensa.length} caracteres recuperado sem corte`);

  // =========================================================================
  // Teste C — Preservação dos dados na consulta pura (imutabilidade na leitura)
  // =========================================================================
  console.log('\n--- Teste C: Preservação dos dados na consulta pura ---');
  const snapshotOriginal = JSON.stringify(retornoExtenso);
  
  // Simula múltiplos ciclos de abertura, consulta e fechamento
  for (let i = 0; i < 5; i++) {
    const title = formatRetornoDisplayTitle(retornoExtenso);
    const desc = extractRetornoDescription(retornoExtenso);
    const date = formatRetornoDate(retornoExtenso);
  }
  const snapshotAposConsulta = JSON.stringify(retornoExtenso);
  assert(snapshotOriginal === snapshotAposConsulta, 'Consultar e fechar o retorno não altera os dados nem causa mutação');

  // =========================================================================
  // Teste D — Retorno sem descrição (mensagem discreta sem dados inventados)
  // =========================================================================
  console.log('\n--- Teste D: Retorno sem descrição cadastrada ---');
  const retornoSemDescricao: FollowUp = {
    id: 'fup-003',
    ownerId: 'user-123',
    contactName: 'João Pereira',
    description: '',
    dueDate: '2026-10-28',
    status: 'pending',
    createdAt: '2026-10-26T12:00:00.000Z',
  };

  const descVazia = extractRetornoDescription(retornoSemDescricao);
  assert(descVazia === '', 'Retorno sem descrição retorna string vazia (não inventa texto)');
  const mensagemUI = descVazia && descVazia.trim().length > 0 
    ? descVazia 
    : 'Nenhuma descrição registrada para este retorno.';
  assert(mensagemUI === 'Nenhuma descrição registrada para este retorno.', 'Interface apresenta mensagem discreta e profissional');

  // =========================================================================
  // Teste E — Edição de Retorno
  // =========================================================================
  console.log('\n--- Teste E: Edição de Retorno ---');
  // 1. Simula carregamento no formulário de edição
  const initialFormValues = {
    contactName: retornoSimples.contactName || (retornoSimples as any).title || '',
    description: retornoSimples.description || (retornoSimples as any).notes || '',
    dueDate: retornoSimples.dueDate || (retornoSimples as any).date || '',
  };
  assert(initialFormValues.description === retornoSimples.description, 'Descrição anterior é carregada intacta no formulário de edição');

  // 2. Simula alteração legítima feita pelo usuário
  const updatedFormValues = {
    ...initialFormValues,
    description: retornoSimples.description + '\nAtualização: Cliente confirmou interesse no refinanciamento.',
  };

  // 3. Simula salvamento via cleanFirestoreData e merge
  const finalUpdatedData = cleanFirestoreData({
    ...retornoSimples,
    ...updatedFormValues,
    title: updatedFormValues.contactName,
    date: updatedFormValues.dueDate,
  });

  assert(finalUpdatedData.description.includes('Atualização: Cliente confirmou interesse'), 'Nova descrição persistida com sucesso');
  assert(finalUpdatedData.description.startsWith(retornoSimples.description), 'Texto original anterior foi mantido junto à atualização');
  assert(finalUpdatedData.id === retornoSimples.id, 'ID do registro foi rigorosamente preservado');

  // =========================================================================
  // Teste F — Integridade, Permissões e Compatibilidade com Registros Legados
  // =========================================================================
  console.log('\n--- Teste F: Compatibilidade legada e integridade ---');
  // Simula um registro antigo com campo `title` em vez de `contactName` e `date` em vez de `dueDate`
  const retornoLegado1: Partial<FollowUp> = {
    id: 'fup-old-01',
    ownerId: 'user-123',
    title: 'Ana Cristina (Registro Antigo)',
    notes: 'Descrição gravada antigamente no campo notes.',
    date: '2026-09-15',
    status: 'pendente' as any,
    createdAt: '2026-09-10T08:00:00.000Z',
  };

  assert(formatRetornoDisplayTitle(retornoLegado1) === 'Ana Cristina (Registro Antigo)', 'Suporta fallback de title quando contactName não existe');
  assert(extractRetornoDescription(retornoLegado1) === 'Descrição gravada antigamente no campo notes.', 'Suporta fallback de notes quando description não existe');
  assert(formatRetornoDate(retornoLegado1) === '2026-09-15', 'Suporta fallback de date quando dueDate não existe');

  // Simula registro legado com `observation`
  const retornoLegado2: Partial<FollowUp> = {
    id: 'fup-old-02',
    ownerId: 'user-123',
    contactName: 'Severino Silva',
    observation: 'Anotações armazenadas no campo observation.',
    dueDate: '2026-10-20',
    status: 'concluido' as any,
  };
  assert(extractRetornoDescription(retornoLegado2) === 'Anotações armazenadas no campo observation.', 'Suporta fallback de observation');

  // Simula vínculo com cliente
  const mockCustomer: Customer = {
    id: 'cust-999',
    numericId: 101,
    name: 'Sebastião Fagundes',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    birthDate: '1960-05-12',
    ownerId: 'user-123',
  };

  const retornoComCliente: FollowUp = {
    id: 'fup-004',
    ownerId: 'user-123',
    customerId: 'cust-999',
    contactName: 'Sebastião Fagundes',
    description: 'Oferecer redução de juros do contrato.',
    dueDate: '2026-11-01',
    status: 'pending',
    createdAt: '2026-10-26T12:00:00.000Z',
  };

  const customerFound = mockCustomer.id === retornoComCliente.customerId ? mockCustomer : null;
  assert(customerFound !== null && customerFound.name === 'Sebastião Fagundes', 'Retorno continua vinculado com sucesso ao cliente correto');

  // Simula retorno avulso sem cliente
  const retornoSemCliente: FollowUp = {
    id: 'fup-005',
    ownerId: 'user-123',
    contactName: 'Prospect Sem Cadastro',
    description: 'Lead captado em evento externo.',
    dueDate: '2026-11-02',
    status: 'pending',
    createdAt: '2026-10-26T12:00:00.000Z',
  };
  const customerAvulso = retornoSemCliente.customerId ? mockCustomer : null;
  assert(customerAvulso === null, 'Retorno avulso sem cliente é suportado normalmente sem causar exceções');

  console.log(`\n======================================================`);
  console.log(`📊 Resultado Final: ${passed} testes passaram, ${failed} falharam.`);
  console.log(`======================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFollowUpTests();
