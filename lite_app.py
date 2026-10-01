"""FareRadar Lite: Airfare History Dashboard & Buy-Wait Heuristic.

Official Streamlit Reference Implementation for Hackathon 2026.
Problem Statement: PS-025 — Data Science & Predictive Analytics.
"An explainable airfare intelligence dashboard that turns historical fare data into understandable price context."
"""

import sys
from pathlib import Path
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

# Add backend directory to sys.path to leverage analytical core
backend_path = Path(__file__).resolve().parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.core.data_loader import load_dataset, get_route_dataframe, get_reference_date, get_data_quality_summary
from app.core.statistics import calculate_window_statistics, calculate_percentile, build_distribution_bins
from app.core.volatility import calculate_volatility
from app.core.trend import calculate_recent_direction
from app.core.heuristic import evaluate_heuristic_signal
from app.core.forecasting import generate_forecast
from app.core.validation import run_rolling_origin_validation

st.set_page_config(
    page_title="FareRadar Lite — PS-025 Airfare Intelligence",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling for Aviation Dark Theme
st.markdown(
    """
    <style>
    .main { background-color: #070B14; color: #F1F5F9; }
    .stMetric { background-color: rgba(15, 26, 46, 0.7); border: 1px solid rgba(77, 163, 255, 0.2); border-radius: 12px; padding: 12px; }
    .signal-box { border-radius: 14px; padding: 18px; margin-bottom: 20px; font-weight: bold; }
    .signal-buy { background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #34D399; }
    .signal-wait { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; color: #F87171; }
    .signal-neutral { background-color: rgba(59, 130, 246, 0.15); border: 1px solid #3B82F6; color: #60A5FA; }
    </style>
    """,
    unsafe_allow_html=True,
)

# 1. Header
st.title("✈️ FareRadar Lite: Airfare History Dashboard & Buy-Wait Heuristic")
st.caption(
    "**Problem Statement: PS-025 | Domain: Data Science & Predictive Analytics**  \n"
    "*\"An explainable airfare intelligence dashboard that turns historical fare data into understandable price context.\"*"
)

# 2. Data Loading
try:
    df = load_dataset()
    ref_date = get_reference_date(df)
    routes_list = sorted(df["route"].unique().tolist())
except Exception as e:
    st.error(f"Failed to load dataset: {e}")
    st.stop()

# 3. Sidebar Controls
with st.sidebar:
    st.header("Flight Controls")
    selected_route = st.selectbox("Domestic Route", routes_list, index=routes_list.index("DEL-BLR") if "DEL-BLR" in routes_list else 0)
    selected_window = st.radio("Historical Window", [30, 60, 90], index=1, horizontal=True)

    # Filter data for route
    df_route = get_route_dataframe(df, selected_route)
    latest_fare = float(df_route[df_route["date"] == ref_date]["fare"].median()) if not df_route.empty else 4850.0

    current_fare = st.slider(
        "Today's Quoted Fare (₹)",
        min_value=1500,
        max_value=12000,
        value=int(latest_fare),
        step=50,
        help="Adjust to simulate whether today's price is cheap, normal, or elevated."
    )

    st.markdown("---")
    st.markdown(
        f"**Dataset Reference Date:** `{ref_date}`  \n"
        f"**Total Records:** `{len(df_route)}` observations  \n"
        "*(NEVER uses system clock)*"
    )

# 4. Statistical Analysis
df_window = get_route_dataframe(df, selected_route, window_days=selected_window)
fares_window = df_window["fare"].values

stats = calculate_window_statistics(fares_window, selected_window)
pct_result = calculate_percentile(fares_window, current_fare)
vol_result = calculate_volatility(fares_window)
dir_result = calculate_recent_direction(df_route)
heuristic = evaluate_heuristic_signal(current_fare, stats, pct_result, vol_result, dir_result)

# 5. Top KPI Metrics
k1, k2, k3, k4, k5 = st.columns(5)
with k1:
    st.metric("Today's Fare", f"₹{int(current_fare):,}", delta=f"{((current_fare - stats.median)/stats.median*100):+.1f}% vs Median", delta_color="inverse")
with k2:
    st.metric(f"{selected_window}D Median", f"₹{int(stats.median):,}")
with k3:
    st.metric("Percentile Rank", f"{pct_result.percentile:.0f}%", pct_result.band)
with k4:
    st.metric("Volatility (CV)", f"{vol_result.volatility_index:.1f}%", vol_result.category)
with k5:
    st.metric("Historical Corridor", f"₹{int(stats.min):,}–₹{int(stats.max):,}", f"IQR: ₹{int(stats.iqr):,}")

# 6. FARE RADAR SIGNAL Box
signal_class = "signal-buy" if "BUY" in heuristic.signal else "signal-wait" if "WAIT" in heuristic.signal else "signal-neutral"
st.markdown(
    f"""
    <div class="signal-box {signal_class}">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Explainable Decision Heuristic ({heuristic.confidence_label})</div>
        <div style="font-size: 24px; margin-top: 4px;">SIGNAL: {heuristic.signal}</div>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("🔍 Why did this signal fire? (Deterministic Rule Trace)"):
    for r in heuristic.reasons:
        st.write(f"- {r}")
    st.caption("**Mathematical Pipeline Trace:**")
    for t in heuristic.rule_trace:
        st.code(t, language="text")

# 7. Interactive Charts (Plotly)
col_left, col_right = st.columns([3, 2])

with col_left:
    st.subheader(f"Historical Trajectory ({selected_window} Days)")
    daily_trend = df_window.groupby("date")["fare"].median().reset_index()
    daily_trend["rolling_7"] = daily_trend["fare"].rolling(7, min_periods=1).median()

    fig_hist = go.Figure()
    # Q1-Q3 Corridor
    fig_hist.add_hline(y=stats.q1, line_dash="dot", line_color="#10B981", annotation_text="Q1 (Low Bound)")
    fig_hist.add_hline(y=stats.q3, line_dash="dot", line_color="#EF4444", annotation_text="Q3 (High Bound)")
    fig_hist.add_hline(y=current_fare, line_dash="dash", line_color="#F59E0B", annotation_text=f"Today: ₹{int(current_fare):,}")

    fig_hist.add_trace(go.Scatter(x=daily_trend["date"], y=daily_trend["fare"], mode="lines", name="Daily Fare", line=dict(color="#3B82F6", width=2)))
    fig_hist.add_trace(go.Scatter(x=daily_trend["date"], y=daily_trend["rolling_7"], mode="lines", name="7D Median", line=dict(color="#2DD4BF", width=1.5)))
    fig_hist.update_layout(template="plotly_dark", height=320, margin=dict(l=20, r=20, t=20, b=20), hovermode="x unified")
    st.plotly_chart(fig_hist, use_container_width=True)

with col_right:
    st.subheader("Price Distribution")
    bins = build_distribution_bins(fares_window, current_fare)
    bin_labels = [b.label for b in bins]
    bin_counts = [b.count for b in bins]
    colors = ["#38BDF8" if b.is_current else "#1E3A8A" for b in bins]

    fig_dist = go.Figure(go.Bar(x=bin_labels, y=bin_counts, marker_color=colors))
    fig_dist.update_layout(template="plotly_dark", height=320, margin=dict(l=20, r=20, t=20, b=20))
    st.plotly_chart(fig_dist, use_container_width=True)

# 8. Indicative 7-Day Forward Horizon (Prophet / ML)
st.subheader("🔮 Indicative 7-Day Forward Horizon")
forecast = generate_forecast(df_route, selected_route, horizon_days=7)

if not forecast.available:
    st.warning(f"⚠️ {forecast.reason}")
else:
    hist_tail = forecast.history[-14:]
    f_dates = [f.date for f in forecast.forecast]
    f_yhat = [f.yhat for f in forecast.forecast]
    f_lower = [f.yhat_lower for f in forecast.forecast]
    f_upper = [f.yhat_upper for f in forecast.forecast]

    fig_f = go.Figure()
    # 80% Uncertainty Band
    fig_f.add_trace(go.Scatter(x=f_dates + f_dates[::-1], y=f_upper + f_lower[::-1], fill='toself', fillcolor='rgba(16, 185, 129, 0.15)', line=dict(color='rgba(255,255,255,0)'), name='80% Uncertainty Envelope'))
    # History
    fig_f.add_trace(go.Scatter(x=[h.date for h in hist_tail], y=[h.fare for h in hist_tail], mode='lines+markers', name='Actual Fare', line=dict(color='#3B82F6', width=2)))
    # Forecast
    fig_f.add_trace(go.Scatter(x=f_dates, y=f_yhat, mode='lines+markers', name='Indicative Forecast', line=dict(color='#10B981', dash='dash', width=2)))
    fig_f.update_layout(template="plotly_dark", height=280, margin=dict(l=20, r=20, t=20, b=20))
    st.plotly_chart(fig_f, use_container_width=True)
    st.caption(f"Engine: {forecast.method} • {forecast.disclaimer}")

# 9. Rolling-Origin Backtesting & Zero Leakage Validation
st.subheader("🛡️ Rolling-Origin Walk-Forward Backtesting (Zero Data Leakage)")
val = run_rolling_origin_validation(df_route, selected_route, k_folds=4, horizon_days=7)

v1, v2, v3, v4 = st.columns(4)
v1.metric("Average MAE", f"₹{val.avg_mae:.0f}", "Mean Absolute Error")
v2.metric("Average RMSE", f"₹{val.avg_rmse:.0f}", "Root Mean Sq Error")
v3.metric("Average MAPE", f"{val.avg_mape:.1f}%", "Percentage Error")
v4.metric("80% Coverage", f"{val.avg_coverage_pct:.0f}%", f"{'Beats' if val.baseline_comparison.beats_baseline else 'Matches'} Baseline")

with st.expander("📊 View Walk-Forward Folds & Naive Baseline Comparison"):
    if val.folds:
        folds_df = pd.DataFrame([
            {"Fold": f"Fold #{f.fold}", "Train Cutoff": f"<= {f.train_end}", "Test Window": f"{f.test_start} to {f.test_end}", "MAE (₹)": f"{f.mae:.0f}", "MAPE (%)": f"{f.mape:.1f}%", "80% Coverage": f"{f.coverage_pct:.0f}%"}
            for f in val.folds
        ])
        st.table(folds_df)
    st.info(f"**Baseline Benchmark Comparison:** Model MAE ₹{val.baseline_comparison.model_mae:.0f} vs Naive 7-Day Median Baseline MAE ₹{val.baseline_comparison.baseline_mae:.0f} ({val.baseline_comparison.improvement_pct:+.1f}% error reduction).")

# 10. Methodology Disclosure
st.markdown("---")
st.caption(
    "**Disclosure:** FareRadar Lite provides educational and historical price intelligence. It does not guarantee future airline prices or provide financial booking advice. "
    "*\"FareRadar doesn't try to guess the airline's algorithm. It gives travelers historical evidence to understand today's price.\"*"
)
