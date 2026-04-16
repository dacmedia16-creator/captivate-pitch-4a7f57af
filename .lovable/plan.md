

# Finalizar Pesquisa Travada

## Situação
O estudo **Alphaville Nova Esplanada** (`6d8fce3e`) está travado em `processing/extracting` desde há mais de 6 horas. Tem 0 comparáveis, 0 raw listings, 0 executions — o Inngest parece ter falhado silenciosamente.

## Ação
Marcar o estudo como `failed` para que o botão "Tentar novamente" apareça na listagem. Isso permitirá re-executar com o fix de timeout já deployado.

### Passos
1. **Migration**: `UPDATE market_studies SET status = 'failed', current_phase = NULL WHERE id = '6d8fce3e-cc62-481e-8691-9a9fe6fa1e0c'`
2. Nenhuma mudança de código necessária — o botão de retry já existe na página `MarketStudies.tsx`

