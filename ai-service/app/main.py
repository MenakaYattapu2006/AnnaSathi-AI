import os
import json
import sys

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
    from .routers.demand import router as demand_router

    app = FastAPI(
        title="AnnaSathi AI - Demand Prediction Microservice",
        description="Python FastAPI service providing predictive analytics for hunger prevention and surplus redistribution.",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["Health"])
    def health_check():
        return {
            "status": "healthy",
            "service": "AnnaSathi AI Demand Prediction Service",
            "version": "1.0.0"
        }

    app.include_router(demand_router, prefix="/ai")

    def run_server():
        port = int(os.getenv("PORT", 8000))
        host = os.getenv("HOST", "0.0.0.0")
        uvicorn.run(app, host=host, port=port)

except ImportError:
    # Standard library HTTP server fallback when fastapi/uvicorn are not yet pip installed
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from .schemas.demand import DemandPredictionRequest
    from .services.demand_predictor import predict_food_demand

    class StandaloneHandler(BaseHTTPRequestHandler):
        def _set_headers(self, status=200):
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()

        def do_OPTIONS(self):
            self._set_headers(200)

        def do_GET(self):
            if self.path == '/health' or self.path == '/ai/health':
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "status": "healthy",
                    "service": "AnnaSathi AI Demand Prediction Service (Builtin)",
                    "version": "1.0.0"
                }).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"detail": "Not Found"}).encode('utf-8'))

        def do_POST(self):
            if self.path == '/ai/demand/predict' or self.path == '/demand/predict':
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                try:
                    data = json.loads(body) if body else {}
                except Exception:
                    data = {}

                req = DemandPredictionRequest(
                    city=data.get('city', 'Mumbai'),
                    zone=data.get('zone', 'Central'),
                    date=data.get('date', '2026-11-20'),
                    past_trends=data.get('past_trends'),
                    event_multiplier=data.get('event_multiplier', 1.0)
                )
                res = predict_food_demand(req)
                self._set_headers(200)
                self.wfile.write(json.dumps(res.__dict__, default=lambda o: o.__dict__).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"detail": "Not Found"}).encode('utf-8'))

    def run_server():
        port = int(os.getenv("PORT", 8000))
        server_address = ('0.0.0.0', port)
        httpd = HTTPServer(server_address, StandaloneHandler)
        print(f"AnnaSathi AI Standalone AI Service listening on port {port}")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
