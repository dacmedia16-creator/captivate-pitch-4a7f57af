

# Aplicar Paleta RE/MAX ao Site Inteiro

## Situação Atual
O site usa uma paleta azul escuro genérico (`hsl(213 55% 20%)`) com acentos dourados (`hsl(42 55% 54%)`). Os slides já foram atualizados para RE/MAX, mas a UI do site (login, sidebar, topbar, cards, botões) ainda usa o tema antigo.

## Mudanças

### 1. CSS Variables (`src/index.css`)
Substituir a paleta inteira por cores RE/MAX:

| Variable | Antes (HSL) | Depois (baseado em RE/MAX) |
|----------|-------------|---------------------------|
| `--primary` | `213 55% 20%` (azul genérico) | `216 100% 32%` (#003DA5) |
| `--accent` | `42 55% 54%` (dourado) | `352 83% 47%` (#DC1431) |
| `--gold` | `42 55% 54%` | `352 83% 47%` (vermelho RE/MAX substitui o dourado) |
| `--ring` | azul genérico | azul RE/MAX |
| `--sidebar-background` | azul escuro genérico | azul RE/MAX escuro |
| `--sidebar-primary` | dourado | vermelho RE/MAX |
| `--sidebar-ring` | dourado | vermelho RE/MAX |
| Dark mode | mesma lógica | mesma conversão |

### 2. Utilitários CSS (`src/index.css`)
- `.gold-gradient` → gradiente vermelho RE/MAX (será renomeado conceitualmente mas mantido como classe para não quebrar referências)
- `.text-gradient-gold` → gradiente vermelho RE/MAX
- `.animate-shimmer-gold` → shimmer vermelho

### 3. Componentes afetados (sem mudança de código)
Como usam variáveis CSS, mudam automaticamente:
- `Button` (usa `--primary`)
- `Card` (usa `--card`)
- `TopBar` (usa `--background`, `gold-gradient`)
- `AppSidebar` (usa `--sidebar-*`, `gold-gradient`)
- `MetricCard` (usa `gold-gradient`)
- `Login` (usa gradientes inline com HSL antigos — precisa atualizar)

### 4. Arquivos com cores inline hardcoded
- **`src/pages/auth/Login.tsx`**: gradiente de fundo e círculos decorativos usam HSL antigos — atualizar para azul RE/MAX e vermelho
- **`src/components/TopBar.tsx`**: shadow usa `hsl(215 30% 12%)` — atualizar
- **`src/components/shared/MetricCard.tsx`**: usa `gold-gradient` — funciona automaticamente

### 5. Tailwind config (`tailwind.config.ts`)
Sem mudanças necessárias — já referencia variáveis CSS.

## Arquivos a editar
1. `src/index.css` — paleta completa (light + dark) + utilitários
2. `src/pages/auth/Login.tsx` — cores inline do gradiente de fundo
3. `src/components/TopBar.tsx` — shadow inline

## O que NÃO muda
- Lógica de negócio, rotas, banco de dados
- Estrutura de componentes
- Layouts de slides (já atualizados)

