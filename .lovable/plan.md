

# Corrigir estudo travado + timeout automático + botão retry

## 1. Corrigir estudo "Lessence" no banco

Usar o insert tool para executar:
```sql
UPDATE market_studies 
SET status = 'failed', current_phase = NULL, updated_at = now() 
WHERE id = '667b044b-822d-4361-87ba-82ab0bf8b5a8';
```

## 2. Criar função de banco para timeout automático

Migration SQL com uma função `expire_stuck_studies()` que marca como `failed` estudos em `processing` há mais de 15 minutos:

```sql
CREATE OR REPLACE FUNCTION public.expire_stuck_studies()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count integer;
BEGIN
  UPDATE market_studies
  SET status = 'failed', current_phase = NULL, updated_at = now()
  WHERE status = 'processing'
    AND updated_at < now() - interval '15 minutes';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;
```

## 3. Chamar timeout no frontend (polling)

Em `MarketStudyResult.tsx`, dentro do `refetchInterval` callback (que já roda a cada 5s para estudos em processing), adicionar verificação client-side: se `updated_at` é anterior a 15 minutos, chamar `supabase.rpc('expire_stuck_studies')` e invalidar a query. Isso garante que ao visualizar um estudo travado, ele é automaticamente marcado como failed.

## 4. Adicionar UI de estado "failed" + botão retry em MarketStudyResult.tsx

Atualmente não existe tratamento para `status === 'failed'`. Adicionar bloco entre o `isProcessing` e o render principal:

- Ícone de erro (XCircle vermelho)
- Mensagem "O estudo de mercado falhou"
- Botão "Tentar novamente" que:
  1. Busca subject property e portais do estudo
  2. Atualiza status para `processing`
  3. Chama `supabase.functions.invoke('analyze-market-deep', ...)` com os dados originais
  4. O polling existente retoma automaticamente

## 5. Adicionar timeout check no inngest-serve

No início da função Inngest, antes de começar o processamento, verificar se o estudo já está em processing há mais de 15 minutos e abortar se necessário. Isso evita que retries do Inngest ressuscitem estudos já expirados.

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| DB (insert tool) | UPDATE do estudo Lessence |
| DB (migration) | Função `expire_stuck_studies()` |
| `src/pages/agent/MarketStudyResult.tsx` | UI failed + retry + auto-expire check |
| `supabase/functions/inngest-serve/index.ts` | Guard de timeout no início |

