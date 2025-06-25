from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketOut, TicketStatusUpdate, TicketCategoryCreate, TicketCategoryUpdate, TicketCategoryOut
from app.crud import ticket_crud, external_form_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User
import json
import uuid
import os
import shutil
from datetime import datetime
from pathlib import Path

router = APIRouter(prefix="/tickets", tags=["Tickets"])

# Configurar directorio de uploads
UPLOAD_DIR = Path("uploads/attachments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Rutas para categorías de tickets
@router.post("/categories/", response_model=TicketCategoryOut)
def create_ticket_category(
    category: TicketCategoryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    # Asignar automáticamente la organización del usuario
    category.organization_id = current_user.organization_id
    return ticket_crud.create_ticket_category(db, category)

@router.get("/categories/", response_model=List[TicketCategoryOut])
def read_ticket_categories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    return ticket_crud.get_ticket_categories(db, current_user.organization_id, skip, limit)

@router.get("/categories/public/{organization_id}", response_model=List[TicketCategoryOut])
def read_ticket_categories_public(
    organization_id: int,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Obtener categorías de tickets de una organización (ruta pública para formularios externos)"""
    return ticket_crud.get_ticket_categories(db, organization_id, skip, limit)

@router.get("/categories/{category_id}", response_model=TicketCategoryOut)
def read_ticket_category(
    category_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    db_category = ticket_crud.get_ticket_category(db, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    # Verificar que la categoría pertenece a la organización del usuario
    if db_category.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return db_category

@router.put("/categories/{category_id}", response_model=TicketCategoryOut)
def update_ticket_category(
    category_id: int, 
    category: TicketCategoryUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    db_category = ticket_crud.get_ticket_category(db, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    # Verificar que la categoría pertenece a la organización del usuario
    if db_category.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    db_category = ticket_crud.update_ticket_category(db, category_id, category)
    return db_category

@router.delete("/categories/{category_id}", response_model=TicketCategoryOut)
def delete_ticket_category(
    category_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    db_category = ticket_crud.get_ticket_category(db, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    # Verificar que la categoría pertenece a la organización del usuario
    if db_category.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    db_category = ticket_crud.delete_ticket_category(db, category_id)
    return db_category

# Rutas para tickets (actualizadas para incluir categorías)
@router.post("/", response_model=TicketOut)
def create_ticket(
    ticket: TicketCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    # Asignar automáticamente la organización del usuario
    ticket.organization_id = current_user.organization_id
    return ticket_crud.create_ticket(db, ticket)

@router.post("/external/", response_model=TicketOut)
async def create_external_ticket(
    title: str = Form(...),
    description: str = Form(...),
    priority: str = Form(default="media"),
    category_id: Optional[int] = Form(None),
    client_name: str = Form(...),
    client_email: str = Form(...),
    client_phone: Optional[str] = Form(None),
    project_name: Optional[str] = Form(None),
    contact_name: str = Form(...),
    contact_email: str = Form(...),
    contact_phone: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    additional_info: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """Crear ticket desde formulario externo con soporte para archivos adjuntos y categorías"""
    
    # Procesar archivos adjuntos
    attachments = []
    if files:
        for file in files:
            if file.size and file.size > 0:
                # Generar nombre único para el archivo
                file_id = str(uuid.uuid4())
                file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
                new_filename = f"{file_id}.{file_extension}"
                
                # Guardar archivo físicamente
                file_path = UPLOAD_DIR / new_filename
                try:
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                    # Guardar información del archivo
                    attachment_info = {
                        "id": file_id,
                        "original_name": file.filename,
                        "filename": new_filename,
                        "size": file.size,
                        "content_type": file.content_type,
                        "uploaded_at": datetime.now().isoformat(),
                        "file_path": str(file_path)
                    }
                    attachments.append(attachment_info)
                except Exception as e:
                    print(f"Error saving file {file.filename}: {e}")
                    continue
    
    # Buscar cliente y proyecto por nombre
    from app.crud import client_crud, project_crud
    client = client_crud.get_client_by_name(db, client_name)
    project = None
    if project_name:
        project = project_crud.get_project_by_name(db, project_name)
    
    # Crear ticket
    ticket_data = TicketCreate(
        title=title,
        description=description,
        priority=priority,
        status="nuevo",
        category_id=category_id,
        client_id=client.client_id if client else None,
        project_id=project.project_id if project else None,
        organization_id=1,  # Organización por defecto
        due_date=datetime.strptime(due_date, "%Y-%m-%d").date() if due_date else None,
        contact_email=contact_email,
        contact_phone=contact_phone,
        contact_name=contact_name,
        attachments=attachments,
        resolution_description=additional_info
    )
    
    return ticket_crud.create_ticket(db, ticket_data)

@router.post("/external/{form_token}", response_model=TicketOut)
async def create_external_ticket_with_token(
    form_token: str,
    title: str = Form(...),
    description: str = Form(...),
    priority: str = Form(default="media"),
    category_id: Optional[int] = Form(None),
    client_name: str = Form(...),
    client_email: str = Form(...),
    client_phone: Optional[str] = Form(None),
    project_name: Optional[str] = Form(None),
    contact_name: str = Form(...),
    contact_email: str = Form(...),
    contact_phone: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    additional_info: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """Crear ticket desde formulario externo usando token de organización con categorías"""
    
    # Verificar que el formulario existe y está activo
    form = external_form_crud.get_external_form_by_token(db, form_token)
    if not form:
        raise HTTPException(status_code=404, detail="Formulario no encontrado o inactivo")
    
    # Procesar archivos adjuntos
    attachments = []
    if files:
        for file in files:
            if file.size and file.size > 0:
                # Generar nombre único para el archivo
                file_id = str(uuid.uuid4())
                file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
                new_filename = f"{file_id}.{file_extension}"
                
                # Guardar archivo físicamente
                file_path = UPLOAD_DIR / new_filename
                try:
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                    # Guardar información del archivo
                    attachment_info = {
                        "id": file_id,
                        "original_name": file.filename,
                        "filename": new_filename,
                        "size": file.size,
                        "content_type": file.content_type,
                        "uploaded_at": datetime.now().isoformat(),
                        "file_path": str(file_path)
                    }
                    attachments.append(attachment_info)
                except Exception as e:
                    print(f"Error saving file {file.filename}: {e}")
                    continue
    
    # Buscar cliente y proyecto por nombre dentro de la organización
    from app.crud import client_crud, project_crud
    client = client_crud.get_client_by_name_and_organization(db, client_name, form.organization_id)
    project = None
    if project_name:
        project = project_crud.get_project_by_name_and_organization(db, project_name, form.organization_id)
    
    # Crear ticket
    ticket_data = TicketCreate(
        title=title,
        description=description,
        priority=priority,
        status="nuevo",
        category_id=category_id,
        client_id=client.client_id if client else None,
        project_id=project.project_id if project else None,
        organization_id=form.organization_id,  # Usar la organización del formulario
        due_date=datetime.strptime(due_date, "%Y-%m-%d").date() if due_date else None,
        contact_email=contact_email,
        contact_phone=contact_phone,
        contact_name=contact_name,
        attachments=attachments,
        resolution_description=additional_info
    )
    
    return ticket_crud.create_ticket(db, ticket_data)

@router.get("/", response_model=List[TicketOut])
def read_tickets(
    skip: int = 0, 
    limit: int = 100, 
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener tickets de la organización del usuario actual con filtros opcionales por cliente y estado"""
    return ticket_crud.get_tickets(
        db, 
        skip=skip, 
        limit=limit, 
        client_id=client_id,
        organization_id=current_user.organization_id,
        status=status
    )

@router.get("/{ticket_id}", response_model=TicketOut)
def read_ticket(
    ticket_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    db_ticket = ticket_crud.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Verificar que el ticket pertenece a la organización del usuario
    if db_ticket.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return db_ticket

@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int, 
    ticket: TicketUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    db_ticket = ticket_crud.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Verificar que el ticket pertenece a la organización del usuario
    if db_ticket.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    db_ticket = ticket_crud.update_ticket(db, ticket_id, ticket)
    return db_ticket

@router.patch("/{ticket_id}/status", response_model=TicketOut)
def update_ticket_status(
    ticket_id: int, 
    status_update: TicketStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar solo el estado del ticket"""
    db_ticket = ticket_crud.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Verificar que el ticket pertenece a la organización del usuario
    if db_ticket.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Convertir el esquema de estado a un esquema de actualización completo
    ticket_update = TicketUpdate(
        status=status_update.status,
        resolved_at=status_update.resolved_at,
        closed_at=status_update.closed_at
    )
    updated_ticket = ticket_crud.update_ticket(db, ticket_id=ticket_id, ticket=ticket_update)
    return updated_ticket

@router.delete("/{ticket_id}", response_model=TicketOut)
def delete_ticket(
    ticket_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    db_ticket = ticket_crud.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Verificar que el ticket pertenece a la organización del usuario
    if db_ticket.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    db_ticket = ticket_crud.delete_ticket(db, ticket_id)
    return db_ticket
