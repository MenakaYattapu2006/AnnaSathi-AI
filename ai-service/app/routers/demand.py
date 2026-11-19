from fastapi import APIRouter, Header, HTTPException, status
import os
from ..schemas.demand import DemandPredictionRequest, DemandPredictionResponse
from ..services.demand_predictor import predict_food_demand

router = APIRouter(prefix="/demand", tags=["Demand Prediction"])

EXPECTED_SECRET = os.getenv("AI_SERVICE_SECRET", "internal-ai-service-shared-secret-key")

@router.post("/predict", response_model=DemandPredictionResponse)
def get_predicted_demand(
    request: DemandPredictionRequest,
    x_ai_secret: str = Header(default="internal-ai-service-shared-secret-key")
):
    """
    Generate hunger prevention and food demand forecast for a city zone.
    Protected with internal shared secret header.
    """
    if x_ai_secret != EXPECTED_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-AI-Secret authorization header"
        )

    return predict_food_demand(request)
