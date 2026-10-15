---
name: premarket-briefing
description: Briefing de mercados pre-market a las 9:20 am CDMX vía skill mbd + Yahoo Finance, lun-vie
---

Genera el briefing diario de mercados en español, enfocado en el contexto pre-market / inicio de sesión (9:00am hora de Ciudad de México, lunes a viernes).

Pasos:
1. Invoca la skill "anthropic-skills:mbd" (Market Briefing Daily) y sigue su flujo completo (PASO 0 a PASO 5) usando la fecha de hoy — modo "daily" salvo que el día de la semana indique otro modo según get_briefing_mode.py (lunes = weekly_open).
2. Además de las fuentes que ya indica la skill, revisa explícitamente Yahoo Finance (finance.yahoo.com) para futuros de índices (S&P 500, Nasdaq, Dow), movimientos pre-market de las posiciones del portafolio (MU, AMZN, GOOGL, META, MSFT, CRWD, FSLR, ORLA) y cualquier headline de última hora que Yahoo Finance esté destacando esta mañana. Incorpora esos datos donde corresponda dentro de la estructura del briefing (Sección 1 / Sección 7 / eventos del día), citando Yahoo Finance como fuente.
3. Entrega el briefing completo como mensaje de chat (no artifact), siguiendo el formato y las secciones condicionales que define la skill mbd.
4. Al final, sigue el PASO 5 de la skill (oferta de envío por correo y self-review) tal como está definido ahí.