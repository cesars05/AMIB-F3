# Plan: Upgrade ACTINVER_v2 to Advanced Deep Value Quant Engine

## Context
The current version of the quant engine (`ACTINVER_v2.py`) is too basic. It plots a fixed number of assets per market regardless of their absolute rank and lacks critical fundamental data (Forward P/E, Target Prices, ATH distance) that a professional analyst needs to avoid "value traps." The user wants a high-conviction "Top Selection" (Top 11 or 25) with deep-dive metrics.

## Implementation Strategy

### 1. Fix Ticker Selection Logic
- **Current issue**: It plots top 5 MX and top 5 GLOBAL separately.
- **Fix**: Change logic to plot the absolute Top N (e.g., Top 15) based on the `Momentum_Score` regardless of market, ensuring the highest conviction assets are always visualized.

### 2. Expand Data Collection (The "Professional" Layer)
I will upgrade the `yfinance` data extraction to include:
- **Fundamental Metrics**: Fetch `info` for each top ticker to get:
    - `forwardPE` (Forward P/E)
    - `targetMeanPrice` (Analyst Target Price)
    - `currentPrice` (Last Close)
- **Calculated Metrics**:
    - **Upside %**: `((Target Price / Current Price) - 1) * 100`
    - **Distance from ATH**: `((Current Price / All-Time High) - 1) * 100`
    - **ATH Frequency**: Calculate how many times the price was within 2% of its 3-month high (Momentum Index).

### 3. Update the Ranking DataFrame
- Merge these new fundamental metrics into the `df_ranking` table.
- Ensure the final CSV (`v1_reporte_final.csv`) contains all these professional columns.

### 4. Enhance the Bloomberg Report (`Deep_Value_Report_Final.html`)
- **Expand Table**: Add columns for Forward P/E, Last Close, Target Price, Upside %, and Distance from ATH.
- **Dynamic Content**: Ensure the HTML table reflects the absolute Top 25 ranking.

## Critical Files to Modify
- `C:\Users\cesar\Downloads\Actinver\ACTINVER_v2.py`: Main logic update.
- `C:\Users\cesar\Downloads\Actinver\Deep_Value_Report_Final.html`: UI update to accommodate new metrics.

## Verification Plan
1. Run `ACTINVER_v2.py`.
2. Verify that `v1_reporte_final.csv` now contains `Forward P/E`, `Target Price`, and `Upside %`.
3. Check that the generated PNGs correspond to the absolute top-ranked tickers.
4. Open the HTML report and verify the new "Professional" columns are visible and correctly populated.
