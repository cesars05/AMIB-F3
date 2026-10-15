---
name: market-close-recap
description: Recap de cierre de mercado + after-hours a las 4:20pm CDMX vía Yahoo Finance, lun-vie
---

Genera un recap de cierre de mercado en español para las 4:20pm hora de Ciudad de México (lunes a viernes) — el mercado de EE.UU. (NYSE/Nasdaq) ya cerró su sesión regular a esta hora, así que este recap debe incluir tanto el cierre como movimientos de after-hours.

Pasos:
1. Revisa Yahoo Finance (finance.yahoo.com) para el cierre oficial de S&P 500, Nasdaq, Dow Jones, Russell 2000, VIX, y si están disponibles: oro, WTI/Brent, Treasury 10Y, DXY — todos con su % de variación del día.
2. Identifica el driver principal del movimiento del día (1 párrafo).
3. Revisa reacciones de after-hours: earnings publicados después del cierre (especialmente si son de MU, AMZN, GOOGL, META, MSFT, CRWD, FSLR, ORLA o mega-caps relevantes), y cualquier movimiento >3% en after-hours trading que Yahoo Finance esté reportando.
4. Menciona brevemente (1-2 líneas) si algo material cambió respecto al check de la 1:30pm — sin repetir lo ya dicho, solo la novedad.
5. Formato: texto de chat, estilo similar a la Sección 1 (Cierre) y Sección 10 (Earnings) de la skill "anthropic-skills:mbd" — puedes consultar esa skill para el formato exacto de esas secciones, pero no hace falta correr el flujo completo de la skill (eso ya pasó a las 9:00am). Explica términos técnicos no obvios la primera vez que aparecen.
6. Cierra con: "CIERRE — [fecha] (4:20pm CDMX)" como encabezado.