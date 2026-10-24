# Recuperação antes da implementação UI/UX

- Estado original: `development` em `182508d72d17fc3702e369480b15eeb3162c04a9`.
- Branch local: `backup/v012-pre-uiux-20261024-182508d`.
- Tag local: `v012-pre-uiux-20261024-182508d`.
- Antes do trabalho havia 112 ficheiros tracked modificados e dois grupos untracked (`docs/ui-audit/` e o ZIP de screenshots). Nenhum foi descartado.
- Snapshot completo da árvore de trabalho permitida: `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-working-tree.zip` (1 524 ficheiros; SHA-256 `d4eae8005eb3e825664eba4fb1af3b7c60c11de383991ea42eaee5787c85cce6`). `ZipFile.testzip()` confirmou integridade.
- Patches: `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-tracked.patch` e `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-staged.patch` (staged vazio).
- O ZIP exclui `.git`, dependências, `.env`, credenciais e dados reais identificáveis por nome. Preserva código, assets, documentação e alterações locais permitidas.

## Recuperação

Numa cópia isolada do repositório, fazer checkout da tag acima e extrair o ZIP sobre essa cópia. Conferir o SHA-256 antes de extrair. O ZIP já contém as versões locais modificadas; o patch tracked serve como registo adicional. Não aplicar o patch por cima do ZIP, pois duplicaria as alterações.

## Limite de persistência

A branch, tag e arquivo são locais. O workflow Firebase só publica a partir de `development` com marcador explícito, mas não foi possível comprovar todos os gatilhos de CI/serviços externos para a branch de backup. Por isso, o push remoto do backup está pendente. A pasta `/workspace/wanderer-backups` está fora do repositório, mas um backup apenas local não garante recuperação entre ambientes.
