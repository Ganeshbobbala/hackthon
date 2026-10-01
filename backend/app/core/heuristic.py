"""Explainable heuristic rule engine for Buy-Wait airfare signals.

Evaluates historical percentiles, volatility, trends, and interquartile outlier bounds
to generate transparent, rule-traced signals with zero black-box obscurity.
"""

from typing import List, Tuple
from ..schemas import HeuristicResult, WindowStatistics, PercentileResult, VolatilityResult, TrendResult


def evaluate_heuristic_signal(
    current_fare: float,
    window_stats: WindowStatistics,
    percentile_res: PercentileResult,
    volatility_res: VolatilityResult,
    trend_res: TrendResult,
) -> HeuristicResult:
    """Generate explainable Buy/Wait signal with step-by-step rule trace and rationale."""
    pct = percentile_res.percentile
    reasons: List[str] = []
    rule_trace: List[str] = []
    anomaly_flag = False
    caution_flag = False

    # 1. Base Signal Rule from Percentile Band
    if pct <= 25.0:
        signal = "BUY NOW"
        reasons.append(
            f"Current fare (₹{int(current_fare):,}) is in the bottom quartile ({pct:.0f}th percentile) "
            f"relative to the {window_stats.window_days}-day window."
        )
        rule_trace.append(f"RULE-1: Percentile <= 25% ({pct:.1f}%) -> Base Signal = BUY NOW")
    elif pct <= 40.0:
        signal = "CONSIDER BUYING"
        reasons.append(
            f"Current fare (₹{int(current_fare):,}) is below typical ({pct:.0f}th percentile) "
            f"compared to the median of ₹{int(window_stats.median):,}."
        )
        rule_trace.append(f"RULE-2: 25% < Percentile <= 40% ({pct:.1f}%) -> Base Signal = CONSIDER BUYING")
    elif pct <= 60.0:
        signal = "NEUTRAL / MONITOR"
        reasons.append(
            f"Current fare (₹{int(current_fare):,}) sits near the historical median ({pct:.0f}th percentile), "
            "representing normal, expected route pricing."
        )
        rule_trace.append(f"RULE-3: 40% < Percentile <= 60% ({pct:.1f}%) -> Base Signal = NEUTRAL / MONITOR")
    elif pct <= 75.0:
        signal = "CONSIDER WAITING"
        reasons.append(
            f"Current fare (₹{int(current_fare):,}) is elevated ({pct:.0f}th percentile) "
            f"above the typical range (median ₹{int(window_stats.median):,})."
        )
        rule_trace.append(f"RULE-4: 60% < Percentile <= 75% ({pct:.1f}%) -> Base Signal = CONSIDER WAITING")
    else:
        signal = "WAIT / PRICE HIGH"
        reasons.append(
            f"Current fare (₹{int(current_fare):,}) is in the top quartile ({pct:.0f}th percentile), "
            f"substantially higher than {pct:.0f}% of observed fares in this window."
        )
        rule_trace.append(f"RULE-5: Percentile > 75% ({pct:.1f}%) -> Base Signal = WAIT / PRICE HIGH")

    # 2. Modifier: Upward Outlier / Anomaly Detection (Tukey's Fences)
    outlier_threshold = window_stats.q3 + 1.5 * window_stats.iqr
    if window_stats.iqr > 0 and current_fare > outlier_threshold:
        anomaly_flag = True
        reasons.append(
            f"Upward anomaly detected: current fare (₹{int(current_fare):,}) exceeds the statistical "
            f"outlier threshold of ₹{int(outlier_threshold):,} (Q3 + 1.5×IQR)."
        )
        rule_trace.append(
            f"MODIFIER-1: Fare ₹{int(current_fare)} > Q3+1.5*IQR (₹{int(outlier_threshold)}) -> Upward Anomaly Flagged"
        )

    # 3. Modifier: Price Momentum & Low Fare Warning
    if trend_res.direction == "Increasing" and pct < 40.0:
        reasons.append(
            "Momentum warning: Although today's fare is relatively low, recent 7-day median has risen "
            f"by {trend_res.change_pct:+.1f}%, suggesting potential upward price pressure."
        )
        rule_trace.append(
            f"MODIFIER-2: Direction = Increasing ({trend_res.change_pct:+.1f}%) and Percentile < 40% -> Upward Pressure Note"
        )
    elif trend_res.direction == "Decreasing" and pct > 60.0:
        reasons.append(
            f"Softening trend: Fares are currently high but have softened by {trend_res.change_pct:+.1f}% over the last 7 days."
        )
        rule_trace.append(
            f"MODIFIER-3: Direction = Decreasing ({trend_res.change_pct:+.1f}%) and Percentile > 60% -> Price Softening Note"
        )

    # 4. Modifier: Volatility Caution
    if volatility_res.category == "Very High":
        caution_flag = True
        reasons.append(
            f"Volatility caution: High dispersion index ({volatility_res.volatility_index:.1f}%) indicates "
            "frequent ticket price swings on this route."
        )
        rule_trace.append(
            f"MODIFIER-4: Volatility = Very High ({volatility_res.volatility_index:.1f}%) -> Caution Flag Raised"
        )

    # 5. Confidence Label
    if window_stats.n >= 60 and volatility_res.category in ["Low", "Moderate"]:
        confidence = "High Statistical Confidence"
    elif window_stats.n >= 30:
        confidence = "Moderate Statistical Confidence"
    else:
        confidence = "Indicative / Limited Sample"
    rule_trace.append(f"CONFIDENCE: Sample size n={window_stats.n}, Volatility={volatility_res.category} -> {confidence}")

    disclaimer = (
        "This explainable signal is a statistical heuristic derived from historical fare percentiles, "
        "interquartile ranges, and route volatility. It is designed to provide price context, not a guaranteed prediction."
    )

    return HeuristicResult(
        signal=signal,
        confidence_label=confidence,
        reasons=reasons,
        rule_trace=rule_trace,
        disclaimer=disclaimer,
        anomaly_flag=anomaly_flag,
        caution_flag=caution_flag,
    )
