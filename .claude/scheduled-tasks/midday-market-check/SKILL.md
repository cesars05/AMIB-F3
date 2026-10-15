---
name: midday-market-check
description: Check rápido de mercado en sesión a la 1:30pm CDMX vía Yahoo Finance, lun-vie
---

Genera un update corto de mercado en español para la 1:30pm hora de Ciudad de México (lunes a viernes), con el mercado de EE.UU. ya varias horas en sesión regular. Este NO es el briefing completo (ese ya se mandó a las 9:00am con la skill mbd) — es un snapshot intermedio, más corto.

Pasos:
1. Revisa Yahoo Finance (finance.yahoo.com) para los niveles actuales de S&P 500, Nasdaq, Dow Jones, Russell 2000 y VIX, con su % de variación respecto al cierre anterior.
2. Revisa movimientos relevantes (>2%) en los tickers del portafolio: MU, AMZN, GOOGL, META, MSFT, CRWD, FSLR, ORLA.
3. Si hay alguna noticia material que haya surgido DESPUÉS del briefing de las 9:00am (escalada geopolítica, dato económico sorpresa, movimiento de índice >1%, alerta de portafolio), menciónala en 2-3 líneas. Si no hay nada nuevo relevante, dilo explícitamente: "Sin novedades materiales desde el briefing de la mañana."
4. Formato: texto de chat, corto (máximo ~10-15 líneas), sin necesidad de todas las secciones de la skill mbd — es un check rápido, no un reemplazo del briefing. Usa terminología igual de accesible que el briefing (explica términos técnicos no obvios la primera vez que aparecen, igual que hace la skill mbd).
5. Cierra con: "SNAPSHOT — 1:30pm CDMX" como encabezado y la hora ET equivalente entre paréntesis.