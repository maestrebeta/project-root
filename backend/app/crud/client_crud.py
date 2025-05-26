from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.client_models import Client
from app.models.organization_models import Organization
from app.models.country_models import Country
from app.schemas.client_schema import ClientCreate, ClientUpdate


def get_client(db: Session, client_id: int):
    return db.query(Client).filter(Client.client_id == client_id).first()


def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Client).offset(skip).limit(limit).all()


def get_clients_by_organization(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    """
    Obtener clientes de una organización específica
    """
    return (
        db.query(Client)
        .filter(Client.organization_id == organization_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_client(db: Session, client: ClientCreate):
    """
    Crear un cliente, asegurando que tenga un organization_id y validando country_code
    """
    # Verificar que la organización exista
    organization = db.query(Organization).filter(Organization.organization_id == client.organization_id).first()
    if not organization:
        raise ValueError("Organización no encontrada")
    
    # Validar country_code si se proporciona
    if client.country_code:
        country = db.query(Country).filter(Country.country_code == client.country_code).first()
        if not country:
            raise ValueError(f"Código de país inválido: {client.country_code}")
    
    try:
        # Crear el cliente con todos los campos
        db_client = Client(
            name=client.name,
            code=client.code,
            is_active=client.is_active if client.is_active is not None else True,
            organization_id=client.organization_id,
            country_code=client.country_code,
            address=client.address,
            contact_email=client.contact_email,
            contact_phone=client.contact_phone,
            tax_id=client.tax_id
        )
        
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        return db_client
    except IntegrityError as e:
        db.rollback()
        # Manejar errores de integridad (por ejemplo, nombre de cliente duplicado)
        print(f"Error de integridad al crear cliente: {str(e)}")
        raise ValueError("No se pudo crear el cliente. Verifique los datos.")


def update_client(db: Session, client_id: int, updates: ClientUpdate):
    """
    Actualizar un cliente, validando country_code
    """
    try:
        db_client = get_client(db, client_id)
        if not db_client:
            return None
        
        # Validar country_code si se proporciona
        if updates.country_code:
            country = db.query(Country).filter(Country.country_code == updates.country_code).first()
            if not country:
                raise ValueError(f"Código de país inválido: {updates.country_code}")
        
        # Actualizar campos permitidos
        for key, value in updates.dict(exclude_unset=True).items():
            setattr(db_client, key, value)
        
        db.commit()
        db.refresh(db_client)
        return db_client
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al actualizar cliente: {str(e)}")
        raise ValueError("No se pudo actualizar el cliente. Verifique los datos.")


def delete_client(db: Session, client_id: int):
    """
    Eliminar un cliente
    """
    try:
        db_client = get_client(db, client_id)
        if not db_client:
            return None
        
        db.delete(db_client)
        db.commit()
        return db_client
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al eliminar cliente: {str(e)}")
        raise ValueError("No se pudo eliminar el cliente. Verifique las dependencias.")
