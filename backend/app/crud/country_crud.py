from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.country_models import Country
from app.schemas.country_schema import CountryCreate, CountryUpdate


def get_country(db: Session, country_code: str):
    """
    Obtener un país por su código
    """
    return db.query(Country).filter(Country.country_code == country_code).first()


def get_countries(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    """
    Obtener lista de países, con opción de filtrar solo activos
    """
    query = db.query(Country)
    
    if active_only:
        query = query.filter(Country.is_active == True)
    
    return query.offset(skip).limit(limit).all()


def create_country(db: Session, country: CountryCreate):
    """
    Crear un nuevo país
    """
    try:
        # Verificar si el país ya existe
        existing_country = get_country(db, country.country_code)
        if existing_country:
            raise ValueError(f"El país con código {country.country_code} ya existe")

        # Crear nuevo país
        db_country = Country(**country.dict())
        
        db.add(db_country)
        db.commit()
        db.refresh(db_country)
        return db_country
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al crear país: {str(e)}")
        raise ValueError("No se pudo crear el país. Verifique los datos.")


def update_country(db: Session, country_code: str, updates: CountryUpdate):
    """
    Actualizar un país existente
    """
    try:
        db_country = get_country(db, country_code)
        if not db_country:
            return None
        
        # Actualizar campos permitidos
        for key, value in updates.dict(exclude_unset=True).items():
            setattr(db_country, key, value)
        
        db.commit()
        db.refresh(db_country)
        return db_country
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al actualizar país: {str(e)}")
        raise ValueError("No se pudo actualizar el país. Verifique los datos.")


def delete_country(db: Session, country_code: str):
    """
    Eliminar un país (no recomendado si hay referencias)
    """
    try:
        db_country = get_country(db, country_code)
        if not db_country:
            return None
        
        db.delete(db_country)
        db.commit()
        return db_country
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al eliminar país: {str(e)}")
        raise ValueError("No se pudo eliminar el país. Verifique las dependencias.") 