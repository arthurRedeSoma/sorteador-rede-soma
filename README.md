# Sorteador Rede Soma

Sorteio de equipes, nomes e números, com a identidade da Rede Soma. As regras, a aleatoriedade e o resultado são processados no navegador. Não há cadastro, servidor de sorteios ou envio das listas pela aplicação.

Destino de publicação: [arthurRedeSoma.github.io/sorteador-rede-soma](https://arthurRedeSoma.github.io/sorteador-rede-soma/).

## O que faz

- Distribui participantes em equipes com diferença máxima de uma pessoa.
- Sorteia nomes sem repetir a inscrição e números com repetição opcional.
- Recebe texto, TXT e CSV; permite revisar a coluna e decidir como tratar nomes iguais.
- Mantém o histórico da aba e oferece apresentação, cópia, CSV, JSON e impressão.
- Reexecuta um registro JSON para conferir sua consistência.

Até 10.000 participantes ou resultados por execução. Intervalos numéricos inclusivos entre zero e um bilhão. TXT/CSV devem estar em UTF-8 e ter até 5 MiB; cada nome pode ter até 2.000 caracteres. Registros JSON têm limite de 10 MiB.

## Executar localmente

Requisitos: Node.js 24 ou superior e npm.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, no caminho `/sorteador-rede-soma/`. Para conferir a versão de produção:

```sh
npm run build
npm run preview
```

## Verificar o projeto

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

No Linux, use `npx playwright install --with-deps chromium` para instalar também as bibliotecas necessárias. A CI executa essas verificações antes da publicação; um workflow configurado não significa que uma execução passou.

## O que a transparência demonstra

O sorteio usa Web Crypto e evita viés ao converter valores aleatórios em índices. O arquivo JSON registra entradas, configurações, escolhas inteiras, resultado, versão do algoritmo e identificação do build. A verificação recalcula o resultado e o SHA-256 do conteúdo.

**Um registro consistente não prova que houve apenas uma tentativa.** O organizador pode descartar resultados, alterar um arquivo e recalcular seu hash ou executar uma cópia modificada. Data, ID e commit declarados no registro também não são uma assinatura independente. O código publicado permite inspeção; ele não certifica o ambiente de quem realizou o sorteio. Leia [algoritmo e limites](docs/aleatoriedade.md).

Participantes e resultados ficam em memória e, quando disponível, no `sessionStorage` da aba. Fechar a aba normalmente encerra a sessão; restaurações dependem do navegador. Para guardar um resultado, baixe o registro. Arquivos exportados contêm os nomes informados; compartilhe-os apenas quando apropriado.

## Estrutura e manutenção

| Documento                                   | Conteúdo                                                 |
| ------------------------------------------- | -------------------------------------------------------- |
| [Arquitetura](docs/arquitetura.md)          | Camadas, contratos e fluxo de dados                      |
| [Aleatoriedade](docs/aleatoriedade.md)      | Algoritmos, formato do registro e limites da verificação |
| [Publicação](docs/publicacao.md)            | CI, Pages e rastreabilidade do build                     |
| [Validação](docs/validacao.md)              | Testes realizados, revisão visual e alcance              |
| [Produto](PRODUCT.md) e [design](DESIGN.md) | Decisões de experiência e identidade                     |
| [Skills](docs/skills.md)                    | Origens, revisões fixas e aplicação                      |
| [Contribuição](CONTRIBUTING.md)             | Como propor e verificar mudanças                         |
| [Avisos de terceiros](docs/terceiros.md)    | Fontes, ícones, skills e marca                           |

O código está disponível para inspeção. A publicação deste repositório não concede direitos sobre o nome, logo ou manual da Rede Soma. Nenhuma licença geral do código autoral foi definida pelo titular nesta entrega; componentes de terceiros mantêm suas próprias licenças.
