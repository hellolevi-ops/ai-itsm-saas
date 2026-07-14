from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.auth_router import router as auth_router
from src.api.workspace_router import router as workspace_router

app = FastAPI(
    title="灵犀服务台 API",
    description="AI ITSM SaaS - Lingxi Service Desk API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
    )

app.include_router(auth_router)
app.include_router(workspace_router)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "lingxi-service-desk"}