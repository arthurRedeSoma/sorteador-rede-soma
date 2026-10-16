# Aleatoriedade e registros

## Inteiros uniformes

O navegador fornece palavras de 32 bits por [`crypto.getRandomValues`](https://www.w3.org/TR/webcrypto/#Crypto-method-getRandomValues). Para um limite exclusivo `n`, calcula-se `L = floor(2^32 / n) × n`. Valores maiores ou iguais a `L` são descartados; os demais viram `valor % n`.

Esse descarte evita o viés que ocorreria ao aplicar módulo diretamente quando `n` não divide `2^32`. A fonte não depende de nomes, hora, posição do cursor, animação ou clique. A disponibilidade e a qualidade da implementação criptográfica dependem do navegador e do sistema.

## Modalidades

**Equipes e nomes.** Fisher–Yates embaralha uma cópia da lista: da última posição à segunda, escolhe uniformemente uma posição entre zero e a atual e troca os elementos. Para nomes, toma-se o prefixo solicitado. Para equipes, distribuem-se as inscrições embaralhadas em rodízio; os tamanhos diferem no máximo em um.

**Números com repetição.** Cada posição sorteada é uma escolha independente dentro do intervalo inclusivo.

**Números sem repetição.** Uma variante esparsa do embaralhamento guarda em um `Map` somente as posições deslocadas. A cada seleção, remove logicamente um elemento do conjunto disponível. Assim, o custo é proporcional aos resultados pedidos, mesmo em um intervalo com um bilhão de valores.

Homônimos mantidos são inscrições distintas. A ausência de repetição se aplica à inscrição, não ao texto do nome.

## Formato versão 1

| Campo              | Significado                                       |
| ------------------ | ------------------------------------------------- |
| `schemaVersion`    | `1`, versão da estrutura                          |
| `algorithmVersion` | `"1"`, interpretação das escolhas e regras        |
| `id`               | UUID criado pelo navegador                        |
| `createdAt`        | Data ISO informada pelo relógio local             |
| `build`            | Versão da aplicação e commit declarado pelo build |
| `request`          | Modalidade, entradas e configurações efetivas     |
| `result`           | Equipes, ganhadores ou números na ordem calculada |
| `choices`          | Inteiros consumidos por `nextInt`, na mesma ordem |
| `digest`           | SHA-256 hexadecimal de todos os demais campos     |

A serialização canônica ordena lexicograficamente as chaves dos objetos, conserva a ordem dos arrays e usa a codificação JSON de valores primitivos. O digest é calculado sobre bytes UTF-8. Essa convenção é própria da versão 1; não é apresentada como implementação completa de um padrão externo de canonicalização.

Na verificação, uma fonte de repetição consome `choices`. Cada inteiro precisa estar dentro do limite exigido naquele passo. Escolhas ausentes ou excedentes invalidam o registro. O resultado reproduzido precisa coincidir com o salvo. Também se conferem estrutura, versão, limites, identidades das inscrições e SHA-256.

## O que a verificação não prova

A mensagem correta é **“Resultado consistente com o registro”**.

O hash não é assinatura: qualquer pessoa pode editar o conteúdo e calcular outro SHA-256. Quem controla o navegador pode fabricar um registro internamente consistente, alterar a execução, repetir sorteios ou esconder tentativas. UUID, data e commit dentro do arquivo são declarações, não provas independentes. O registro não contém uma fonte pública de aleatoriedade, um carimbo de tempo externo ou testemunho de terceiros.

O repositório público e o commit visível ajudam a examinar o algoritmo e a versão distribuída. Eles não garantem que um arquivo recebido veio daquela execução ou que o dispositivo do organizador estava íntegro. A aplicação não promete impedir sabotagem por quem controla o ambiente.

## Testes relevantes

Os testes usam fontes determinísticas para conferir resultados conhecidos, limites de cada escolha, preservação de inscrições, equilíbrio e ausência de repetição. Há cenários de rejeição da cauda dos 32 bits, intervalos grandes, dados adulterados e versões desconhecidas. Testes estatísticos isolados não substituem a inspeção do algoritmo nem comprovam imprevisibilidade criptográfica.
