import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.schemas.demand import DemandPredictionRequest, PastTrend
from app.services.demand_predictor import predict_food_demand, get_season_factor

def test_demand_prediction_basic():
    req = DemandPredictionRequest(
        city="Mumbai",
        zone="Central",
        date="2026-11-20"
    )
    res = predict_food_demand(req)
    assert res.city == "Mumbai"
    assert res.zone == "Central"
    assert res.predicted_meals > 0
    assert 0.0 <= res.confidence_score <= 1.0
    assert len(res.peak_demand_windows) > 0
    assert res.category_distribution.cooked_meals > 0
    print(f"Test passed: Predicted {res.predicted_meals} meals for {res.zone}, {res.city}")

def test_weekend_multiplier():
    # 2026-11-21 is Saturday
    saturday_req = DemandPredictionRequest(
        city="Mumbai",
        zone="Central",
        date="2026-11-21"
    )
    # 2026-11-18 is Wednesday
    wednesday_req = DemandPredictionRequest(
        city="Mumbai",
        zone="Central",
        date="2026-11-18"
    )
    sat_res = predict_food_demand(saturday_req)
    wed_res = predict_food_demand(wednesday_req)
    assert sat_res.predicted_meals > wed_res.predicted_meals
    print("Test passed: Weekend demand adjustment verified")

def test_historical_trends_sufficiency():
    # Test with sufficient past trends (>= 7 days)
    trends = [
        PastTrend(date=f"2026-11-0{i}", meals=520) for i in range(1, 8)
    ]
    req_with_trends = DemandPredictionRequest(
        city="Mumbai",
        zone="Central",
        date="2026-11-20",
        past_trends=trends
    )
    res_with_trends = predict_food_demand(req_with_trends)
    assert res_with_trends.confidence_score >= 0.85
    assert "Sufficient Historical Data" in res_with_trends.explanation
    print("Test passed: Historical trend sufficiency calculation verified")

def test_season_factor():
    assert get_season_factor(11) == 1.20  # November Festive
    assert get_season_factor(7) == 1.15   # July Monsoon
    print("Test passed: Seasonal factor verified")

if __name__ == "__main__":
    test_demand_prediction_basic()
    test_weekend_multiplier()
    test_historical_trends_sufficiency()
    test_season_factor()
    print("All Python demand prediction tests passed successfully!")
