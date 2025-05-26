from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from app.routers import (
    auth_router, 
    user_router, 
    project_router, 
    organization_router, 
    client_router, 
    time_entry_router, 
    ticket_router,
    country_router
)
from app.core.database import engine, Base, SessionLocal
from app.core.init_data import init_data
from sqlalchemy.orm import Session
import alembic.config
import os

def run_migrations():
    """Ejecuta las migraciones de Alembic"""
    alembic_cfg = alembic.config.Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "alembic")
    alembic.command.upgrade(alembic_cfg, "head")

# Ejecutar migraciones al inicio
run_migrations()

# Crear instancia de la aplicación
app = FastAPI(title="SmartPlanner API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["*"],
    max_age=600,
)

# Manejador de errores personalizado
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true"
        }
    )

# Middleware para manejar errores de CORS
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    try:
        response = await call_next(request)
        
        # Asegurar que los headers de CORS estén presentes incluso en errores
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        if request.method == "OPTIONS":
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
            response.headers["Access-Control-Max-Age"] = "600"
        
        return response
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)},
            headers={
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true"
            }
        )

# Incluir routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(project_router.router)
app.include_router(organization_router.router)
app.include_router(client_router.router)
app.include_router(time_entry_router.router)
app.include_router(ticket_router.router)
app.include_router(country_router.router)

# Inicializar datos al arrancar
@app.on_event("startup")
async def init_app_data():
    db = SessionLocal()
    try:
        init_data(db)
    finally:
        db.close()

# Ruta de prueba
@app.get("/")
def read_root():
    return {"message": "Bienvenido a SmartPlanner API"}