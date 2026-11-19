import datetime
import math
from typing import Dict, Any, List
from ..schemas.demand import DemandPredictionRequest, DemandPredictionResponse, CategoryDistribution

# Zone baseline weights
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

def predict_food_demand(request: DemandPredictionRequest) -> DemandPredictionResponse:
    """
    Predict surplus food demand based on city zone, temporal indicators, and historical trends.
    Uses regression/moving average heuristics and statistical adjustments.
    """
    zone_key = request.zone.lower().replace(" ", "_")
    base_meals = ZONE_BASELINES.get(zone_key, 350)

    # Parse date to extract day of week and month
    try:
        target_date = datetime.date.fromisoformat(request.date)
    except Exception:
        target_date = datetime.date.today()

    day_of_week = target_date.weekday() # 0 = Monday, 6 = Sunday

    # Weekend effect: higher demand near community centres on weekends
    weekend_factor = 1.25 if day_of_week in (5, 6) else 1.0

    # Mid-week dip/peak adjustments
    day_adjustments = {
        0: 1.05, # Monday
        1: 0.98, # Tuesday
        2: 0.95, # Wednesday
        3: 1.02, # Thursday
        4: 1.15, # Friday evening rush
        5: 1.25, # Saturday
        6: 1.30  # Sunday
    }
    temporal_multiplier = day_adjustments.get(day_of_week, 1.0)

    # Historical trend regression if supplied
    trend_multiplier = 1.0
    if request.past_trends and len(request.past_trends) > 0:
        total_recent_meals = sum(t.meals for t in request.past_trends)
        avg_recent = total_recent_meals / len(request.past_trends)
        trend_multiplier = avg_recent / base_meals if base_meals > 0 else 1.0
        # Bound trend multiplier between 0.6 and 1.8
        trend_multiplier = max(0.6, min(1.8, trend_multiplier))

    event_multiplier = max(0.5, min(2.5, request.event_multiplier or 1.0))

    final_prediction = int(base_meals * temporal_multiplier * trend_multiplier * event_multiplier)

    # Calculate confidence score based on data availability
    confidence = 0.88 if request.past_trends and len(request.past_trends) >= 7 else 0.76

    # Category distribution
    # On weekends, cooked meals demand is higher; on weekdays packaged rations increase
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
        f"Baseline: {base_meals} meals. Day-of-week factor: {temporal_multiplier:.2f}x. "
        f"Event multiplier: {event_multiplier:.2f}x. "
        f"{'Elevated demand expected due to weekend community distribution.' if day_of_week in (5, 6) else 'Standard weekday baseline active.'}"
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
