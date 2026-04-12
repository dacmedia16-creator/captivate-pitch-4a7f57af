

# Sincronizar animação de geração com o processo real

## Problema
A tela de geração (`StepGeneration`) usa timers fixos (total ~6.2s) para animar os 4 estágios e depois chama `onAnimationDone()`, que marca como completo e redireciona. Mas o processo real (Manus pode levar até 5 min) continua rodando em background. A animação termina antes da apresentação estar pronta.

## Solução
Usar duas flags independentes: "animação terminou" e "geração real terminou". Só marcar como completo e redirecionar quando **ambas** forem true.

### Mudanças

**1. `AgentNewPresentation.tsx`**
- Adicionar estado `generationDone` (boolean, false)
- Ao final de `handleGenerate()` (após todas as operações de DB), setar `generationDone = true`
- Renomear `handleAnimationDone` → lógica que verifica se `generationDone` também é true
- Passar `generationDone` como prop para `StepGeneration`

**2. `StepGeneration.tsx`**
- Receber nova prop `generationDone: boolean`
- Quando os timers terminam mas `generationDone` é false: manter o último estágio com spinner (não chamar `onAnimationDone`)
- Adicionar um estágio extra "Finalizando..." que fica ativo enquanto espera
- Usar `useEffect` que monitora `generationDone`: quando vira true E animação já passou, chamar `onAnimationDone()`
- Se `generationDone` virar true antes dos timers acabarem, acelerar a animação restante

### Fluxo corrigido
```text
Timer animação:  ████████████████░░░░░░░░░░░  (6s)
Geração real:    ████████████████████████████████ (30-120s)
                                              ↑ onAnimationDone só aqui
```

### Arquivos
1. `src/components/wizard/StepGeneration.tsx` — adicionar prop `generationDone`, lógica de espera
2. `src/pages/agent/AgentNewPresentation.tsx` — adicionar estado `generationDone`, passar como prop

