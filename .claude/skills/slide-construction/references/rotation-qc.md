> **Instrucciones / notas de navegación**
> - **Qué es:** PASO FINAL: rotación de layouts entre slides + QC del deck (números, narrativa, lenguaje, visual) con reporte por severidad.
> - **Cuándo leerlo:** Al terminar el deck o cuando el usuario pida revisar o QC un deck existente.
> - **Siguiente:** Si hay hallazgos, regresa a la receta correspondiente y vuelve a renderizar.
> - Flujo: SKILL.md → style-systems → adaptation → slide-catalog → (structural-diagrams | charts | thinkcell-library | shapes-components | images) → grid-typography → rotation-qc

# Rotación de layouts + QC del deck

## 1. Rotación (para que el deck no se vea repetido)
Familias: **T** texto · **C** gráfica · **K** tabla · **D** diagrama/boxes · **E** evidencia/imagen · **F** marco (portada, agenda, divisor).
1. Máx. 2 slides seguidos de la misma familia; nunca el mismo layout exacto 2 veces seguidas (excepción: módulos seriados "1/4…4/4", que deben verse idénticos a propósito).
2. Cada sección: divisor (F) → contexto (D o T) → 1–3 cuantitativos (C/K) → implicación/decisión (D o T con barra de conclusión).
3. Alterna la geometría del área de contenido: full width → 2 columnas → 60/40 → 3 paneles → full width.
4. Alterna el "acento visual": barra de conclusión en un slide, banner arriba en otro, callouts en otro — no todos los recursos en todos los slides.
5. Usa la tabla 14 de `slide-catalog.md` (opción 1/2/3 por mensaje) y rota entre opciones cuando el mismo tipo de mensaje se repite.
6. Mantén **idénticos** título, subtítulo, regla, logo, source y nº de página en todos los slides (pixel-idénticos); solo varía el área de contenido.
7. Densidad: deck de lectura (research, board book) → denso está bien (11–12 pt, tablas). Deck para presentar en voz → 1 idea por slide, ≤ 40 palabras de cuerpo, KPIs grandes, más gráficas que tablas.

## 2. QC (adaptado de "IB Deck Checker") — correr antes de entregar
Es solo lectura/reporte; los arreglos se hacen después.

### Paso 0 – extraer
`python scripts/extract_text.py deck.pptx > deck_content.md` (marca `## Slide N`), luego
`python scripts/extract_numbers.py deck_content.md --check` → normaliza $500M/$500MM/$0.5bn, categoriza (revenue, EBITDA, múltiplos, márgenes, %) y marca la misma métrica con valores distintos en slides distintos.

### 1. Consistencia numérica (Crítico)
* Mismo dato = mismo número en todo el deck (script + revisión).
* Totales suman, % suman 100, crecimientos y CAGR cuadran con extremos.
* Una sola convención de unidades ($M o $MM; mm; x; pp) y periodos rotulados (FY/LTM/CY, A/E).

### 2. Datos vs narrativa (Crítico)
* Cada claim del título/subtítulo está en la gráfica de ese slide (dirección, magnitud).
* Claims de posición (#1, líder) soportados por share/ranking; plausibilidad (share = revenue / mercado).
* Si se editó una gráfica, revisar el resumen ejecutivo y las conclusiones.

### 3. Lenguaje (Importante)
Registro IB/research: sin "muy bueno", "un montón", contracciones, signos de exclamación, cuantificadores vagos sin número ("significativo" → "+320 bps"). Misma palabra para el mismo concepto (no alternar "EBITDA ajustado"/"Adj. EBITDA"/"EBITDA"). Idioma consistente (no mezclar español/inglés en títulos salvo términos técnicos).
Reemplazos frecuentes: "a lot of" → cifra; "big" → "material ($X)"; "going up" → "+x% YoY"; "cheap" → "trades at x discount to peers"; "we think" → "we estimate / we expect".

### 4. Visual y formato (Menor → Importante)
Render: `powershell -File scripts/render.ps1 deck.pptx out_dir` y **mirar cada PNG**. Revisar:
* [ ] Título 1 línea (A) / ≤ 2 (bancos), sin desbordes; subtítulo 1 línea.
* [ ] Nada fuera del área de contenido ni en la zona del logo; nada se encima; textos no cortados.
* [ ] Fuente/source en cada slide con datos; notas numeradas si hay ajustes.
* [ ] Ejes/unidades rotulados; data labels legibles (≥ 8 pt); colores en el orden del sistema; 1 acento.
* [ ] Fuentes: una familia; tamaños ∈ escala; sin texto < 8 pt.
* [ ] Formato numérico uniforme (1,000 vs 1K; fechas); negativos con paréntesis o signo, igual en todo el deck.
* [ ] Rotación de layouts cumple §1.
`python scripts/deck_forensics.py deck.pptx --summary` sirve para verificar fuentes, tamaños y colores usados.

### Reporte
```
## QC – <deck> (<n> slides)
### Crítico   (bloquea entrega)   – "No se encontraron inconsistencias numéricas" si aplica
- [S7 vs S15] Revenue FY25 $1,240M vs $1,204M → …
### Importante
### Menor
### Verificado sin hallazgos: <lista de checks>
```
