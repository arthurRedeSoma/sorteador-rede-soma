# Arquitetura

Aplicação estática em React e TypeScript estrito. Vite produz `dist/`, servido pelo GitHub Pages. Navegação por hash evita depender de reescrita de URLs no servidor. Não existe API de sorteio ou persistência remota.

## Responsabilidades

| Camada         | Responsabilidade                                                             | Limite                                            |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/domain`   | Tipos, validação, participantes, sorteio, serialização canônica e reprodução | Sem React, DOM, armazenamento ou chamadas de rede |
| `src/platform` | Web Crypto, registros com digest, arquivos e sessão                          | Adapta APIs do navegador às regras do domínio     |
| `src/features` | Preparação, importação, resultados, apresentação e verificação               | Orquestra cada fluxo sem reimplementar algoritmos |
| `src/app`      | Navegação, histórico e composição da aplicação                               | Preserva a preparação durante a navegação         |
| `src/styles`   | Tokens, estilos globais e impressão                                          | CSS Modules mantém estilos de componentes locais  |

Componentes compartilhados surgem quando há comportamento repetido de fato; uma pasta vazia ou abstração genérica não é requisito de arquitetura.

Em `features/draw`, o `DrawWorkbench` coordena a confirmação. Entradas e configurações ficam em componentes próprios; `prepareDraw` converte o rascunho em um pedido validado; `useDrawDraft` cuida da preparação e de sua persistência. Nenhum desses módulos calcula resultados aleatórios.

## Contratos

- `Participant`: identificação da inscrição e nome. Duas inscrições podem ter o mesmo nome após escolha explícita do usuário.
- `DrawRequest`: união discriminada de `teams`, `names` e `numbers`. Equipes recebem a quantidade final de equipes; a interface converte o máximo de pessoas por equipe em `ceil(participantes / máximo)`.
- `RandomSource.nextInt(maxExclusive)`: retorna um inteiro uniforme entre zero e o limite exclusivo. A injeção permite testar o domínio com escolhas conhecidas.
- `DrawRecordV1`: pedido, resultado, escolhas consumidas, versão do schema/algoritmo, ID, data, build e digest.
- `verifyRecord(input: unknown)`: valida conteúdo externo, reexecuta o domínio e verifica o digest. Retorna sucesso com registro ou erro descritivo; não confia em um cast TypeScript.

## Fluxo

1. A preparação limpa linhas vazias e espaços nas extremidades, identifica duplicatas e valida os limites.
2. O evento de sorteio captura uma cópia validada do pedido. Um bloqueio de execução evita disparos concorrentes por clique duplo.
3. A plataforma fornece inteiros do Web Crypto e grava cada escolha consumida pelo domínio.
4. O resultado entra em um registro congelado, com SHA-256 e metadados do build.
5. A aplicação acrescenta esse registro ao histórico. Alterar a preparação não altera o registro anterior.
6. Apresentação e exportações recebem o mesmo registro. Não consomem aleatoriedade.

A lista de participantes continua sendo dado, inclusive quando contém texto parecido com HTML. React faz a renderização textual; exportações CSV neutralizam prefixos interpretáveis como fórmulas por planilhas.

## Sessão e falhas

O armazenamento usa chave e envelope versionados. Ao recuperar uma sessão, os registros são validados e reproduzidos; itens inválidos não são apresentados como resultados válidos. A importação explícita do JSON também verifica o SHA-256. O histórico local não é um registro autenticado.

Bloqueio do armazenamento ou falta de quota não impede o sorteio em memória. Um aviso orienta a baixar os registros antes de recarregar. Sem Web Crypto, a execução falha com uma mensagem; não há fallback para `Math.random`.

Limites protegem entrada, leitura de arquivos, quantidade de resultados e tamanho do registro. Cálculos numéricos sem repetição usam espaço proporcional à quantidade sorteada, não ao tamanho do intervalo.

## Dependências e evolução

React cuida da interface; Lucide fornece ícones; Papa Parse trata CSV; Fontsource fornece arquivos locais das fontes abertas. Não há biblioteca de estado global nem framework de servidor. Versões exatas e lockfile permitem repetir a instalação.

Uma mudança que altere escolhas consumidas, ordem dos resultados ou significado de campos deve criar nova versão do algoritmo/schema, preservando a reprodução dos registros antigos ou rejeitando versões não suportadas com clareza. Não migrar silenciosamente a história de um sorteio.
