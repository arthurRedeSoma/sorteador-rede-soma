# Skills e referências de implementação

As duas skills externas estão incorporadas em `.agents/skills/`, em revisões fixas. Foram instaladas pelo helper oficial `skill-installer`, com `--ref` e `--dest .agents/skills`; não dependem do conteúdo mutável de `main`.

| Skill                       | Origem e revisão                                                                                                                                             | Pasta                                 | Licença declarada                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------- |
| Impeccable 4.6.0            | [pbakaus/impeccable @ 6af45ac9](https://github.com/pbakaus/impeccable/tree/6af45ac9a5eb8792f033d3242f52e99812fd91fa/.agents/skills/impeccable)               | `.agents/skills/impeccable`           | Apache-2.0; LICENSE e NOTICE.md preservados |
| Vercel React Best Practices | [vercel-labs/agent-skills @ 063bee94](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) | `.agents/skills/react-best-practices` | MIT, declarada no frontmatter de SKILL.md   |

O snapshot da Vercel não contém um arquivo LICENSE separado; a declaração original foi preservada, sem inventar atribuição ou termos adicionais. Os arquivos de referência das skills não foram reescritos.

## Aplicação ao projeto

Impeccable orienta hierarquia, layout, simplificação, qualidade visual, acessibilidade e revisão. `impeccable.cmd context` foi executado no projeto; o produto e a composição foram registrados a partir do plano explicitamente aprovado. A implementação segue diretamente o brief fixado, sem reiniciar entrevistas de decisões já tomadas.

As referências `shape`, `layout` e `distill` orientam a estrutura; `critique`, `audit` e `polish` orientam a revisão final. O detector mecânico é uma ferramenta auxiliar; não substitui inspeção do resultado no navegador. Não afirmar que uma revisão passou sem executá-la e registrar a evidência.

Da Vercel, aplicam-se principalmente estado derivado sem efeitos, eventos para ações de usuário, inicialização preguiçosa de estado, schema de armazenamento versionado e dependências pequenas. Regras específicas de Next.js, servidor e React Server Components não se aplicam.

A skill Sites instalada no ambiente é referência de experiência e validação; a hospedagem escolhida é GitHub Pages. Ela não foi copiada para este repositório.

## Atualização

Escolher uma revisão explícita, ler as mudanças, reinstalar em uma pasta temporária, revisar o diff e atualizar esta tabela. Preservar avisos legais. Launchers e referências textuais podem ser versionados; engines, binários, caches e runtimes baixados ficam fora do Git. O launcher do Impeccable pode baixar seu engine no cache do usuário após verificar o checksum.
