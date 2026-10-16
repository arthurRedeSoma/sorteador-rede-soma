# Design do Sorteador Rede Soma

Autoridade visual: manual fornecido pelo usuário e composição aprovada. As regras abaixo orientam manutenção; não autorizam rebranding.

## Identidade e tokens

| Papel               | Valor                        | Uso                                                 |
| ------------------- | ---------------------------- | --------------------------------------------------- |
| Azul principal      | `#0F62AC`                    | Ação principal, navegação, foco                     |
| Verde principal     | `#00AD57`                    | Acentos e detalhes do resultado                     |
| Verde de contraste  | `#16861B`                    | Texto e controles, após conferir contraste          |
| Superfície          | `#FFFFFF`                    | Fundo predominante                                  |
| Superfície auxiliar | Cinza azulado muito claro    | Separação funcional de regiões                      |
| Títulos             | Montserrat 700/800           | Hierarquia curta, sem títulos promocionais gigantes |
| Corpo               | Calibri, Carlito, sans-serif | Instruções, campos, listas e resultados             |
| Ícones              | Lucide, 20–24 px             | Traço consistente; ações importantes com texto      |

Fontes abertas são servidas pelo próprio site. Calibri só é usada se já estiver instalada. A paleta primária aparece na página 3 do manual; tipografia, na página 5; verde de contraste, na página 6. Acessibilidade prevalece na combinação de primeiro plano e fundo: o verde vivo não serve como texto pequeno sobre branco.

O logo colorido é aplicado sobre branco, com dimensões proporcionais. Não inclinar, rotacionar, recolorir, desfocar, esticar ou reduzir a opacidade (manual, página 7).

## Composição

- Cabeçalho compacto com marca, nome da ferramenta e acesso a instruções.
- Conteúdo até 1.200 px; título curto, navegação entre modalidades e ferramenta imediatamente disponível.
- Participantes à esquerda e configurações à direita. Resultado abaixo, em largura completa.
- No celular: participantes, regras, ação e resultado, mantendo a ordem do DOM e do foco.
- Escala de espaçamento baseada em 4/8 px; proximidade agrupa campos relacionados. Cantos moderados e bordas apenas quando ajudam a distinguir interação ou região.
- Uma ação principal por etapa. Importação, exemplo, verificação e histórico têm prioridade secundária.

## Estados e interação

Lista inicialmente vazia, com orientação curta. Exemplo só entra por ação explícita. Duplicatas, importação e erros aparecem perto da decisão correspondente. Configurações antecipam a distribuição antes do sorteio.

Resultado é um registro estável. Apresentação, contagem e revelação apenas mostram os mesmos dados; nunca sorteiam novamente. A impressão remove controles e preserva a identificação do registro.

## Critério visual

Cada elemento deve ajudar a preparar, executar ou compreender o sorteio. Não adicionar gradientes ornamentais, sombras pesadas, cartões dentro de cartões, emojis como ícones, métricas fictícias, selos de confiança ou textos genéricos de marketing. Minimalismo significa reduzir obstáculos, preservando funções e legibilidade.

Verificar telas renderizadas em 360, 768 e 1.440 px, além de zoom de 200%, nomes longos, erro, resultado e impressão. Revisar alinhamento óptico, largura de linha, contraste, foco e ordem da navegação. Referências: Impeccable `shape`, `layout`, `distill`, `critique`, `audit` e `polish`; a origem e a revisão das skills estão em [docs/skills.md](docs/skills.md).
