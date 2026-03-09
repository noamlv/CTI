# Plantilla Editorial Quarto

## Estructura reusable

- `_quarto.yml`: configuración global de website, navbar fija y menús.
- `styles/openai-editorial.css`: sistema visual global (colores, tipografía, ritmo, componentes).
- `index.qmd`: estructura narrativa con hero + secciones + contacto.
- `charts/*.html`: gráficos embebidos por `iframe` con el mismo stack tipográfico.

## Reutilización rápida en otro proyecto

1. Copia `_quarto.yml` y `styles/openai-editorial.css`.
2. Reusa bloques de `index.qmd` con clases:
   - `.hero-screen`
   - `.kpi-strip`
   - `.story-section`
   - `.chart-frame`
3. Crea nuevos `charts/*.html` y cambia el `src` del `iframe`.
4. Renderiza:

```bash
quarto render
```

## Reglas estéticas integradas

- Fondo: `#FFFFFF`
- Texto primario: `#111111`
- Texto secundario: `#6F6F6F`
- Divisores: `#E5E5E2`
- Tipografía global: `"Söhne", "Soehne", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif`
