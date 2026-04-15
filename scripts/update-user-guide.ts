import * as fs from 'fs';
import * as path from 'path';
import { 
  productTypes, 
  proposalStatuses, 
  approvingBodies, 
  defaultCustomerTags, 
  defaultRejectionReasons,
  banks,
  operationalSteps
} from '../src/lib/config-data';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const GUIDE_PATH = path.join(DOCS_DIR, 'UserGuide.md');

function generateGuide() {
  const now = new Date().toLocaleString('pt-BR');

  const content = `# 📘 Guia do Usuário - CRM LK RAMOS

Este guia é gerado automaticamente com base nas configurações atuais do sistema.
**Última Atualização:** ${now}

---

## 🚀 Fluxo de Propostas

O sistema utiliza os seguintes status para gerenciar o ciclo de vida das propostas:

${proposalStatuses.map(status => `- **${status}**`).join('\n')}

---

## 🛠️ Produtos e Órgãos

### Produtos Homologados
${productTypes.map(type => `- ${type}`).join('\n')}

### Órgãos Aprovadores
${approvingBodies.map(body => `- ${body}`).join('\n')}

---

## 📋 Checklist Operacional

Cada proposta passa pelas seguintes etapas de conferência:

${operationalSteps.map(step => `- **${step.label}**: Responsável por garantir a integridade da fase de ${step.label.toLowerCase()}.`).join('\n')}

---

## 🏷️ Gestão de Clientes (Tags)

Classificamos nossos clientes utilizando as seguintes etiquetas:

${defaultCustomerTags.map(tag => `- ${tag}`).join('\n')}

---

## ⚠️ Motivos de Cancelamento/Indeferimento

Principais motivos registrados no sistema para controle de qualidade:

${defaultRejectionReasons.map(reason => `- ${reason}`).join('\n')}

---

## 🏦 Bancos e Parceiros

Atualmente operamos com as seguintes instituições:

${banks.slice(0, 15).map(bank => `- ${bank}`).join('\n')}
${banks.length > 15 ? `*... e mais ${banks.length - 15} instituições.*` : ''}

---

## 💻 Interface e Layout

### Painel de Cadastro de Cliente
- Modal de Cadastro ampliado (\`max-w-5xl\`) para proporcionar maior flexibilidade horizontal e conforto visual.
- Os blocos de Benefícios (Órgão / Espécie) possuem layout fluído, facilitando o manuseio de nomenclaturas longas (ex: opções extensas do INSS).

---

> [!TIP]
> Para alterar qualquer uma dessas informações (Instituições, Tag, etc), acesse o menu **Configurações > Parâmetros** no CRM.
`;

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  fs.writeFileSync(GUIDE_PATH, content, 'utf8');
  console.log(`✅ Guia do Usuário atualizado com sucesso em: ${GUIDE_PATH}`);
}

generateGuide();
