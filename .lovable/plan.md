

# Busca automática de endereço pelo CEP

## O que será feito
Ao digitar o CEP no formulário de imóvel (Step 1 do wizard), o sistema buscará automaticamente o endereço, bairro e cidade usando a API pública **ViaCEP** (`viacep.com.br/ws/{cep}/json/`). Os campos serão preenchidos automaticamente, mas editáveis.

## Mudanças

### `src/components/wizard/StepPropertyData.tsx`
1. Adicionar função `fetchCep` que chama `https://viacep.com.br/ws/{cep}/json/` quando o CEP tiver 8 dígitos
2. Aplicar máscara de CEP (00000-000) no input
3. Auto-preencher `address` (logradouro), `neighborhood` (bairro) e `city` (localidade) com os dados retornados
4. Mostrar indicador de loading enquanto busca
5. Mostrar feedback se CEP não encontrado

## Detalhes técnicos
- API ViaCEP é gratuita, pública, sem autenticação
- Disparo automático ao completar 8 dígitos (sem botão extra)
- Campos preenchidos continuam editáveis pelo usuário
- Sem dependências adicionais

## Risco
Nenhum. Apenas adiciona funcionalidade ao formulário existente.

