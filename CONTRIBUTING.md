# Contribuição

Leia [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md) e [AGENTS.md](AGENTS.md). Proponha mudanças pequenas, com um problema concreto e comportamento verificável.

## Ambiente

Use Node.js 24 e `npm ci`. Rode `npm run dev` para desenvolver e `npm run build` seguido de `npm run preview` para conferir o resultado de produção.

Antes de abrir uma alteração:

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Critérios de revisão

- Regras ficam no domínio; APIs do navegador ficam na plataforma; componentes coordenam a experiência.
- Estado derivável não precisa de outra cópia sincronizada por efeito.
- Sorteios ocorrem em eventos explícitos. Apresentação nunca altera resultado ou consome aleatoriedade.
- Valide dados externos em tempo de execução. Teste comportamento observável, limites e falhas reais.
- Mudanças de algoritmo ou formato precisam preservar ou rejeitar explicitamente registros anteriores.
- Mudanças visuais precisam de inspeção em desktop/celular, teclado, zoom, nomes longos e estados de erro. Mantenha o logo proporcional e as cores/tipografia acordadas.
- Não adicione telemetria, fontes remotas ou envio de listas sem uma decisão explícita de produto.

Descreva o problema, o comportamento final, a validação executada e limitações conhecidas. Use dados fictícios em exemplos, screenshots, fixtures e registros anexados. Não inclua informações reais de participantes ou credenciais.

Os avisos e licenças dos componentes de terceiros devem ser preservados. A disponibilidade pública da marca não autoriza seu uso em outros produtos.
