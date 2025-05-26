from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from app.core.database import engine, Base
from app.core.init_data import init_data
from sqlalchemy.orm import Session

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Crear instancia de la aplicación
app = FastAPI(title="SmartPlanner API")

# Configuración de CORS más segura
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # Otro puerto común para desarrollo
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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

# Inicializar datos de ejemplo
@app.on_event("startup")
def startup_event():
    db = Session(bind=engine)
    try:
        init_data(db)
    finally:
        db.close()

# Ruta de prueba
@app.get("/")
def read_root():
    return {"message": "Bienvenido a SmartPlanner API"}