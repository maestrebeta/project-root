from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone, date, time
from typing import Union
from app.models.time_entry_models import TimeEntry
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryUpdate
from sqlalchemy.exc import IntegrityError
from app.models.project_models import Project
from app.models.user_models import User
from app.models.organization_models import Organization

def safe_int_convert(value: Union[int, str, None]) -> Union[int, None]:
    """
    Convierte de manera segura un valor a entero.
    
    Args:
        value: Valor a convertir
    
    Returns:
        Valor convertido a entero o None
    """
    if value is None:
        return None
    
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def parse_time(time_str: Union[str, time, None]) -> Union[time, None]:
    """
    Parsea una cadena de tiempo a objeto time.
    
    Args:
        time_str: Cadena de tiempo o objeto time
    
    Returns:
        Objeto time o None
    """
    if time_str is None:
        return None
    
    if isinstance(time_str, time):
        return time_str
    
    try:
        return datetime.strptime(str(time_str), "%H:%M:%S").time()
    except ValueError:
        try:
            return datetime.strptime(str(time_str), "%H:%M").time()
        except ValueError:
            raise ValueError(f"Formato de tiempo inválido: {time_str}")

def create_time_entry(db: Session, entry: TimeEntryCreate):
    """
    Crear una nueva entrada de tiempo con validaciones exhaustivas
    """
    # Validaciones de campos requeridos
    if not entry.user_id:
        raise ValueError("El ID de usuario es obligatorio")
    
    if not entry.project_id:
        raise ValueError("El ID de proyecto es obligatorio")
    
    # Validar que el proyecto exista y pertenezca a la organización
    project = db.query(Project).filter(
        Project.project_id == entry.project_id,
        Project.organization_id == entry.organization_id
    ).first()
    
    if not project:
        raise ValueError("Proyecto no encontrado o no pertenece a la organización")
    
    # Validar que el usuario pertenezca a la organización
    user = db.query(User).filter(
        User.user_id == entry.user_id,
        User.organization_id == entry.organization_id
    ).first()
    
    if not user:
        raise ValueError("Usuario no encontrado o no pertenece a la organización")
    
    # Validar tipos de actividad
    valid_activity_types = ['trabajo', 'reunion', 'capacitacion', 'soporte', 'otro']
    activity_type = entry.activity_type or 'trabajo'
    if activity_type not in valid_activity_types:
        raise ValueError(f"Tipo de actividad inválido. Debe ser uno de: {valid_activity_types}")
    
    # Validar estados
    valid_statuses = ['completado', 'en_progreso', 'pendiente']
    status = entry.status or 'completado'
    if status not in valid_statuses:
        raise ValueError(f"Estado inválido. Debe ser uno de: {valid_statuses}")
    
    # Convertir datos de entrada
    entry_data = entry.dict(exclude_unset=True)
    
    # Eliminar duration_hours si está presente
    entry_data.pop('duration_hours', None)
    
    # Convertir tipos de datos
    entry_data['user_id'] = safe_int_convert(entry_data.get('user_id'))
    entry_data['project_id'] = safe_int_convert(entry_data.get('project_id'))
    entry_data['ticket_id'] = safe_int_convert(entry_data.get('ticket_id'))
    entry_data['organization_id'] = safe_int_convert(entry_data.get('organization_id'))
    
    # Convertir tiempos
    if 'start_time' in entry_data and isinstance(entry_data['start_time'], str):
        entry_data['start_time'] = parse_time(entry_data['start_time'])
    
    if 'end_time' in entry_data and isinstance(entry_data['end_time'], str):
        entry_data['end_time'] = parse_time(entry_data['end_time'])
    
    # Calcular fecha de entrada si no se proporciona
    entry_date = entry.entry_date or date.today()
    
    try:
        # Crear diccionario de datos excluyendo duration_hours
        entry_data = {
            'user_id': entry_data['user_id'],
            'project_id': entry_data['project_id'],
            'entry_date': entry_date,
            'activity_type': activity_type,
            'start_time': entry_data['start_time'],
            'end_time': entry_data['end_time'],
            'description': entry.description,
            'status': status,
            'billable': entry.billable if entry.billable is not None else True,
            'ticket_id': entry_data['ticket_id'],
            'organization_id': entry_data['organization_id']
        }

        # Crear entrada de tiempo
        db_entry = TimeEntry(**entry_data)
        
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Error de integridad al crear entrada de tiempo: {str(e)}")
    except Exception as e:
        db.rollback()
        raise ValueError(f"Error al crear entrada de tiempo: {str(e)}")

def get_time_entries(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TimeEntry).offset(skip).limit(limit).all()

def get_time_entry(db: Session, entry_id: int):
    return db.query(TimeEntry).filter(TimeEntry.entry_id == entry_id).first()

def update_time_entry(db: Session, entry_id: int, entry_data: TimeEntryUpdate):
    db_entry = db.query(TimeEntry).filter(TimeEntry.entry_id == entry_id).first()
    if not db_entry:
        return None
    
    # Actualizar campos de manera segura
    for key, value in entry_data.dict(exclude_unset=True).items():
        if key in ['user_id', 'project_id', 'ticket_id', 'organization_id']:
            setattr(db_entry, key, safe_int_convert(value))
        elif key in ['start_time', 'end_time']:
            setattr(db_entry, key, parse_time(value))
        else:
            setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_time_entry(db: Session, entry_id: int):
    db_entry = db.query(TimeEntry).filter(TimeEntry.entry_id == entry_id).first()
    if not db_entry:
        return False
    
    db.delete(db_entry)
    db.commit()
    return True

def get_time_entries_by_organization(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    """
    Obtener entradas de tiempo de una organización específica
    """
    return (
        db.query(TimeEntry)
        .filter(TimeEntry.organization_id == organization_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_time_entries_by_user(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    filter: str = None
):
    """
    Obtener entradas de tiempo de un usuario con filtros opcionales
    """
    try:
        # Consulta base
        query = db.query(TimeEntry).filter(TimeEntry.user_id == user_id)

        # Filtro por fecha
        if filter == 'today':
            today = datetime.now(timezone.utc).date()
            query = query.filter(func.date(TimeEntry.entry_date) == today)
        elif filter == 'this_week':
            today = datetime.now(timezone.utc).date()
            start_of_week = today - timedelta(days=today.weekday())
            query = query.filter(func.date(TimeEntry.entry_date) >= start_of_week)
        elif filter == 'this_month':
            today = datetime.now(timezone.utc).date()
            start_of_month = today.replace(day=1)
            query = query.filter(func.date(TimeEntry.entry_date) >= start_of_month)

        # Ordenar por fecha de entrada más reciente primero
        query = query.order_by(TimeEntry.entry_date.desc())

        # Aplicar paginación
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        print(f"Error al obtener entradas de tiempo: {str(e)}")
        raise
