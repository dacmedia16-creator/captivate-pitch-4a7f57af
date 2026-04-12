

# Adicionar Portal Kenlo às Configurações de Portais

## O que será feito
Adicionar o portal **Kenlo** (`https://portal.kenlo.com.br/`) à tabela `portal_sources` para que apareça na página de configuração de portais da imobiliária.

## Mudanças

### 1. Migração SQL
Adicionar coluna `base_url` na tabela `portal_sources` (opcional, para armazenar a URL do portal) e inserir o registro do Kenlo:

```sql
ALTER TABLE public.portal_sources ADD COLUMN IF NOT EXISTS base_url TEXT;

INSERT INTO public.portal_sources (code, name, is_global, base_url) VALUES
  ('kenlo', 'Kenlo', true, 'https://portal.kenlo.com.br/')
ON CONFLICT (code) DO NOTHING;
```

### 2. UI (opcional)
Mostrar a URL do portal no card, abaixo do código, como link clicável. Ajuste pequeno em `CompanyPortals.tsx`.

## Risco
Nenhum. Apenas insere um novo registro e uma coluna opcional.

