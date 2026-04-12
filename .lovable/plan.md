

# Melhorar qualidade dos dados simulados do estudo de mercado

## Problema atual
O `useSimulateComparables.ts` gera dados completamente fictícios:
- Endereços genéricos fixos (Av. Paulista, Rua das Flores) que não correspondem à região do imóvel
- Preços com variação simples de ±20% sem considerar tipo, padrão ou região
- Nomes de rua hardcoded que não mudam conforme a cidade/bairro

## O que será feito

### 1. Endereços baseados na localização real
- Usar o bairro e cidade do imóvel para gerar endereços mais realistas (ex: "Rua 1, 345 - Parque Campolim, Sorocaba")
- Gerar nomes de rua variados mas com referência ao bairro informado

### 2. Preços mais realistas por padrão do imóvel
- Ajustar faixas de preço/m² conforme o `property_standard`:
  - Econômico: R$ 3.000-5.000/m²
  - Médio: R$ 5.000-8.000/m²
  - Alto: R$ 8.000-12.000/m²
  - Luxo: R$ 12.000-20.000/m²
- Se o proprietário informou preço pretendido, usar como referência central mas com variação mais inteligente

### 3. Características coerentes
- Quartos/suítes/vagas devem variar de forma coerente com a área
- Títulos mais descritivos incluindo condomínio quando disponível

### 4. Score de similaridade baseado em proximidade real
- Score mais alto para comparáveis com área e preço/m² mais próximos do imóvel

## Arquivos modificados
- `src/hooks/useSimulateComparables.ts` — refatoração completa da lógica de geração

## Nota importante
Esses dados continuam sendo **simulados** (não vêm de portais reais). A melhoria é torná-los mais verossímeis até que uma integração real com APIs de portais seja implementada.

## Risco
Nenhum. Apenas melhora a qualidade dos dados simulados.

