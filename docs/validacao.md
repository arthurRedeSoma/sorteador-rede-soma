# Validação da versão 1.0.0

Verificações locais realizadas em 16/10/2026, com Node.js 24 e Chromium do Playwright. A CI repete os checks sobre o commit publicado; os resultados ficam em [GitHub Actions](https://github.com/arthurRedeSoma/sorteador-rede-soma/actions).

## Evidência automatizada

- TypeScript estrito, ESLint e build de produção aprovados.
- 98 testes unitários: distribuição, limites, homônimos, amostragem por rejeição, reprodução, adulterações, arquivos e armazenamento.
- 26 cenários de navegador aprovados sobre o build de produção: três modalidades, importação, exportação/verificação, histórico, recuperação de rascunho, clique duplo, navegação durante execução, apresentação adiada durante a ajuda, falhas de armazenamento e de Web Crypto.
- Capturas e axe WCAG A/AA em 360, 768 e 1.440 px, na preparação e no resultado: nenhuma violação automática encontrada nem rolagem horizontal.
- Teclado, foco após ações, movimento reduzido, nomes longos e estilos de impressão exercitados. Escala de página de 200% simulada com CSS `zoom`; não equivale a todos os comportamentos de ampliação de navegadores.
- Interceptação de requisições durante o sorteio: somente GETs de recursos da mesma origem; nenhum participante transmitido.

Os testes usam dados fictícios e contextos de navegador isolados. Relatórios, downloads e capturas temporárias não são versionados. A suíte pode ser executada contra a publicação definindo `SITE_URL` como a URL completa do site antes de `npm run test:e2e`.

## Revisão de design

A avaliação visual foi realizada antes da leitura do detector, usando as referências de crítica, auditoria e acabamento do Impeccable. Foram revistas hierarquia, alinhamento, legibilidade, estados vazios e fluxo de retorno à preparação.

Uma segunda revisão combinou detector, código e navegador. Os três avisos de fonte recorrente apontaram Montserrat, mantida por ser parte da identidade aprovada. Os problemas confirmados foram corrigidos: nome acessível da ajuda no celular e atalho de teclado que interferia na modalidade. Os controles segmentados e o resumo de apresentação receberam alvos de pelo menos 44 px.

## Alcance

Na revisão visual da versão 1.1.0, foram repetidos os cenários sobre o novo painel e os resultados. A revisão independente pediu pontos maiores e alinhados na prévia; o ajuste foi aplicado. O detector apontou apenas usos de Montserrat, mantida pela marca. Capturas finalizam a revelação de 300 ms antes de registrar a tela.

Esses resultados não constituem certificação integral de acessibilidade. Não houve auditoria manual com leitor de tela nem testes em aparelhos físicos, Safari ou Firefox nesta entrega. A revisão da transparência valida regras e consistência; não certifica tentativa única, ambiente do organizador ou origem independente da aleatoriedade.
