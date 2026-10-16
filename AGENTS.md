# Orientações do projeto

Seja objetivo e claro. Evite palavras desnecessárias.

- Leia `PRODUCT.md` e `DESIGN.md` antes de alterar experiência ou identidade.
- Preserve o domínio puro em `src/domain`; componentes não sorteiam diretamente nem acessam a fonte aleatória.
- Alterações no algoritmo ou no formato de registro exigem versão explícita e testes de reprodução/compatibilidade.
- Nunca use `Math.random` para sorteios. Não execute sorteios em renderização ou efeitos React.
- Não adicione chamadas de rede, telemetria ou fontes remotas sem uma mudança explícita no requisito de privacidade.
- Para interface, consulte `.agents/skills/impeccable/SKILL.md` e as referências aplicáveis. Antes de editar UI, leia `reference/craft-floor.md`; confira o resultado renderizado. O plano já aprovado fixa público, marca, composição, stack e hospedagem: não reabra essas decisões sem necessidade.
- Para React, consulte `.agents/skills/react-best-practices/SKILL.md`; use apenas orientações aplicáveis à aplicação no navegador.
- Mantenha funções coesas, nomes do domínio e estado mínimo. Comente decisões e limites, não traduza o código em prosa.
- Antes de entregar, execute `npm run check`, `npm test`, `npm run build` e `npm run test:e2e`.
- Não inclua listas reais, registros de usuários, credenciais, binários de skills ou artefatos de teste no repositório.
