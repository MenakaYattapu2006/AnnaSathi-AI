from typing import List, Dict, Optional, Any

try:
    from pydantic import BaseModel, Field
except ImportError:
    # Graceful standard library fallback if pydantic is not yet installed
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    def Field(default=None, description=""):
        return default

class PastTrend(BaseModel):
    def __init__(self, date: str = "", meals: int = 0, zone: Optional[str] = None, day_of_week: Optional[int] = None, **kwargs):
        super().__init__(date=date, meals=meals, zone=zone, day_of_week=day_of_week, **kwargs)
        self.date = date
        self.meals = meals
        self.zone = zone
        self.day_of_week = day_of_week

class DemandPredictionRequest(BaseModel):
    def __init__(self, city: str = "Mumbai", zone: str = "Central", date: str = "", past_trends: Optional[List[Any]] = None, event_multiplier: float = 1.0, **kwargs):
        super().__init__(city=city, zone=zone, date=date, past_trends=past_trends, event_multiplier=event_multiplier, **kwargs)
        self.city = city
        self.zone = zone
        self.date = date
        self.past_trends = past_trends
        self.event_multiplier = event_multiplier

class CategoryDistribution(BaseModel):
    def __init__(self, cooked_meals: float = 0.0, packaged_groceries: float = 0.0, fresh_produce: float = 0.0, bakery_dairy: float = 0.0, **kwargs):
        super().__init__(cooked_meals=cooked_meals, packaged_groceries=packaged_groceries, fresh_produce=fresh_produce, bakery_dairy=bakery_dairy, **kwargs)
        self.cooked_meals = cooked_meals
        self.packaged_groceries = packaged_groceries
        self.fresh_produce = fresh_produce
        self.bakery_dairy = bakery_dairy

class DemandPredictionResponse(BaseModel):
    def __init__(self, city: str = "", zone: str = "", date: str = "", predicted_meals: int = 0, confidence_score: float = 0.0,
                 category_distribution: Any = None, peak_demand_windows: List[str] = None, high_priority_flag: bool = False,
                 explanation: str = "", **kwargs):
        super().__init__(
            city=city, zone=zone, date=date, predicted_meals=predicted_meals,
            confidence_score=confidence_score, category_distribution=category_distribution,
            peak_demand_windows=peak_demand_windows or [], high_priority_flag=high_priority_flag,
            explanation=explanation, **kwargs
        )
        self.city = city
        self.zone = zone
        self.date = date
        self.predicted_meals = predicted_meals
        self.confidence_score = confidence_score
        self.category_distribution = category_distribution
        self.peak_demand_windows = peak_demand_windows or []
        self.high_priority_flag = high_priority_flag
        self.explanation = explanation
