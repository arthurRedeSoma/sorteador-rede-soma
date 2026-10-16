# Publicação e rastreabilidade

Repositório previsto: `arthurRedeSoma/sorteador-rede-soma`. Base do Vite: `/sorteador-rede-soma/`. Destino: [GitHub Pages](https://arthurRedeSoma.github.io/sorteador-rede-soma/).

## Pipeline

O workflow `.github/workflows/pages.yml` roda em pull requests, push em `main` e disparo manual. Instala dependências com `npm ci`, verifica tipos/lint, roda testes, gera o build e executa os cenários de navegador em Chromium. Somente a branch `main`, após sucesso de todas as etapas, pode publicar `dist`.

As actions são fixadas em SHA completo, resolvido nos repositórios oficiais. Atualizações exigem conferir a nova revisão e executar novamente o pipeline. A versão de Node é 24. Permissões de escrita em Pages e emissão de OIDC ficam restritas ao job de deploy; o checkout não persiste credenciais.

O build incorpora a versão do `package.json` e `GITHUB_SHA`, ou o HEAD local quando fora da CI. Sem commit disponível, identifica-se como build local. O rodapé liga o build publicado ao commit correspondente. Não incorporar informações de participantes em variáveis de build.

## Configuração do repositório

Em Settings → Pages, escolher **GitHub Actions** como origem. O ambiente `github-pages` deve permitir publicação da branch `main`. Se políticas da organização impuserem aprovação, o deploy aguardará essa política; o workflow não a contorna.

O Git deste projeto deve ter sua própria raiz. Antes de adicionar arquivos, conferir `git rev-parse --show-toplevel` para não publicar o repositório da pasta mãe ou projetos vizinhos. `node_modules`, `dist`, relatórios, sessões e registros de usuários não pertencem ao código publicado.

## Conferência após publicar

- A URL responde, carrega assets no caminho correto e abre cada modalidade por hash.
- Executar equipes, nomes e números com dados fictícios.
- Conferir duplicatas, exportação, histórico após recarregar e verificação do JSON.
- Conferir versão/commit do rodapé e sucesso do workflow do mesmo commit.
- Inspecionar a rede: a aplicação carrega seus assets, mas não transmite entradas ou resultados. Links externos e ações do próprio usuário continuam sujeitos ao comportamento do navegador.

Essa conferência precisa ocorrer na URL publicada; um build local válido não demonstra por si só que o Pages foi habilitado ou que o deploy concluiu.

Referências: [Vite — deploy estático](https://vite.dev/guide/static-deploy.html) e [GitHub — workflows para Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
