const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, 
        AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType, 
        VerticalAlign, PageNumber, PageBreak, ExternalHyperlink } = require('docx');
const fs = require('fs');

// Cores profissionais - estilo Midnight Code para tecnologia
const colors = {
  primary: "#020617",      // Midnight Black - títulos
  body: "#1E293B",         // Deep Slate Blue - corpo
  secondary: "#64748B",    // Cool Blue-Gray - subtítulos
  accent: "#94A3B8",       // Steady Silver - acentos
  tableBg: "#F8FAFC",      // Glacial Blue-White - fundo tabela
  tableBorder: "#CBD5E1"   // Border suave
};

// Bordas de tabela
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.tableBorder };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// Função helper para criar células de tabela
function createCell(text, options = {}) {
  const { bold = false, header = false, align = AlignmentType.LEFT } = options;
  return new TableCell({
    borders: cellBorders,
    shading: header ? { fill: colors.tableBg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold: bold || header, size: header ? 22 : 21, color: colors.body })]
    })]
  });
}

// Criar documento
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-main", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-main", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-requisitos", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-manual", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-pm2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-nginx", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-ssl", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Manual de Instalação - TecOS", size: 18, color: colors.secondary, italics: true })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Página ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                   new TextRun({ text: " de ", size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })]
      })] })
    },
    children: [
      // Capa
      new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [new TextRun({ text: "TecOS", size: 72, bold: true, color: colors.primary, font: "Times New Roman" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "Sistema de Gestão de Ordens de Serviço", size: 32, color: colors.secondary })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 400 },
        children: [new TextRun({ text: "Manual de Instalação e Configuração", size: 36, bold: true, color: colors.body })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        children: [new TextRun({ text: "Versão 1.0", size: 24, color: colors.secondary })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "SaaS Multi-Loja para Assistência Técnica", size: 22, color: colors.accent })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // Índice
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Índice")] }),
      new Paragraph({ spacing: { before: 100, after: 200 }, children: [
        new TextRun({ text: "1. Visão Geral do Sistema", size: 22 }),
      ]}),
      new Paragraph({ children: [new TextRun({ text: "2. Requisitos do Sistema", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "3. Instalação Automática (Recomendado)", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "4. Instalação Manual", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "5. Configuração do Nginx", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "6. Configuração SSL/HTTPS", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "7. Gerenciamento com PM2", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "8. Tipos de Hospedagem Recomendados", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "9. Solução de Problemas", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "10. Credenciais Padrão", size: 22 })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // Seção 1 - Visão Geral
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Visão Geral do Sistema")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O TecOS é um sistema SaaS (Software as a Service) multi-loja desenvolvido para gerenciar ordens de serviço de assistências técnicas. O sistema permite que múltiplas lojas utilizem a mesma plataforma, cada uma com seus próprios dados, clientes e ordens de serviço, enquanto um administrador global (SuperAdmin) gerencia todo o sistema.", size: 22, color: colors.body })
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Principais Funcionalidades")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Gestão completa de ordens de serviço com status, prioridades e histórico", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Cadastro de clientes com histórico de atendimentos", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Sistema multi-usuário por loja com diferentes níveis de acesso", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Painel administrativo para o SuperAdmin gerenciar todas as lojas", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Impressão de recibos e ordens de serviço em formato profissional", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Upload de fotos para documentação do equipamento", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [
        new TextRun({ text: "Portal público para clientes consultarem o status de suas OS", size: 22 })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Tecnologias Utilizadas")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O TecOS foi construído com tecnologias modernas e robustas, garantindo performance, segurança e escalabilidade. O frontend utiliza Next.js 16 com React 19, proporcionando uma experiência de usuário fluida com renderização do lado do servidor. O banco de dados SQLite com Prisma ORM oferece simplicidade de manutenção sem comprometer a funcionalidade. A autenticação é realizada via JWT com cookies HTTP-only para máxima segurança.", size: 22, color: colors.body })
      ]}),

      new Table({
        columnWidths: [3000, 6360],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [
            createCell("Componente", { header: true, align: AlignmentType.CENTER }),
            createCell("Tecnologia", { header: true, align: AlignmentType.CENTER })
          ]}),
          new TableRow({ children: [createCell("Frontend"), createCell("Next.js 16 + React 19 + TypeScript")] }),
          new TableRow({ children: [createCell("Estilização"), createCell("Tailwind CSS 4 + shadcn/ui")] }),
          new TableRow({ children: [createCell("Backend"), createCell("Next.js API Routes (Server-Side)")] }),
          new TableRow({ children: [createCell("Banco de Dados"), createCell("SQLite com Prisma ORM")] }),
          new TableRow({ children: [createCell("Autenticação"), createCell("JWT + bcryptjs + Cookies HTTP-only")] }),
          new TableRow({ children: [createCell("Runtime"), createCell("Node.js 18+ ou Bun")] }),
          new TableRow({ children: [createCell("Process Manager"), createCell("PM2 para produção")] })
        ]
      }),
      new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Tabela 1: Stack tecnológico do sistema TecOS", size: 18, italics: true, color: colors.secondary })
      ]}),

      // Seção 2 - Requisitos
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Requisitos do Sistema")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Antes de iniciar a instalação, certifique-se de que seu servidor atende aos requisitos mínimos. O TecOS foi projetado para funcionar em servidores modestos, graças ao uso eficiente de recursos do SQLite e do Next.js standalone. Para ambientes de produção com múltiplas lojas e alto tráfego, recomenda-se os requisitos recomendados para garantir melhor performance e capacidade de resposta.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requisitos Mínimos")] }),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "Sistema Operacional: Ubuntu 20.04 LTS ou superior (também compatível com Debian 11+, CentOS 8+)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "CPU: 1 núcleo de processador (recomendado 2 núcleos para melhor performance)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "Memória RAM: 1 GB mínimo (2 GB recomendado para produção)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "Armazenamento: 5 GB de espaço em disco (SSD recomendado para melhor I/O)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "Node.js: Versão 18.x ou superior (LTS recomendado)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "npm ou Bun: Gerenciador de pacotes para instalação das dependências", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-requisitos", level: 0 }, children: [
        new TextRun({ text: "Acesso root ou sudo: Necessário para instalação de dependências do sistema", size: 22 })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Portas de Rede")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "O sistema utiliza as seguintes portas de rede para funcionamento correto. Certifique-se de que estas portas estejam liberadas no firewall do seu servidor. A porta 3000 é onde o TecOS roda internamente, enquanto as portas 80 e 443 são usadas pelo Nginx para servir o aplicativo publicamente.", size: 22, color: colors.body })
      ]}),

      new Table({
        columnWidths: [2000, 3180, 4180],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [
            createCell("Porta", { header: true, align: AlignmentType.CENTER }),
            createCell("Serviço", { header: true, align: AlignmentType.CENTER }),
            createCell("Descrição", { header: true, align: AlignmentType.CENTER })
          ]}),
          new TableRow({ children: [createCell("3000"), createCell("TecOS (interno)"), createCell("Aplicação Node.js/Bun")] }),
          new TableRow({ children: [createCell("80"), createCell("Nginx (HTTP)"), createCell("Tráfego web não seguro")] }),
          new TableRow({ children: [createCell("443"), createCell("Nginx (HTTPS)"), createCell("Tráfego web seguro com SSL")] }),
          new TableRow({ children: [createCell("22"), createCell("SSH"), createCell("Acesso remoto ao servidor")] })
        ]
      }),
      new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Tabela 2: Portas de rede utilizadas pelo sistema", size: 18, italics: true, color: colors.secondary })
      ]}),

      // Seção 3 - Instalação Automática
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Instalação Automática (Recomendado)")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O TecOS dispõe de um instalador automático que configura todo o ambiente de produção em poucos minutos. Este método é altamente recomendado pois elimina erros manuais e garante que todas as dependências sejam instaladas corretamente. O script de instalação foi projetado para ser idempotente, ou seja, pode ser executado múltiplas vezes sem causar problemas no sistema.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Método Rápido (Um Comando)")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Execute o comando abaixo em um servidor Ubuntu/Debian recém provisionado. O script detectará automaticamente a arquitetura do sistema, instalará todas as dependências necessárias, configurará o banco de dados e iniciará o serviço. O processo completo leva aproximadamente 5-10 minutos dependendo da velocidade de conexão do servidor.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: "curl -sL https://seu-dominio.com/install-tecos.sh | bash", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Método com Download do Script")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Se preferir mais controle sobre o processo de instalação, você pode baixar o script primeiro, revisar seu conteúdo e então executá-lo. Este método é recomendado para administradores de sistema que desejam auditar o código antes da execução. O script está completamente comentado para facilitar o entendimento de cada etapa.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "# Download do script", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "wget https://seu-dominio.com/install-tecos.sh", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "# Dar permissão de execução", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "chmod +x install-tecos.sh", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "# Executar instalação", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "sudo ./install-tecos.sh", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("O que o Instalador Faz Automaticamente")] }),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Atualiza o sistema operacional com os pacotes mais recentes de segurança", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Instala Node.js 18+ LTS, npm, Bun runtime, Git, Nginx e PM2", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Configura o repositório do projeto e instala todas as dependências", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Gera o cliente Prisma e executa migrações do banco de dados", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Cria o banco de dados SQLite com estrutura completa", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Executa o seed inicial com usuário SuperAdmin padrão", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Realiza o build de produção do Next.js (standalone)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Configura PM2 para inicialização automática no boot", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Cria configuração do Nginx como proxy reverso", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-main", level: 0 }, children: [
        new TextRun({ text: "Executa verificação final de todos os componentes", size: 22 })
      ]}),

      // Seção 4 - Instalação Manual
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Instalação Manual")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Se preferir realizar a instalação passo a passo, siga as instruções abaixo. Este método oferece maior controle sobre cada etapa do processo e é recomendado para administradores experientes ou para ambientes com requisitos específicos de configuração. Certifique-se de executar cada comando na ordem apresentada.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Passo 1: Atualizar o Sistema")] }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: "sudo apt update && sudo apt upgrade -y", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Passo 2: Instalar Node.js 18 LTS")] }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "sudo apt install -y nodejs", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Passo 3: Instalar Bun (Opcional)")] }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: "curl -fsSL https://bun.sh/install | bash", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Passo 4: Instalar PM2 e Nginx")] }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "sudo npm install -g pm2", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "sudo apt install -y nginx", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Passo 5: Clonar e Configurar o Projeto")] }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "cd /opt", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "sudo git clone https://github.com/seu-repo/tecos.git", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "cd tecos", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "npm install", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "npx prisma generate", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Passo 6: Build e Inicialização")] }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "npm run build", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "pm2 start npm --name tecos -- start", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "pm2 save", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "pm2 startup", size: 20, font: "Consolas" })]
      }),

      // Seção 5 - Nginx
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Configuração do Nginx")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O Nginx atua como proxy reverso, direcionando o tráfego das portas 80 e 443 para a aplicação Node.js que roda na porta 3000. Esta configuração oferece benefícios significativos incluindo melhor performance com cache de arquivos estáticos, suporte a SSL/TLS, compressão gzip e balanceamento de carga se necessário.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Configuração Básica")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Crie o arquivo de configuração do site no Nginx com as diretivas abaixo. Esta configuração é otimizada para aplicações Next.js com suporte a WebSocket para hot reload durante desenvolvimento e proxy correto para API routes.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "server {", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "    listen 80;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "    server_name seu-dominio.com;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "    location / {", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "        proxy_pass http://localhost:3000;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "        proxy_http_version 1.1;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "        proxy_set_header Upgrade $http_upgrade;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "        proxy_set_header Connection 'upgrade';", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "        proxy_set_header Host $host;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "        proxy_cache_bypass $http_upgrade;", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "    }", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "}", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200 }, children: [new TextRun("Ativar a Configuração")] }),
      new Paragraph({ numbering: { reference: "numbered-nginx", level: 0 }, children: [
        new TextRun({ text: "Crie um link simbólico para ativar o site: sudo ln -s /etc/nginx/sites-available/tecos /etc/nginx/sites-enabled/", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-nginx", level: 0 }, children: [
        new TextRun({ text: "Teste a configuração: sudo nginx -t", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-nginx", level: 0 }, children: [
        new TextRun({ text: "Reinicie o Nginx: sudo systemctl restart nginx", size: 22 })
      ]}),

      // Seção 6 - SSL
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Configuração SSL/HTTPS")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "A configuração de SSL é essencial para proteger os dados transmitidos entre o servidor e os clientes, especialmente considerando que o sistema lida com informações de login e dados de clientes. O Certbot é uma ferramenta gratuita e automatizada do Let's Encrypt que simplifica drasticamente o processo de obtenção e renovação de certificados SSL.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Instalação do Certbot")] }),
      new Paragraph({ numbering: { reference: "numbered-ssl", level: 0 }, children: [
        new TextRun({ text: "Instale o Certbot: sudo apt install -y certbot python3-certbot-nginx", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-ssl", level: 0 }, children: [
        new TextRun({ text: "Obtenha o certificado: sudo certbot --nginx -d seu-dominio.com", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-ssl", level: 0 }, children: [
        new TextRun({ text: "Siga as instruções interativas para configurar o certificado", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-ssl", level: 0 }, children: [
        new TextRun({ text: "Configure renovação automática: sudo certbot renew --dry-run", size: 22 })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Renovação Automática")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Os certificados do Let's Encrypt têm validade de 90 dias. O Certbot configura automaticamente um timer do systemd para renovar os certificados antes do vencimento. Você pode verificar se a renovação automática está funcionando corretamente executando o comando de teste. Recomenda-se adicionar um cron job como backup para garantir que os certificados sejam sempre renovados.", size: 22, color: colors.body })
      ]}),

      // Seção 7 - PM2
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Gerenciamento com PM2")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O PM2 é um gerenciador de processos para Node.js que garante que sua aplicação permaneça ativa 24/7. Ele reinicia automaticamente a aplicação em caso de falhas, gerencia logs centralizadamente e fornece métricas de performance em tempo real. Para aplicações de produção, o PM2 é considerado uma ferramenta essencial.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Comandos Essenciais")] }),
      new Table({
        columnWidths: [3500, 5860],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [
            createCell("Comando", { header: true, align: AlignmentType.CENTER }),
            createCell("Descrição", { header: true, align: AlignmentType.CENTER })
          ]}),
          new TableRow({ children: [createCell("pm2 start npm --name tecos -- start"), createCell("Inicia a aplicação")] }),
          new TableRow({ children: [createCell("pm2 stop tecos"), createCell("Para a aplicação")] }),
          new TableRow({ children: [createCell("pm2 restart tecos"), createCell("Reinicia a aplicação")] }),
          new TableRow({ children: [createCell("pm2 logs tecos"), createCell("Visualiza logs em tempo real")] }),
          new TableRow({ children: [createCell("pm2 monit"), createCell("Monitor de recursos")] }),
          new TableRow({ children: [createCell("pm2 list"), createCell("Lista todos os processos")] }),
          new TableRow({ children: [createCell("pm2 save"), createCell("Salva configuração atual")] }),
          new TableRow({ children: [createCell("pm2 startup"), createCell("Configura inicialização no boot")] })
        ]
      }),
      new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Tabela 3: Comandos PM2 para gerenciamento do TecOS", size: 18, italics: true, color: colors.secondary })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Configuração de Startup")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Para garantir que o TecOS inicie automaticamente após uma reinicialização do servidor, execute os comandos abaixo. O PM2 gerará um script de inicialização específico para seu sistema operacional e exibirá o comando exato que deve ser executado.", size: 22, color: colors.body })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-pm2", level: 0 }, children: [
        new TextRun({ text: "Execute: pm2 startup", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-pm2", level: 0 }, children: [
        new TextRun({ text: "Copie e execute o comando exibido (requer sudo)", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-pm2", level: 0 }, children: [
        new TextRun({ text: "Salve a configuração: pm2 save", size: 22 })
      ]}),

      // Seção 8 - Tipos de Hospedagem
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Tipos de Hospedagem Recomendados")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O TecOS pode ser hospedado em diversos tipos de infraestrutura. A escolha ideal depende do volume de uso esperado, orçamento disponível e nível de controle desejado. Abaixo apresentamos as opções mais adequadas para cada cenário de uso.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("VPS (Virtual Private Server) - Recomendado")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "O VPS oferece o melhor equilíbrio entre custo, performance e controle para o TecOS. Você tem acesso root ao servidor, pode instalar qualquer dependência necessária e tem recursos garantidos. Esta opção é ideal para produção com múltiplas lojas ativas, pois oferece total controle sobre o ambiente de execução e permite otimizações específicas para sua carga de trabalho.", size: 22, color: colors.body })
      ]}),

      new Table({
        columnWidths: [2800, 3280, 3280],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [
            createCell("Provedor", { header: true, align: AlignmentType.CENTER }),
            createCell("Plano Inicial", { header: true, align: AlignmentType.CENTER }),
            createCell("Preço Aproximado", { header: true, align: AlignmentType.CENTER })
          ]}),
          new TableRow({ children: [createCell("DigitalOcean"), createCell("Droplet 2GB"), createCell("$12-24/mês")] }),
          new TableRow({ children: [createCell("Vultr"), createCell("Cloud Compute 2GB"), createCell("$12-24/mês")] }),
          new TableRow({ children: [createCell("Linode/Akamai"), createCell("Shared CPU 2GB"), createCell("$12-24/mês")] }),
          new TableRow({ children: [createCell("Hetzner"), createCell("CX22 (2 vCPU, 4GB)"), createCell("€5-8/mês")] }),
          new TableRow({ children: [createCell("Contabo"), createCell("VPS S (4 vCPU, 8GB)"), createCell("€5-8/mês")] })
        ]
      }),
      new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Tabela 4: Provedores VPS recomendados para TecOS", size: 18, italics: true, color: colors.secondary })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Cloud Providers (AWS/GCP/Azure)")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Para escalabilidade enterprise e integração com outros serviços cloud, as grandes plataformas oferecem opções robustas. O AWS EC2 t3.small ou t3.medium é suficiente para a maioria dos casos. Para ambientes de desenvolvimento, o AWS Free Tier oferece 12 meses gratuitos com uma instância t2.micro ou t3.micro, ideal para testes e validação do sistema.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Servidor Dedicado")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Para alto volume de dados e múltiplas lojas com grande movimento, um servidor dedicado oferece recursos exclusivos e máximo desempenho. Esta opção é recomendada apenas quando o número de lojas ativas exceder 50+ ou quando houver requisitos específicos de compliance que exijam isolamento total de recursos.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PaaS (Platform as a Service)")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Plataformas como Vercel, Railway e Render oferecem deploy simplificado, mas podem ter limitações com o banco SQLite em ambientes efêmeros. Para usar o TecOS em PaaS, considere migrar para PostgreSQL ou MySQL e configure volumes persistentes. O Vercel em particular é otimizado para Next.js e oferece excelente performance para o frontend, mas requer configuração adicional para o banco de dados.", size: 22, color: colors.body })
      ]}),

      // Seção 9 - Solução de Problemas
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Solução de Problemas")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Esta seção aborda os problemas mais comuns encontrados durante a instalação e operação do TecOS, junto com suas respectivas soluções. A maioria dos problemas está relacionada a permissões de arquivos, configuração de rede ou dependências do sistema.", size: 22, color: colors.body })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Erro: Cannot find module")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Este erro indica que as dependências não foram instaladas corretamente. A solução envolve reinstalar todas as dependências do projeto e regenerar o cliente Prisma. Execute os comandos na pasta do projeto para resolver o problema.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: "rm -rf node_modules && npm install && npx prisma generate", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Erro: Database connection failed")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "O TecOS utiliza SQLite com caminho relativo. Verifique se o arquivo do banco de dados existe no caminho correto e se as permissões de escrita estão configuradas. O banco deve estar em /opt/tecos/db/custom.db ou no caminho configurado em DATABASE_URL.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "mkdir -p db && touch db/custom.db", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "npx prisma db push", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Erro: Port 3000 already in use")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Outro processo está utilizando a porta 3000. Você pode identificar e encerrar o processo conflitante ou configurar o TecOS para usar uma porta diferente através da variável de ambiente PORT.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: "sudo lsof -i :3000 && kill -9 <PID>", size: 20, font: "Consolas" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Erro: 502 Bad Gateway")] }),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "O Nginx não está conseguindo se comunicar com a aplicação Node.js. Verifique se o PM2 está executando corretamente e se a aplicação está respondendo na porta 3000. Este erro também pode ocorrer durante o build inicial antes da aplicação estar completamente pronta.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "pm2 list            # Verificar se tecos está online", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "pm2 logs tecos      # Verificar logs de erro", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "pm2 restart tecos   # Reiniciar aplicação", size: 20, font: "Consolas" })]
      }),

      // Seção 10 - Credenciais Padrão
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Credenciais Padrão")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Após a instalação, o sistema cria automaticamente usuários padrão para acesso imediato. É altamente recomendado alterar estas senhas imediatamente após o primeiro acesso para garantir a segurança do sistema. O SuperAdmin tem acesso total ao sistema e pode gerenciar todas as lojas.", size: 22, color: colors.body })
      ]}),

      new Table({
        columnWidths: [3000, 3180, 3180],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [
            createCell("Tipo de Usuário", { header: true, align: AlignmentType.CENTER }),
            createCell("Email", { header: true, align: AlignmentType.CENTER }),
            createCell("Senha", { header: true, align: AlignmentType.CENTER })
          ]}),
          new TableRow({ children: [createCell("SuperAdmin"), createCell("admin@tecos.com"), createCell("admin123")] }),
          new TableRow({ children: [createCell("Loja Teste"), createCell("teste@techcell.com"), createCell("teste123")] })
        ]
      }),
      new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Tabela 5: Credenciais de acesso padrão", size: 18, italics: true, color: colors.secondary })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Acesso ao Sistema")] }),
      new Paragraph({ numbering: { reference: "numbered-manual", level: 0 }, children: [
        new TextRun({ text: "Abra o navegador e acesse: http://seu-dominio.com ou http://IP-DO-SERVIDOR", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-manual", level: 0 }, children: [
        new TextRun({ text: "Na página de login, use as credenciais do SuperAdmin para acesso administrativo total", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-manual", level: 0 }, children: [
        new TextRun({ text: "Use as credenciais da Loja Teste para testar o painel de uma loja específica", size: 22 })
      ]}),
      new Paragraph({ numbering: { reference: "numbered-manual", level: 0 }, children: [
        new TextRun({ text: "Altere as senhas imediatamente acessando o menu Perfil em cada painel", size: 22 })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("Suporte e Atualizações")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Para atualizar o sistema, acesse a pasta do projeto e execute os comandos de pull e rebuild. O processo de atualização preserva todos os dados do banco de dados e configurações personalizadas. Recomenda-se sempre fazer um backup do banco de dados antes de atualizações maiores.", size: 22, color: colors.body })
      ]}),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "cd /opt/tecos", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "git pull origin main", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "npm install", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "npx prisma generate", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 60 },
        children: [new TextRun({ text: "npm run build", size: 20, font: "Consolas" })]
      }),
      new Paragraph({
        shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
        spacing: { after: 100 },
        children: [new TextRun({ text: "pm2 restart tecos", size: 20, font: "Consolas" })]
      }),
    ]
  }]
});

// Salvar documento
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/download/Manual-Instalacao-TecOS.docx', buffer);
  console.log('✅ Manual criado com sucesso em: /home/z/my-project/download/Manual-Instalacao-TecOS.docx');
});
