UPDATE public.market_studies
SET status = 'cancelled',
    current_phase = 'Cancelado pelo usuário',
    updated_at = now()
WHERE id = '3a5cca9a-bf5f-4e45-85e6-d30123225e9c'
  AND status = 'processing';