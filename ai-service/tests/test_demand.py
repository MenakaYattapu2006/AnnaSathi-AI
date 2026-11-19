import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.schemas.demand import DemandPredictionRequest
from app.services.demand_predictor import predict_food_demand

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

if __name__ == "__main__":
    test_demand_prediction_basic()
    test_weekend_multiplier()
    print("All Python demand prediction tests passed!")
