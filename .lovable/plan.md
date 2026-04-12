

# Implementar página de Templates funcional

## Problema
A página `/company/templates` é apenas um placeholder estático. Não lista, cria, edita nem exclui templates. A tabela `presentation_templates` já existe no banco com RLS configurada.

## Solução
Substituir o placeholder por uma página funcional com:
1. **Listagem** de templates do tenant com nome, layout e data
2. **Criar** novo template (modal com nome e layout)
3. **Excluir** template com confirmação
4. **Renomear** template inline ou via modal
5. **Visualizar** a estrutura (quantidade de seções)

## Arquivo a alterar

| Arquivo | Mudança |
|---|---|
| `src/pages/company/CompanyTemplates.tsx` | Reescrever completamente: query templates por tenant, CRUD com mutations, cards com ações |

## Funcionalidades

- `useQuery` para listar `presentation_templates` filtrado por `tenant_id` do perfil
- `useMutation` para insert (criar template vazio), delete, update (renomear)
- Cards com nome, layout badge, data de criação, contagem de seções na structure
- Botao "Novo Template" abre FormModal com campos nome e layout (executivo/premium/impacto)
- Botao excluir com ConfirmDialog
- Botao renomear inline
- Empty state quando não há templates
- Reutiliza componentes existentes: `Card`, `Button`, `ConfirmDialog`, `FormModal`, `StatusBadge`

## Dados
- Tabela `presentation_templates` já existe com colunas: id, tenant_id, broker_id, name, layout, structure (jsonb), is_default, created_at
- RLS já configurada: `agency_admin_tenant_templates` (ALL), `broker_read_tenant_templates` (SELECT), `super_admin_all_templates` (ALL)
- Templates são criados pelo corretor no editor (`handleSaveAsTemplate`) — admin pode gerenciar todos do tenant

## Risco
Nenhum. Apenas substitui placeholder por funcionalidade real usando tabela e RLS já existentes.

