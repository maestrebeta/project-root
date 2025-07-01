from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User
from app.models.notification_models import NotificationStatus, NotificationType, NotificationPriority, Notification
from app.schemas.notification_schema import (
    NotificationOut, 
    NotificationUpdate, 
    NotificationStats,
    NotificationBulkUpdate,
    NotificationCreate
)
from app.crud import notification_crud

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)

@router.get("/", response_model=List[NotificationOut])
def get_user_notifications(
    skip: int = 0,
    limit: int = 50,
    status: NotificationStatus = None,
    notification_type: NotificationType = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener notificaciones del usuario actual"""
    notifications = notification_crud.get_user_notifications(
        db=db,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        skip=skip,
        limit=limit,
        status=status,
        notification_type=notification_type
    )
    
    # Enriquecer con información adicional
    enriched_notifications = []
    for notification in notifications:
        notification_data = {
            "notification_id": notification.notification_id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "priority": notification.priority,
            "ticket_id": notification.ticket_id,
            "task_id": notification.task_id,
            "project_id": notification.project_id,
            "notification_metadata": notification.notification_metadata,
            "recipient_user_id": notification.recipient_user_id,
            "sender_user_id": notification.sender_user_id,
            "organization_id": notification.organization_id,
            "status": notification.status,
            "read_at": notification.read_at,
            "created_at": notification.created_at,
            "updated_at": notification.updated_at,
            "sender_name": None,
            "sender_email": None,
            "ticket_title": None,
            "ticket_number": None,
            "task_title": None,
            "project_name": None
        }
        
        # Agregar información del remitente
        if notification.sender_user_id:
            sender = db.query(User).filter(User.user_id == notification.sender_user_id).first()
            if sender:
                notification_data["sender_name"] = sender.full_name
                notification_data["sender_email"] = sender.email
        
        # Agregar información del ticket
        if notification.ticket_id and notification.notification_metadata:
            notification_data["ticket_title"] = notification.notification_metadata.get("ticket_title")
            notification_data["ticket_number"] = notification.notification_metadata.get("ticket_number")
        
        enriched_notifications.append(NotificationOut(**notification_data))
    
    return enriched_notifications

@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener estadísticas de notificaciones del usuario"""
    return notification_crud.get_notification_stats(
        db=db,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id
    )

@router.get("/unread-count", response_model=dict)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener el contador de notificaciones no leídas"""
    count = notification_crud.get_unread_count(db, current_user.user_id, current_user.organization_id)
    return {"unread_count": count}

@router.get("/latest", response_model=NotificationOut)
def get_latest_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener la notificación más reciente del usuario"""
    latest_notification = notification_crud.get_latest_notification(
        db=db,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id
    )
    
    if not latest_notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay notificaciones"
        )
    
    return latest_notification

@router.get("/check-new", response_model=dict)
def check_new_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Verificar si hay notificaciones nuevas"""
    try:
        # Contar notificaciones no leídas directamente
        unread_count = db.query(Notification).filter(
            Notification.recipient_user_id == current_user.user_id,
            Notification.organization_id == current_user.organization_id,
            Notification.status == NotificationStatus.UNREAD
        ).count()
        
        return {
            "new_count": unread_count,
            "has_new": unread_count > 0
        }
    except Exception as e:
        print(f"❌ Error en check-new: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking notifications: {str(e)}"
        )

@router.patch("/mark-all-read")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Marcar todas las notificaciones como leídas"""
    count = notification_crud.mark_all_notifications_as_read(
        db=db,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id
    )
    
    return {"message": f"Se marcaron {count} notificaciones como leídas"}

@router.patch("/bulk-update")
def bulk_update_notifications(
    bulk_update: NotificationBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar múltiples notificaciones"""
    updated_count = 0
    
    for notification_id in bulk_update.notification_ids:
        notification = notification_crud.update_notification(
            db=db,
            notification_id=notification_id,
            user_id=current_user.user_id,
            notification=NotificationUpdate(status=bulk_update.status)
        )
        if notification:
            updated_count += 1
    
    return {"message": f"Se actualizaron {updated_count} notificaciones"}

@router.post("/test", response_model=NotificationOut)
def create_test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Endpoint de prueba para crear una notificación"""
    try:
        notification = notification_crud.create_notification(db, NotificationCreate(
            type=NotificationType.TICKET_ASSIGNED,
            title="Ticket Asignado - PRUEBA",
            message="Esta es una notificación de prueba para verificar el sistema",
            priority=NotificationPriority.MEDIUM,
            recipient_user_id=current_user.user_id,
            sender_user_id=current_user.user_id,
            organization_id=current_user.organization_id,
            ticket_id=1,
            notification_metadata={
                "test": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        ))
        return notification
    except Exception as e:
        print(f"Error creating test notification: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating test notification: {str(e)}"
        )

@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener una notificación específica"""
    notification = notification_crud.get_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.user_id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return notification

@router.patch("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar una notificación"""
    notification = notification_crud.update_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.user_id,
        notification=notification_update
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return notification

@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Marcar una notificación como leída"""
    notification = notification_crud.mark_notification_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.user_id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return notification

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Eliminar una notificación"""
    success = notification_crud.delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return {"message": "Notificación eliminada"} 