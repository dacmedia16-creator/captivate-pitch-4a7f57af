

# Corrigir: Usuário sem tenant_id não vê portais

## Problema
O perfil do usuário logado (`c5043c88-ce5f-4e52-8081-b57d7262b300`) tem `tenant_id = NULL`. A query de portais filtra por `tenant_id`, então retorna vazio → "Nenhum portal configurado pela imobiliária."

## Causa raiz
Esse usuário foi criado sem ser associado a um tenant. Os 3 usuários demo (Ana, Carlos, Marina) estão corretamente no tenant `fa4322ce-...`, mas este 4º usuário não.

## Solução

### Opção A — Vincular o usuário ao tenant existente (rápido)
Executar uma migration para atualizar o perfil:
```sql
UPDATE profiles 
SET tenant_id = 'fa4322ce-bdbe-4221-b1f7-2bd38c4dd79c' 
WHERE id = 'c5043c88-ce5f-4e52-8081-b57d7262b300';
```

### Opção B — Auto-associar no signup (preventivo)
Modificar o trigger de criação de perfil ou o fluxo de signup para garantir que novos usuários sejam associados a um tenant automaticamente. Isso evita o problema no futuro.

## Recomendação
Fazer **ambos**: a migration resolve o caso atual, e ajustar o signup previne recorrência.

### Arquivos
1. **Migration SQL** — vincular o usuário ao tenant
2. `src/pages/auth/Signup.tsx` — garantir que o signup associe o `tenant_id` (verificar se já faz isso)
3. `src/contexts/AuthContext.tsx` — verificar se o trigger `handle_new_user` define `tenant_id`

