

# Ativar Portais e Testar Estudo de Mercado

## Problema
A tabela `tenant_portal_settings` está vazia para o tenant demo (`fa4322ce-bdbe-4221-b1f7-2bd38c4dd79c`). Por isso, o Step 3 do wizard mostra "Nenhum portal configurado" e não é possível selecionar portais para gerar estudo de mercado.

## Solução

### 1. Inserir dados de portais para o tenant demo
Inserir registros em `tenant_portal_settings` vinculando os portais existentes (ZAP, Viva Real, OLX, Imovel Web) ao tenant demo com `is_enabled = true`.

### 2. Atualizar seed-demo
Adicionar inserção de `tenant_portal_settings` no edge function `seed-demo` para que futuros seeds já incluam portais configurados.

### Detalhes técnicos

**Insert via tool** — 4 registros em `tenant_portal_settings`:
- ZAP Imóveis (`40b7bfcf-...`), priority 1
- Viva Real (`9c91d108-...`), priority 2  
- OLX (`4b85175d-...`), priority 3
- Imovel Web (`10ccdbda-...`), priority 4

Tenant: `fa4322ce-bdbe-4221-b1f7-2bd38c4dd79c`

**Atualizar `supabase/functions/seed-demo/index.ts`** — após criar o tenant, inserir `tenant_portal_settings` com os portais globais.

### Arquivos
| Arquivo | Mudança |
|---------|---------|
| DB (insert) | 4 rows em `tenant_portal_settings` |
| `supabase/functions/seed-demo/index.ts` | Adicionar bloco de inserção de portal settings |

