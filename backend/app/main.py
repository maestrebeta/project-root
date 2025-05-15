from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.routers import project_router, client_router, user_router, ticket_router, time_entry_router # Agrega otros routers aquí

# Crear todas las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Gestión de Proyectos")

# Configurar los orígenes permitidos (CORS)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(project_router.router)
app.include_router(client_router.router)
app.include_router(user_router.router)
app.include_router(ticket_router.router)
app.include_router(time_entry_router.router)
