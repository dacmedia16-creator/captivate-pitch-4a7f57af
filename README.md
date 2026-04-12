# Listing Studio AI

SaaS multi-tenant para captação imobiliária com IA. Gera apresentações profissionais de captação com análise de mercado, cenários de preço e textos gerados por inteligência artificial.

## Arquitetura

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Auth, Database, Storage, Edge Functions
- **IA**: Lovable AI Gateway (Gemini)

## Papéis (Roles)

| Role | Descrição | Prefixo de rota |
|------|-----------|-----------------|
| `super_admin` | Administrador da plataforma | `/admin/*` |
| `agency_admin` | Administrador de imobiliária (tenant) | `/company/*` |
| `broker` | Corretor | `/dashboard`, `/presentations/*` |

Os papéis são armazenados na tabela `user_roles` (nunca no profile). RLS usa `has_role()` e `get_user_tenant_id()` como security definer functions.

## Multi-tenant

Cada imobiliária é um `tenant`. Todas as tabelas de dados possuem `tenant_id` e RLS policies que isolam os dados por tenant. Corretores só acessam dados do seu próprio tenant.

## Estrutura de Pastas

```
src/
├── components/       # Componentes reutilizáveis
│   ├── charts/       # Gráficos de mercado (Recharts)
│   ├── editor/       # Editor de apresentação (slides, toolbar)
│   ├── layouts/      # Layouts de slide (Executivo, Premium, Impacto)
│   ├── shared/       # DataTable, MetricCard, FormModal, etc.
│   ├── ui/           # shadcn/ui components
│   └── wizard/       # Steps do wizard de nova apresentação
├── contexts/         # AuthContext, RoleContext
├── hooks/            # Custom hooks (useGeneratePresentation, etc.)
├── pages/
│   ├── admin/        # Páginas do super_admin
│   ├── agent/        # Páginas do corretor
│   ├── auth/         # Login, Signup, ForgotPassword
│   ├── company/      # Páginas do agency_admin
│   └── shared/       # Apresentação compartilhada (público)
└── integrations/     # Supabase client (auto-gerado)

supabase/
├── functions/        # Edge Functions
│   ├── export-pdf/          # Exportar apresentação como HTML/PDF
│   ├── generate-presentation-text/  # Gerar textos com IA
│   └── seed-demo/           # Seed de dados demo (requer super_admin)
└── config.toml
```

## Variáveis de Ambiente

Gerenciadas automaticamente pelo Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Secrets das Edge Functions (configurados no Lovable Cloud):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `LOVABLE_API_KEY` — Para o AI Gateway

## Dados Demo

Para popular dados de demonstração, execute a Edge Function `seed-demo` (requer autenticação como `super_admin`):

```
Usuários criados:
- admin@demo.com (agency_admin) — senha: 12345678
- corretor1@demo.com (broker) — senha: 12345678
- corretor2@demo.com (broker) — senha: 12345678
```

## Segurança

- RLS habilitado em todas as tabelas (22 tabelas)
- Edge Functions protegidas com JWT + ownership validation
- Roles gerenciados via `user_roles` table (não no profile)
- Share tokens com suporte a expiração (`share_expires_at`)
- Trigger `handle_new_user` auto-atribui role `broker` no signup
