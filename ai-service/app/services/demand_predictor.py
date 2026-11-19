import datetime
import math
from typing import Dict, Any, List, Optional
from ..schemas.demand import DemandPredictionRequest, DemandPredictionResponse, CategoryDistribution

# Regional baseline meal capacities per zone
ZONE_BASELINES = {
    "central": 450,
    "north": 320,
    "south": 380,
    "east": 290,
    "west": 410,
    "slum_cluster_a": 650,
    "slum_cluster_b": 580,
    "industrial_area": 300
}

def get_season_factor(month: int) -> float:
    """
    Seasonal demand adjustments for India regional climate & hunger cycles:
    - Monsoon (June - September): Transport disruption, elevated shelter demand (1.15x)
    - Festival & Wedding season (October - December): Surge in banquet surplus & community feeds (1.20x)
    - Peak Summer (April - May): Higher perishable spoilage, hydration & ration focus (1.05x)
    - Winter (January - February): Night shelter hot dinner dependence (1.10x)
    """
    if month in (6, 7, 8, 9):
        return 1.15
    elif month in (10, 11, 12):
        return 1.20
    elif month in (1, 2):
        return 1.10
    return 1.05

def predict_food_demand(request: DemandPredictionRequest) -> DemandPredictionResponse:
    """
    Predict surplus food demand based on city zone, temporal indicators, seasonal cycles,
    and historical trends. Distinguishes statistical baselines from empirical trend regressions.
    """
    zone_key = request.zone.lower().replace(" ", "_")
    base_meals = ZONE_BASELINES.get(zone_key, 350)

    # Parse date to extract day of week and month
    try:
        target_date = datetime.date.fromisoformat(request.date)
    except Exception:
        target_date = datetime.date.today()

    day_of_week = target_date.weekday()  # 0 = Monday, 6 = Sunday
    month = target_date.month

    # Seasonal adjustment
    seasonal_multiplier = get_season_factor(month)

    # Day-of-week adjustments
    day_adjustments = {
        0: 1.05,  # Monday
        1: 0.98,  # Tuesday
        2: 0.95,  # Wednesday
        3: 1.02,  # Thursday
        4: 1.15,  # Friday evening rush
        5: 1.25,  # Saturday
        6: 1.30   # Sunday
    }
    temporal_multiplier = day_adjustments.get(day_of_week, 1.0)

    # Historical trend analysis & Data Sufficiency verification
    trend_multiplier = 1.0
    data_sufficiency = "INSUFFICIENT_HISTORICAL_DATA"
    historical_samples_count = 0

    if request.past_trends and len(request.past_trends) > 0:
        historical_samples_count = len(request.past_trends)
        total_recent_meals = sum(getattr(t, 'meals', 0) if hasattr(t, 'meals') else (t.get('meals', 0) if isinstance(t, dict) else 0) for t in request.past_trends)
        if historical_samples_count >= 7:
            data_sufficiency = "SUFFICIENT_HISTORICAL_DATA"
            avg_recent = total_recent_meals / historical_samples_count
            trend_multiplier = avg_recent / base_meals if base_meals > 0 else 1.0
            # Bound trend multiplier between 0.65 and 1.75
            trend_multiplier = max(0.65, min(1.75, trend_multiplier))
        elif historical_samples_count >= 3:
            data_sufficiency = "MODERATE_HISTORICAL_DATA"
            avg_recent = total_recent_meals / historical_samples_count
            raw_multiplier = avg_recent / base_meals if base_meals > 0 else 1.0
            # Dampen trend toward baseline when sample is small
            trend_multiplier = 0.5 + 0.5 * max(0.7, min(1.5, raw_multiplier))
        else:
            data_sufficiency = "INSUFFICIENT_HISTORICAL_DATA"

    event_multiplier = max(0.5, min(2.5, request.event_multiplier or 1.0))

    final_prediction = int(base_meals * temporal_multiplier * seasonal_multiplier * trend_multiplier * event_multiplier)

    # Confidence score explicitly tied to data sufficiency
    if data_sufficiency == "SUFFICIENT_HISTORICAL_DATA":
        confidence = 0.86
        estimation_type = "trend_adjusted_regression"
    elif data_sufficiency == "MODERATE_HISTORICAL_DATA":
        confidence = 0.74
        estimation_type = "damped_moving_average"
    else:
        confidence = 0.65
        estimation_type = "regional_statistical_baseline"

    # Category distribution
    if day_of_week in (5, 6):
        cat_dist = CategoryDistribution(
            cooked_meals=55.0,
            packaged_groceries=20.0,
            fresh_produce=15.0,
            bakery_dairy=10.0
        )
    else:
        cat_dist = CategoryDistribution(
            cooked_meals=40.0,
            packaged_groceries=30.0,
            fresh_produce=20.0,
            bakery_dairy=10.0
        )

    peak_windows = [
        "12:30 PM - 02:30 PM (Lunch distribution)",
        "07:30 PM - 09:30 PM (Dinner & evening community kitchen)"
    ]

    is_high_priority = final_prediction >= 500

    explanation = (
        f"Demand predicted for {request.zone}, {request.city} on {target_date.strftime('%A, %B %d, %Y')}. "
        f"Baseline: {base_meals} meals. Day: {temporal_multiplier:.2f}x. Season: {seasonal_multiplier:.2f}x. "
        f"Trend factor: {trend_multiplier:.2f}x ({data_sufficiency.replace('_', ' ').title()}). "
        f"Estimation type: {estimation_type}."
    )

    return DemandPredictionResponse(
        city=request.city,
        zone=request.zone,
        date=request.date,
        predicted_meals=final_prediction,
        confidence_score=confidence,
        category_distribution=cat_dist,
        peak_demand_windows=peak_windows,
        high_priority_flag=is_high_priority,
        explanation=explanation
    )
