from sqlalchemy.orm import Session
from sqlalchemy import select

class OrganizationFilterMixin:
    """
    Mixin para añadir filtrado por organización a consultas CRUD
    """
    @classmethod
    def get_by_organization(cls, db: Session, organization_id: int, skip: int = 0, limit: int = 100):
        """
        Obtener registros filtrados por organización
        """
        return db.query(cls).filter(cls.organization_id == organization_id).offset(skip).limit(limit).all()
    
    @classmethod
    def create_with_organization(cls, db: Session, obj_in, organization_id: int):
        """
        Crear un nuevo registro asociado a una organización
        """
        # Convertir el objeto de entrada a un diccionario
        obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        
        # Añadir el ID de organización
        obj_data['organization_id'] = organization_id
        
        # Crear la instancia
        db_obj = cls(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj 