

# Listing Studio AI — Estrutura Base

## Visão Geral
Plataforma SaaS premium de captação imobiliária com IA. Estrutura inicial com layout, navegação por perfil e shell visual sofisticado.

## Design System
- **Tema escuro/claro** com visual premium — cores primárias em azul profundo (#1e3a5f), acentos dourados (#c9a84c)
- Tipografia forte: Inter para corpo, fonte display para headings
- Cards com glassmorphism sutil, cantos arredondados (12px), espaçamento generoso
- Sidebar elegante com ícones + texto, colapsável

## Estrutura de Rotas por Perfil

### Super Admin
- `/admin/dashboard` — Visão geral de tenants
- `/admin/tenants` — Gerenciar imobiliárias
- `/admin/users` — Todos os usuários
- `/admin/settings` — Configurações globais

### Admin da Imobiliária
- `/company/dashboard` — Dashboard da imobiliária
- `/company/team` — Gerenciar corretores
- `/company/branding` — Marca e personalização
- `/company/templates` — Templates de apresentação
- `/company/settings` — Configurações

### Corretor
- `/dashboard` — Meu painel
- `/presentations` — Minhas apresentações
- `/presentations/new` — Criar nova apresentação
- `/profile` — Meu perfil profissional
- `/market-study` — Estudos de mercado

## Componentes a Criar

1. **AppLayout** — Layout principal com sidebar + topbar + área de conteúdo
2. **AppSidebar** — Sidebar dinâmica por perfil (Super Admin / Admin / Corretor)
3. **TopBar** — Barra superior com nome do usuário, perfil, notificações
4. **RoleGuard** — Componente de proteção de rotas por perfil
5. **Páginas placeholder** — Todas as rotas com layout e título, prontas para expansão

## Navegação
- Sidebar com ícones Lucide, labels claras, destaque da rota ativa
- Troca de perfil via seletor no topo da sidebar (para desenvolvimento/demo)
- Menu colapsável em tablet

## Visual Premium
- Background com gradiente sutil
- Cards com sombras suaves e bordas discretas
- Animações de transição entre páginas
- Empty states elegantes nos placeholders
- Logo placeholder "Listing Studio AI" com ícone

