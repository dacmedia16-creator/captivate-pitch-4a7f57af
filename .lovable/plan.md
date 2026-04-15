

# Por que "Viva Real: 24 encontrados, 0 válidos"

## Diagnóstico

Investiguei os dados do estudo `e4851263` (Sorocaba, Parque Campolim, Condomínio Cannes) e encontrei a causa raiz:

**Todos os 14+ URLs do Viva Real foram descartados com razão "Outra cidade"** — os links retornados eram de **Rio de Janeiro**, não de Sorocaba.

### O que aconteceu:

1. A URL nativa gerada foi:
   `https://www.vivareal.com.br/venda/sp/sorocaba/parque-campolim/apartamento_residencial/?filtro=condominium:cannes-`

2. O `slugify("Cannes ")` gerou `cannes-` (com traço no final por causa do espaço no nome do condomínio), criando um filtro inválido `?filtro=condominium:cannes-`

3. Viva Real não encontrou resultados válidos e retornou uma **página de erro/showcase** com anúncios aleatórios do Rio de Janeiro

4. O Google Search do Viva Real também retornou resultados de RJ

5. O filtro `isWrongCityUrl` corretamente descartou todos como "Outra cidade" — por isso 0 válidos

**O sistema está funcionando corretamente ao descartar** — o problema é na **geração da URL do Viva Real**.

## Correção proposta

### `supabase/functions/inngest-serve/index.ts`

1. **Corrigir `slugify`** — remover traços no início/final do resultado:
   ```typescript
   function slugify(text: string): string {
     return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
       .toLowerCase().replace(/\s+/g, "-")
       .replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
   }
   ```

2. **Corrigir URL do Viva Real** — o formato real é `/venda/{state}/{city}/{bairro}/{tipo}/` sem `?filtro=condominium:`. O filtro de condomínio não funciona assim no Viva Real. Remover esse parâmetro e deixar só a busca por bairro:
   ```typescript
   case "vivareal":
     return `https://www.vivareal.com.br/${purposeSlug}/${state}/${city}/${neighborhood}/${typeSlug}_residencial/`;
   ```

3. **Redeploy** da edge function `inngest-serve`

## Escopo
- 1 arquivo editado (2 alterações pequenas)
- Redeploy de 1 edge function

