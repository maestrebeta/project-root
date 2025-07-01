from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
# from app.schemas import user_schema
from app.schemas.user_schema import UserCreate, UserUpdate, UserOut, ThemePreferences, UserOutSimple
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, get_current_user_organization, validate_organization_subscription
from app.models.user_models import User
from app.models.epic_models import UserStory
from app.models.ticket_models import Ticket
from app.models.time_entry_models import TimeEntry
from app.models.organization_models import Organization
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

def validate_user_role(current_user: User, target_role: str):
    """
    Validar si el usuario actual tiene permiso para crear/modificar usuarios con un rol específico
    """
    # Solo admin y super_user pueden crear/modificar usuarios con roles admin o super_user
    if target_role in ['admin', 'super_user']:
        if current_user.role not in ['admin', 'super_user']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores pueden crear usuarios con rol de administrador o super usuario"
            )

@router.get("/stats", response_model=dict)
def get_users_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    """
    Obtener estadísticas de usuarios de la organización actual
    """
    try:
        organization_id = current_user.organization_id
        
        # Total de usuarios en la organización
        total_users = db.query(func.count(User.user_id)).filter(
            User.organization_id == organization_id
        ).scalar()
        
        # Usuarios activos
        active_users = db.query(func.count(User.user_id)).filter(
            User.organization_id == organization_id,
            User.is_active == True
        ).scalar()
        
        # Usuarios suspendidos/inactivos
        suspended_users = total_users - active_users
        
        # Usuarios creados este mes
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = db.query(func.count(User.user_id)).filter(
            User.organization_id == organization_id,
            User.created_at >= current_month
        ).scalar()
        
        # Usuarios creados el mes pasado para calcular el cambio
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        new_last_month = db.query(func.count(User.user_id)).filter(
            User.organization_id == organization_id,
            User.created_at >= last_month,
            User.created_at < current_month
        ).scalar()
        
        # Calcular cambios
        total_change = new_this_month - new_last_month if new_last_month > 0 else new_this_month
        active_change = max(0, new_this_month)  # Asumimos que los nuevos usuarios están activos
        suspended_change = max(0, suspended_users - (total_users - new_this_month))
        new_change = new_this_month
        
        # Calcular capacidad promedio
        users_with_capacity = db.query(User).filter(
            User.organization_id == organization_id,
            User.is_active == True,
            User.weekly_capacity.isnot(None)
        ).all()
        
        total_capacity = 0
        total_assigned = 0
        
        for user in users_with_capacity:
            # Calcular horas asignadas
            assigned_stories = db.query(UserStory).filter(
                UserStory.assigned_user_id == user.user_id,
                UserStory.status.in_(['backlog', 'in_progress', 'in_review', 'todo'])
            ).all()
            
            assigned_hours = sum([float(story.estimated_hours or 0) for story in assigned_stories])
            weekly_capacity = user.weekly_capacity or 40
            
            total_capacity += weekly_capacity
            total_assigned += assigned_hours
        
        avg_capacity_percentage = (total_assigned / total_capacity * 100) if total_capacity > 0 else 0
        avg_efficiency = 78.5  # Simulado por ahora
        available_capacity = total_capacity - total_assigned
        
        return {
            "total_users": {
                "value": str(total_users),
                "change": f"+{total_change}" if total_change > 0 else str(total_change)
            },
            "active_users": {
                "value": str(active_users),
                "change": f"+{active_change}" if active_change > 0 else str(active_change)
            },
            "avg_capacity": {
                "value": f"{round(avg_capacity_percentage, 1)}%",
                "change": "+2.5%"
            },
            "avg_efficiency": {
                "value": f"{round(avg_efficiency, 1)}%",
                "change": "+1.2%"
            },
            "total_workload": {
                "value": f"{round(total_assigned, 1)}h",
                "change": "+15.5h"
            },
            "available_capacity": {
                "value": f"{round(available_capacity, 1)}h",
                "change": "-8.3h"
            }
        }
    except Exception as e:
        logger.error(f"Error al obtener estadísticas de usuarios: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.get("/capacity-analytics")
async def get_users_capacity_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    """
    Obtener análisis de capacidad y carga de trabajo de usuarios
    """
    try:
        organization_id = current_user.organization_id
        
        # Obtener información de la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )
        
        # Usuarios activos
        active_users = db.query(User).filter(
            and_(
                User.organization_id == organization_id,
                User.is_active == True
            )
        ).all()
        
        if not active_users:
            return {
                "users": [],
                "summary": {
                    "total_users": 0,
                    "avg_capacity": 0,
                    "avg_efficiency": 0,
                    "overloaded_users": 0,
                    "total_worked_hours": 0,
                    "total_assigned_hours": 0
                },
                "workload_by_specialization": {},
                "recommendations": []
            }
        
        users_analytics = []
        workload_summary = {}
        
        # Calcular fechas para análisis temporal
        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        total_worked_hours = 0
        total_assigned_hours = 0
        overloaded_count = 0
        
        for user in active_users:
            try:
                # Calcular horas asignadas desde UserStory (usando import dinámico para evitar errores)
                assigned_hours = 0
                try:
                    from app.models.epic_models import UserStory
                    assigned_hours_result = db.query(func.coalesce(func.sum(UserStory.estimated_hours), 0)).filter(
                        UserStory.assigned_user_id == user.user_id,
                        UserStory.status.in_(['in_progress', 'todo', 'testing'])
                    ).scalar()
                    assigned_hours = float(assigned_hours_result) if assigned_hours_result else 0.0
                except Exception as e:
                    print(f"Error calculando horas asignadas para usuario {user.user_id}: {e}")
                    assigned_hours = 0.0
                
                # Calcular horas trabajadas esta semana desde TimeEntry
                worked_hours = 0
                try:
                    from app.models.time_entry_models import TimeEntry
                    worked_hours_result = db.query(func.coalesce(func.sum(TimeEntry.duration_hours), 0)).filter(
                        TimeEntry.user_id == user.user_id,
                        TimeEntry.entry_date >= week_start
                    ).scalar()
                    worked_hours = float(worked_hours_result) if worked_hours_result else 0.0
                except Exception as e:
                    print(f"Error calculando horas trabajadas para usuario {user.user_id}: {e}")
                    worked_hours = 0.0
                
                # Calcular tickets resueltos este mes
                resolved_tickets = 0
                total_tickets = 0
                try:
                    from app.models.ticket_models import Ticket
                    resolved_tickets = db.query(func.count(Ticket.ticket_id)).filter(
                        Ticket.assigned_to_user_id == user.user_id,
                        Ticket.status == 'cerrado',
                        Ticket.resolved_at >= month_start
                    ).scalar() or 0
                    
                    total_tickets = db.query(func.count(Ticket.ticket_id)).filter(
                        Ticket.assigned_to_user_id == user.user_id
                    ).scalar() or 0
                except Exception as e:
                    print(f"Error calculando tickets para usuario {user.user_id}: {e}")
                    resolved_tickets = 0
                    total_tickets = 0
                
                # Calcular métricas
                weekly_capacity = user.weekly_capacity or 40
                capacity_percentage = min(int((assigned_hours / weekly_capacity) * 100), 100) if weekly_capacity > 0 else 0
                
                # Calcular eficiencia (horas trabajadas vs asignadas)
                efficiency_score = min(int((worked_hours / assigned_hours) * 100), 100) if assigned_hours > 0 else 0
                
                # Determinar si está sobrecargado
                is_overloaded = capacity_percentage > 90
                if is_overloaded:
                    overloaded_count += 1
                
                # Tasa de resolución de tickets
                ticket_resolution_rate = int((resolved_tickets / total_tickets) * 100) if total_tickets > 0 else 0
                
                # Acumular totales
                total_worked_hours += worked_hours
                total_assigned_hours += assigned_hours
                
                # Datos del usuario
                user_data = {
                    "user_id": user.user_id,
                    "username": user.username,
                    "full_name": user.full_name or user.username,
                    "specialization": user.specialization or 'development',
                    "sub_specializations": user.sub_specializations or [],
                    "assigned_hours": round(assigned_hours, 1),
                    "worked_hours": round(worked_hours, 1),
                    "weekly_capacity": weekly_capacity,
                    "capacity_percentage": capacity_percentage,
                    "efficiency_score": efficiency_score,
                    "completed_tasks": 0,  # Placeholder
                    "resolved_tickets": resolved_tickets,
                    "total_tickets": total_tickets,
                    "ticket_resolution_rate": ticket_resolution_rate,
                    "avg_completion_time": "N/A",  # Placeholder
                    "preferred_tasks": ["Tareas Generales"],  # Placeholder
                    "is_overloaded": is_overloaded,
                    "performance_trend": f"{efficiency_score}%"
                }
                
                users_analytics.append(user_data)
                
                # Agrupar por especialización
                spec = user.specialization or 'development'
                if spec not in workload_summary:
                    workload_summary[spec] = {
                        "total_users": 0,
                        "avg_capacity": 0,
                        "total_hours": 0
                    }
                
                workload_summary[spec]["total_users"] += 1
                workload_summary[spec]["total_hours"] += assigned_hours
                
            except Exception as user_error:
                print(f"Error procesando usuario {user.user_id}: {str(user_error)}")
                # Agregar usuario con datos básicos en caso de error
                users_analytics.append({
                    "user_id": user.user_id,
                    "username": user.username,
                    "full_name": user.full_name or user.username,
                    "specialization": user.specialization or 'development',
                    "sub_specializations": user.sub_specializations or [],
                    "assigned_hours": 0,
                    "worked_hours": 0,
                    "weekly_capacity": user.weekly_capacity or 40,
                    "capacity_percentage": 0,
                    "efficiency_score": 0,
                    "completed_tasks": 0,
                    "resolved_tickets": 0,
                    "total_tickets": 0,
                    "ticket_resolution_rate": 0,
                    "avg_completion_time": "N/A",
                    "preferred_tasks": ["Tareas Generales"],
                    "is_overloaded": False,
                    "performance_trend": "0%"
                })
                continue
        
        # Calcular promedios por especialización
        for spec_data in workload_summary.values():
            if spec_data["total_users"] > 0:
                spec_data["avg_capacity"] = round(spec_data["total_hours"] / spec_data["total_users"], 1)
        
        # Resumen global
        total_users = len(users_analytics)
        avg_capacity = round(total_assigned_hours / total_users, 1) if total_users > 0 else 0
        avg_efficiency = round(total_worked_hours / total_assigned_hours * 100, 1) if total_assigned_hours > 0 else 0
        
        response_data = {
            "users": users_analytics,
            "summary": {
                "total_users": total_users,
                "avg_capacity": avg_capacity,
                "avg_efficiency": avg_efficiency,
                "overloaded_users": overloaded_count,
                "total_worked_hours": round(total_worked_hours, 1),
                "total_assigned_hours": round(total_assigned_hours, 1)
            },
            "workload_by_specialization": workload_summary,
            "recommendations": [
                {
                    "type": "capacity",
                    "title": "Optimización de Capacidad",
                    "description": f"Se detectaron {overloaded_count} usuarios sobrecargados" if overloaded_count > 0 else "Capacidad del equipo en niveles óptimos",
                    "priority": "high" if overloaded_count > 5 else "medium" if overloaded_count > 0 else "low"
                }
            ]
        }
        
        return response_data
        
    except Exception as e:
        print(f"Error en capacity-analytics: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Devolver respuesta básica en caso de error
        return {
            "users": [],
            "summary": {
                "total_users": 0,
                "avg_capacity": 0,
                "avg_efficiency": 0,
                "overloaded_users": 0,
                "total_worked_hours": 0,
                "total_assigned_hours": 0
            },
            "workload_by_specialization": {},
            "recommendations": [
                {
                    "type": "error",
                    "title": "Error en análisis",
                    "description": "No se pudieron cargar los datos de capacidad",
                    "priority": "high"
                }
            ]
        }

@router.get("/test", response_model=List[dict])
def test_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    """Endpoint de prueba para verificar serialización"""
    try:
        # Construir la consulta base
        query = db.query(User).options(joinedload(User.organization))
        
        # SIEMPRE filtrar por organización actual, sin excepción
        query = query.filter(User.organization_id == current_user.organization_id)
        logger.info(f"Filtrando usuarios por organización {current_user.organization_id}")
        
        # Aplicar paginación
        users = query.offset(0).limit(10).all()
        
        # Convertir a diccionarios simples
        result = []
        for user in users:
            user_dict = {
                "user_id": user.user_id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "organization_id": user.organization_id,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                "organization": {
                    "organization_id": user.organization.organization_id,
                    "name": user.organization.name
                } if user.organization else None
            }
            result.append(user_dict)
        
        logger.info(f"Test endpoint: {len(result)} usuarios serializados correctamente")
        return result
    
    except Exception as e:
        logger.error(f"Error en test endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("", response_model=List[UserOutSimple])
def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    logger.info(f"Usuario {current_user.username} (rol: {current_user.role}) solicitando lista de usuarios")
    
    try:
        organization_id = current_user.organization_id
        
        # Construir la consulta base sin cargar organization temporalmente
        query = db.query(User)
        
        # SIEMPRE filtrar por organización actual, sin excepción
        query = query.filter(User.organization_id == organization_id)
        logger.info(f"Filtrando usuarios por organización: {organization_id}")
        
        # Aplicar filtros
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.username.ilike(search_term),
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        # Aplicar paginación
        users = query.offset(skip).limit(limit).all()
        
        logger.info(f"Total de usuarios encontrados: {len(users)}")
        
        # Log de cada usuario encontrado
        for user in users:
            logger.info(f"Usuario: {user.username}, Org ID: {user.organization_id}, Rol: {user.role}")
        
        logger.info(f"Total de usuarios devueltos: {len(users)}")
        
        return users
        
    except Exception as e:
        logger.error(f"Error en get_users: {str(e)}")
        logger.error(f"Tipo de error: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    logger.info(f"Usuario {current_user.username} solicitando detalles del usuario {user_id}")
    
    try:
        # Cargar el usuario con todas las relaciones necesarias
        user = (
            db.query(User)
            .options(joinedload(User.organization))
            .filter(User.user_id == user_id)
            .first()
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        logger.info(f"Usuario encontrado: {user.username}, Rol: {user.role}, Org: {user.organization_id}")
        logger.info(f"Datos completos del usuario: {user.__dict__}")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener usuario {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("", response_model=UserOut)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    # Validar rol del usuario
    validate_user_role(current_user, user.role)
    
    logger.info(f"Usuario {current_user.username} intentando crear nuevo usuario")
    logger.info(f"Datos de especialización recibidos: specialization={user.specialization}, sub_specializations={user.sub_specializations}, hourly_rate={user.hourly_rate}, weekly_capacity={user.weekly_capacity}")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username ya registrado")
    
    hashed_password = get_password_hash(user.password)
    theme_prefs = user.theme_preferences.dict() if user.theme_preferences else None
    
    # Asignar la organización del usuario actual si no se proporciona
    organization_id = user.organization_id or current_user.organization_id
    
    logger.info(f"Creando usuario con organization_id: {organization_id}")
    
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=hashed_password,
        role=user.role,
        is_active=user.is_active,
        profile_image=user.profile_image,
        theme_preferences=theme_prefs,
        organization_id=organization_id,  # Usar la organización del usuario actual
        # Campos de especialización
        specialization=user.specialization,
        sub_specializations=user.sub_specializations,
        hourly_rate=user.hourly_rate,
        weekly_capacity=user.weekly_capacity,
        skills=user.skills
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"Usuario {user.username} creado exitosamente")
    logger.info(f"Datos de especialización guardados: specialization={db_user.specialization}, sub_specializations={db_user.sub_specializations}, hourly_rate={db_user.hourly_rate}, weekly_capacity={db_user.weekly_capacity}")
    return db_user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    # Si se está cambiando el rol, validar permisos
    if user.role:
        validate_user_role(current_user, user.role)
    
    try:
        logger.info(f"Usuario {current_user.username} intentando actualizar usuario {user_id}")
        logger.info(f"Datos recibidos para actualización: {user.dict(exclude_unset=True)}")
        
        db_user = db.query(User).filter(User.user_id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Actualizar campos si están presentes en la solicitud
        if user.email is not None:
            existing_user = db.query(User).filter(User.email == user.email).first()
            if existing_user and existing_user.user_id != user_id:
                raise HTTPException(status_code=400, detail="Email ya registrado")
            db_user.email = user.email
        
        if user.full_name is not None:
            db_user.full_name = user.full_name
        
        if user.role is not None:
            db_user.role = user.role
        
        if user.is_active is not None:
            db_user.is_active = user.is_active
        
        if user.password is not None:
            db_user.password_hash = get_password_hash(user.password)
        
        if user.profile_image is not None:
            db_user.profile_image = user.profile_image
        
        if user.theme_preferences is not None:
            # Convertir ThemePreferences a diccionario
            theme_prefs = user.theme_preferences.dict()
            db_user.theme_preferences = theme_prefs
        
        if user.organization_id is not None:
            db_user.organization_id = user.organization_id
            logger.info(f"Actualizando organization_id a: {user.organization_id}")
        
        # Nuevos campos de especialización
        if user.specialization is not None:
            db_user.specialization = user.specialization
            logger.info(f"Actualizando specialization a: {user.specialization}")
        
        if user.sub_specializations is not None:
            db_user.sub_specializations = user.sub_specializations
            logger.info(f"Actualizando sub_specializations a: {user.sub_specializations}")
        
        if user.hourly_rate is not None:
            db_user.hourly_rate = user.hourly_rate
            logger.info(f"Actualizando hourly_rate a: {user.hourly_rate}")
        
        if user.weekly_capacity is not None:
            db_user.weekly_capacity = user.weekly_capacity
            logger.info(f"Actualizando weekly_capacity a: {user.weekly_capacity}")
        
        if user.skills is not None:
            db_user.skills = user.skills
            logger.info(f"Actualizando skills a: {user.skills}")
        
        # Campos adicionales
        if user.country_code is not None:
            db_user.country_code = user.country_code
        
        if user.timezone is not None:
            db_user.timezone = user.timezone
        
        if user.language is not None:
            db_user.language = user.language
        
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"Usuario {user_id} actualizado exitosamente por {current_user.username}")
        logger.info(f"Datos finales del usuario: {db_user.__dict__}")
        
        return db_user
    except Exception as e:
        logger.error(f"Error actualizando usuario {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando usuario: {str(e)}"
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    logger.info(f"Usuario {current_user.username} intentando eliminar usuario {user_id}")
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_user)
    db.commit()
    logger.info(f"Usuario {user_id} eliminado exitosamente por {current_user.username}")
    return None

@router.patch("/{user_id}/theme", response_model=UserOut)
def update_user_theme(
    user_id: int,
    theme_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(validate_organization_subscription)
):
    try:
        logger.info(f"Usuario {current_user.username} actualizando tema para usuario {user_id}")
        db_user = db.query(User).filter(User.user_id == user_id).first()
        
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que el usuario actual es el mismo que se está actualizando o es administrador
        if current_user.user_id != user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar este usuario"
            )
        
        # Actualizar solo las preferencias de tema
        if "theme_preferences" in theme_data:
            theme_prefs = theme_data["theme_preferences"]
            
            # Validar que los campos requeridos estén presentes
            required_fields = ["primary_color", "font_class", "font_size_class", "animations_enabled"]
            if not all(field in theme_prefs for field in required_fields):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Faltan campos requeridos en theme_preferences"
                )
            
            # Actualizar el tema en la base de datos
            db_user.theme_preferences = theme_prefs
            
            db.commit()
            db.refresh(db_user)
            logger.info(f"Tema actualizado exitosamente para usuario {user_id}")
            return db_user
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionaron preferencias de tema"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando tema para usuario {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando tema: {str(e)}"
        )
