from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.notification_models import Notification, NotificationStatus, NotificationType, NotificationPriority
from app.schemas.notification_schema import NotificationCreate, NotificationUpdate, NotificationStats
from typing import List, Optional
from datetime import datetime, timezone

def create_notification(db: Session, notification: NotificationCreate) -> Notification:
    """Crear una nueva notificación"""
    db_notification = Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_user_notifications(
    db: Session, 
    user_id: int, 
    organization_id: int,
    skip: int = 0, 
    limit: int = 50,
    status: Optional[NotificationStatus] = None,
    notification_type: Optional[NotificationType] = None
) -> List[Notification]:
    """Obtener notificaciones de un usuario"""
    query = db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status != NotificationStatus.DELETED
        )
    )
    
    if status:
        query = query.filter(Notification.status == status)
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def get_notification(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Obtener una notificación específica"""
    return db.query(Notification).filter(
        Notification.notification_id == notification_id,
        Notification.recipient_user_id == user_id
    ).first()

def update_notification(db: Session, notification_id: int, user_id: int, notification: NotificationUpdate) -> Optional[Notification]:
    """Actualizar una notificación"""
    db_notification = get_notification(db, notification_id, user_id)
    if not db_notification:
        return None
    
    update_data = notification.dict(exclude_unset=True)
    
    # Si se marca como leída, establecer read_at
    if update_data.get('status') == NotificationStatus.READ and not db_notification.read_at:
        update_data['read_at'] = datetime.now(timezone.utc)
    
    for key, value in update_data.items():
        setattr(db_notification, key, value)
    
    db.commit()
    db.refresh(db_notification)
    return db_notification

def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Marcar una notificación como leída"""
    return update_notification(db, notification_id, user_id, NotificationUpdate(
        status=NotificationStatus.READ,
        read_at=datetime.now(timezone.utc)
    ))

def mark_all_notifications_as_read(db: Session, user_id: int, organization_id: int) -> int:
    """Marcar todas las notificaciones de un usuario como leídas"""
    result = db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status == NotificationStatus.UNREAD
        )
    ).update({
        'status': NotificationStatus.READ,
        'read_at': datetime.now(timezone.utc)
    })
    
    db.commit()
    return result

def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Eliminar una notificación (marcar como eliminada)"""
    db_notification = get_notification(db, notification_id, user_id)
    if not db_notification:
        return False
    
    db_notification.status = NotificationStatus.DELETED
    db.commit()
    return True

def get_notification_stats(db: Session, user_id: int, organization_id: int) -> NotificationStats:
    """Obtener estadísticas de notificaciones del usuario"""
    # Total de notificaciones
    total = db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status != NotificationStatus.DELETED
        )
    ).count()
    
    # Notificaciones no leídas
    unread = db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status == NotificationStatus.UNREAD
        )
    ).count()
    
    # Notificaciones leídas
    read = db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status == NotificationStatus.READ
        )
    ).count()
    
    # Notificaciones eliminadas
    deleted = db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status == NotificationStatus.DELETED
        )
    ).count()
    
    # Por tipo
    by_type = {}
    type_counts = db.query(
        Notification.type,
        func.count(Notification.notification_id)
    ).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status != NotificationStatus.DELETED
        )
    ).group_by(Notification.type).all()
    
    for notification_type, count in type_counts:
        by_type[notification_type] = count
    
    # Por prioridad
    by_priority = {}
    priority_counts = db.query(
        Notification.priority,
        func.count(Notification.notification_id)
    ).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status != NotificationStatus.DELETED
        )
    ).group_by(Notification.priority).all()
    
    for priority, count in priority_counts:
        by_priority[priority] = count
    
    return NotificationStats(
        total=total,
        unread=unread,
        read=read,
        deleted=deleted,
        by_type=by_type,
        by_priority=by_priority
    )

def create_ticket_assignment_notification(
    db: Session,
    ticket_id: int,
    assigned_user_id: int,
    assigned_by_user_id: int,
    organization_id: int,
    ticket_title: str,
    ticket_number: str
) -> Notification:
    """Crear notificación de asignación de ticket"""
    notification_data = NotificationCreate(
        type=NotificationType.TICKET_ASSIGNED,
        title=f"Ticket asignado: {ticket_number}",
        message=f"Te han asignado el ticket '{ticket_title}' ({ticket_number})",
        priority=NotificationPriority.MEDIUM,
        recipient_user_id=assigned_user_id,
        sender_user_id=assigned_by_user_id,
        organization_id=organization_id,
        ticket_id=ticket_id,
        notification_metadata={
            "ticket_title": ticket_title,
            "ticket_number": ticket_number,
            "action": "assigned"
        }
    )
    
    result = create_notification(db, notification_data)
    
    return result

def create_task_assignment_notification(
    db: Session,
    task_id: int,
    assigned_user_id: int,
    assigned_by_user_id: int,
    organization_id: int,
    task_title: str
) -> Notification:
    """Crear notificación de asignación de tarea"""
    notification_data = NotificationCreate(
        type=NotificationType.TASK_ASSIGNED,
        title=f"Tarea asignada: {task_title}",
        message=f"Te han asignado la tarea '{task_title}'",
        priority=NotificationPriority.MEDIUM,
        recipient_user_id=assigned_user_id,
        sender_user_id=assigned_by_user_id,
        organization_id=organization_id,
        task_id=task_id,
        notification_metadata={
            "task_title": task_title,
            "action": "assigned"
        }
    )
    
    result = create_notification(db, notification_data)
    
    return result

def create_user_story_assignment_notification(
    db: Session,
    user_story_id: int,
    assigned_user_id: int,
    assigned_by_user_id: int,
    organization_id: int,
    user_story_title: str
) -> Notification:
    """Crear notificación de asignación de historia de usuario"""
    notification_data = NotificationCreate(
        type=NotificationType.USER_STORY_ASSIGNED,
        title=f"Historia de usuario asignada: {user_story_title}",
        message=f"Te han asignado la historia de usuario '{user_story_title}'",
        priority=NotificationPriority.MEDIUM,
        recipient_user_id=assigned_user_id,
        sender_user_id=assigned_by_user_id,
        organization_id=organization_id,
        user_story_id=user_story_id,
        notification_metadata={
            "user_story_title": user_story_title,
            "action": "assigned"
        }
    )
    
    result = create_notification(db, notification_data)
    
    return result

def get_unread_count(db: Session, user_id: int, organization_id: int) -> int:
    """Obtener el número de notificaciones no leídas"""
    return db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status == NotificationStatus.UNREAD
        )
    ).count()

def get_latest_notification(db: Session, user_id: int, organization_id: int) -> Optional[Notification]:
    """Obtener la notificación más reciente del usuario"""
    return db.query(Notification).filter(
        Notification.recipient_user_id == user_id,
        Notification.organization_id == organization_id
    ).order_by(Notification.created_at.desc()).first()

def get_new_notifications_count(db: Session, user_id: int, organization_id: int) -> int:
    """Obtener el número de notificaciones nuevas (últimas 24 horas)"""
    from datetime import timedelta
    
    # Calcular la fecha de hace 24 horas
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    
    return db.query(Notification).filter(
        and_(
            Notification.recipient_user_id == user_id,
            Notification.organization_id == organization_id,
            Notification.status == NotificationStatus.UNREAD,
            Notification.created_at >= twenty_four_hours_ago
        )
    ).count() 