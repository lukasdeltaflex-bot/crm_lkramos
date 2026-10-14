import { normalizeCpf, formatCpf, matchCpf, getCpfVariants, validateCPF } from '../src/lib/utils';

function runCpfTests() {
  console.log('🧪 Iniciando Bateria de Testes de Normalização e Busca de CPF...');

  const testMatrix = [
    { stored: '123.456.789-00', search: '12345678900', expected: true, label: 'Armazenado com pontuação, busca sem pontuação' },
    { stored: '12345678900', search: '123.456.789-00', expected: true, label: 'Armazenado sem pontuação, busca com pontuação' },
    { stored: '123.456.789-00', search: '123.456.789-00', expected: true, label: 'Ambos com pontuação' },
    { stored: '12345678900', search: '12345678900', expected: true, label: 'Ambos sem pontuação' },
    { stored: '987.654.321-11', search: '12345678900', expected: false, label: 'CPFs diferentes não devem casar' },
    { stored: '123.456.789-00', search: '123.456', expected: true, label: 'Busca parcial com pontuação encontra' },
    { stored: '12345678900', search: '123456', expected: true, label: 'Busca parcial sem pontuação encontra' },
    { stored: undefined, search: '12345678900', expected: false, label: 'CPF armazenado indefinido não causa erro' },
    { stored: '12345678900', search: '', expected: false, label: 'Busca vazia não dá match positivo falso' }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of testMatrix) {
    const result = matchCpf(t.stored, t.search);
    if (result === t.expected) {
      console.log(`  ✅ [PASS] ${t.label}: stored="${t.stored}" search="${t.search}" => ${result}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${t.label}: stored="${t.stored}" search="${t.search}" => esperado ${t.expected}, recebido ${result}`);
      failed++;
    }
  }

  // Testes de variantes para queries do Firestore
  const variants1 = getCpfVariants('12345678900');
  if (variants1.includes('12345678900') && variants1.includes('123.456.789-00')) {
    console.log('  ✅ [PASS] getCpfVariants gera ambas as formas (pura e mascarada)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] getCpfVariants falhou:', variants1);
    failed++;
  }

  const variants2 = getCpfVariants('123.456.789-00');
  if (variants2.includes('12345678900') && variants2.includes('123.456.789-00')) {
    console.log('  ✅ [PASS] getCpfVariants a partir de formatado gera forma pura');
    passed++;
  } else {
    console.error('  ❌ [FAIL] getCpfVariants a partir de formatado falhou:', variants2);
    failed++;
  }

  console.log(`\n📊 Resultado final dos testes de CPF: ${passed} passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCpfTests();
