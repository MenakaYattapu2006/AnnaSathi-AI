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
    def Field(default=None, default_factory=None, description=""):
        if default_factory is not None:
            return default_factory()
        return default

class PastTrend(BaseModel):
    date: str = ""
    meals: int = 0
    zone: Optional[str] = None
    day_of_week: Optional[int] = None

class DemandPredictionRequest(BaseModel):
    city: str = "Mumbai"
    zone: str = "Central"
    date: str = ""
    past_trends: Optional[List[PastTrend]] = None
    event_multiplier: float = 1.0

class CategoryDistribution(BaseModel):
    cooked_meals: float = 0.0
    packaged_groceries: float = 0.0
    fresh_produce: float = 0.0
    bakery_dairy: float = 0.0

class DemandPredictionResponse(BaseModel):
    city: str = ""
    zone: str = ""
    date: str = ""
    predicted_meals: int = 0
    confidence_score: float = 0.0
    category_distribution: Optional[CategoryDistribution] = None
    peak_demand_windows: List[str] = Field(default_factory=list)
    high_priority_flag: bool = False
    explanation: str = ""
