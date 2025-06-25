import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Configuración de la base de datos
    DATABASE_URL: str = "sqlite:///./smartplanner.db"
    
    # Configuración de JWT
    SECRET_KEY: str = "tu_clave_secreta_aqui_cambiala_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Configuración del servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    # Configuración de CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Configuración de archivos
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Configuración de email (opcional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Configuración de logging
    LOG_LEVEL: str = "INFO"
    
    # Configuración de JIRA (opcional - para evitar errores si están en .env)
    JIRA_CLIENT_ID: Optional[str] = None
    JIRA_CLIENT_SECRET: Optional[str] = None
    JIRA_REDIRECT_URI: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        # Permitir campos extra para evitar errores con variables no definidas
        extra = "ignore"

# Crear instancia global de configuración
settings = Settings()
