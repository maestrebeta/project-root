from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.country_schema import CountryOut, CountryCreate, CountryUpdate
from app.crud import country_crud
from app.core.security import get_current_user  # Ajusta según tu configuración de autenticación

router = APIRouter(prefix="/countries", tags=["Countries"])

@router.get("/", response_model=List[CountryOut])
def read_countries(
    skip: int = 0, 
    limit: int = 100, 
    active_only: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Opcional: autenticación
):
    """
    Obtener lista de países
    - `skip`: Número de registros a omitir
    - `limit`: Número máximo de registros a devolver
    - `active_only`: Filtrar solo países activos
    """
    try:
        # Si active_only no se especifica, devolverá todos los países
        return country_crud.get_countries(db, skip=skip, limit=limit, active_only=active_only)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al obtener países: {str(e)}"
        )

@router.get("/{country_code}", response_model=CountryOut)
def read_country(
    country_code: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Opcional: autenticación
):
    """
    Obtener un país por su código
    """
    db_country = country_crud.get_country(db, country_code)
    
    if not db_country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"País con código {country_code} no encontrado"
        )
    
    return db_country

@router.post("/", response_model=CountryOut, status_code=status.HTTP_201_CREATED)
def create_country(
    country: CountryCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Opcional: autenticación
):
    """
    Crear un nuevo país
    """
    try:
        return country_crud.create_country(db, country)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )

@router.put("/{country_code}", response_model=CountryOut)
def update_country(
    country_code: str, 
    country: CountryUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Opcional: autenticación
):
    """
    Actualizar un país existente
    """
    try:
        updated_country = country_crud.update_country(db, country_code, country)
        
        if not updated_country:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"País con código {country_code} no encontrado"
            )
        
        return updated_country
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )

@router.delete("/{country_code}", response_model=CountryOut)
def delete_country(
    country_code: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Opcional: autenticación
):
    """
    Eliminar un país
    """
    try:
        deleted_country = country_crud.delete_country(db, country_code)
        
        if not deleted_country:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"País con código {country_code} no encontrado"
            )
        
        return deleted_country
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        ) 