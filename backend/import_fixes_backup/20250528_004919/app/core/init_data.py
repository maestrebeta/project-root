from sqlalchemy.orm import Session
from app.models.project_models import Project
from app.models.organization_models import Organization
from app.models.client_models import Client
from app.models.country_models import Country
from app.models.user_models import User
from app.models.epic_models import Epic, UserStory
from app.models.ticket_models import Ticket
from app.models.time_entry_models import TimeEntry
from app.core.security import get_password_hash
from datetime import datetime, timedelta, date
import random

def init_countries(db: Session):
    """Inicializar países básicos"""
    existing_countries = db.query(Country).count()
    if existing_countries > 0:
        return

    countries = [
        Country(
            country_code="ES",
            country_name="España",
            continent="Europa",
            phone_code="+34",
            currency_code="EUR",
            currency_symbol="€",
            is_active=True
        ),
        Country(
            country_code="US",
            country_name="Estados Unidos",
            continent="América",
            phone_code="+1",
            currency_code="USD",
            currency_symbol="$",
            is_active=True
        )
    ]
    
    for country in countries:
        db.add(country)
    db.commit()
    print("Países de ejemplo creados exitosamente.")

def init_organizations(db: Session):
    """Inicializar organizaciones"""
    existing_organizations = db.query(Organization).count()
    if existing_organizations > 0:
        return

    organizations = [
        Organization(
            name="Suiphar",
            description="Empresa farmacéutica",
            is_active=True,
            country_code="ES",
            timezone="Europe/Madrid",
            subscription_plan="enterprise",
            max_users=50
        ),
        Organization(
            name="Promedical",
            description="Empresa de dispositivos médicos",
            is_active=True,
            country_code="ES",
            timezone="Europe/Madrid",
            subscription_plan="professional",
            max_users=20
        )
    ]
    
    for org in organizations:
        db.add(org)
    db.commit()
    print("Organizaciones de ejemplo creadas exitosamente.")

def init_clients(db: Session):
    """Inicializar clientes"""
    existing_clients = db.query(Client).count()
    if existing_clients > 0:
        return

    # Obtener las organizaciones
    organizations = db.query(Organization).all()
    if not organizations:
        raise ValueError("No hay organizaciones en la base de datos")

    clients = [
        Client(
            name="Hospital La Fe",
            is_active=True,
            organization_id=organizations[0].organization_id,  # Asignar a Suiphar
            country_code="ES",
            address="Avda. Fernando Abril Martorell, 106, 46026 Valencia",
            contact_email="info@lafe.es",
            contact_phone="+34 961 24 40 00",
            tax_id="B12345678"
        ),
        Client(
            name="Clínica Quirón",
            is_active=True,
            organization_id=organizations[1].organization_id if len(organizations) > 1 else organizations[0].organization_id,  # Asignar a Promedical o Suiphar
            country_code="ES",
            address="Av. Blasco Ibáñez, 14, 46010 Valencia",
            contact_email="info@quiron.es",
            contact_phone="+34 963 69 06 00",
            tax_id="B87654321"
        )
    ]
    
    for client in clients:
        db.add(client)
    db.commit()
    print("Clientes de ejemplo creados exitosamente.")

def init_projects(db: Session):
    """Inicializar proyectos con datos masivos y realistas"""
    from app.models.project_models import Project
    import random
    
    # Verificar si ya existen proyectos
    existing_projects = db.query(Project).count()
    if existing_projects > 0:
        print(f"Ya existen {existing_projects} proyectos en la base de datos")
        return

    # Obtener datos necesarios
    clients = db.query(Client).all()
    users = db.query(User).all()
    organizations = db.query(Organization).all()
    
    if not clients or not users or not organizations:
        print("Faltan datos base para crear proyectos")
        return

    # Nombres de proyectos realistas
    project_prefixes = [
        'Sistema', 'Plataforma', 'Portal', 'App', 'Dashboard', 'CRM', 'ERP', 'API', 'Web', 'Móvil',
        'E-commerce', 'Marketplace', 'Blog', 'Intranet', 'Extranet', 'Microservicio', 'Backend', 'Frontend'
    ]
    
    project_suffixes = [
        'Gestión', 'Ventas', 'Inventario', 'Clientes', 'Usuarios', 'Reportes', 'Analytics', 'Facturación',
        'Recursos Humanos', 'Contabilidad', 'Marketing', 'Soporte', 'Comunicaciones', 'Logística', 'Calidad',
        'Seguridad', 'Monitoreo', 'Backup', 'Integración', 'Migración', 'Optimización', 'Automatización'
    ]
    
    project_types = ['development', 'support', 'meeting', 'training', 'other']
    project_statuses = [
        'registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
        'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support'
    ]
    priorities = ['low', 'medium', 'high', 'critical']
    
    projects_to_create = []
    
    # Crear 50 proyectos (5x más que antes)
    for i in range(50):
        client = random.choice(clients)
        manager = random.choice([u for u in users if u.role in ['admin', 'manager']])
        org = random.choice(organizations)
        
        prefix = random.choice(project_prefixes)
        suffix = random.choice(project_suffixes)
        project_name = f"{prefix} de {suffix} {client.name}"
        
        # Fechas realistas
        start_date = datetime.now() - timedelta(days=random.randint(0, 365))
        duration_days = random.randint(30, 365)
        end_date = start_date + timedelta(days=duration_days)
        
        # Horas estimadas basadas en tipo y duración
        base_hours = random.randint(100, 2000)
        if random.choice([True, False]):  # 50% de proyectos grandes
            base_hours = random.randint(500, 5000)
        
        project_data = {
            'client_id': client.client_id,
            'name': project_name,
            'code': f"PRJ-{i+1:03d}",
            'description': f"Proyecto de {suffix.lower()} para {client.name}. Incluye desarrollo, testing y documentación completa.",
            'project_type': random.choice(project_types),
            'status': random.choice(project_statuses),
            'start_date': start_date.date(),
            'end_date': end_date.date(),
            'manager_id': manager.user_id,
            'estimated_hours': base_hours,
            'priority': random.choice(priorities),
            'organization_id': org.organization_id,
            'tags': {
                'technology': random.choice(['React', 'Vue', 'Angular', 'Python', 'Node.js', 'Java', '.NET']),
                'industry': random.choice(['Fintech', 'Healthcare', 'E-commerce', 'Education', 'Manufacturing']),
                'complexity': random.choice(['Low', 'Medium', 'High', 'Very High'])
            }
        }
        
        projects_to_create.append(Project(**project_data))
    
    # Insertar en lotes
    try:
        db.add_all(projects_to_create)
        db.commit()
        print(f"✅ Creados {len(projects_to_create)} proyectos exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando proyectos: {str(e)}")
        raise

def init_users(db: Session):
    """Inicializar usuarios con datos masivos y realistas"""
    from app.models.user_models import User
    import random
    
    # Verificar si ya existen usuarios
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"Ya existen {existing_users} usuarios en la base de datos")
        return

    # Obtener organizaciones
    organizations = db.query(Organization).all()
    if not organizations:
        print("No hay organizaciones disponibles para crear usuarios")
        return

    # Datos para generar usuarios realistas
    first_names = [
        'Ana', 'Carlos', 'María', 'José', 'Laura', 'Miguel', 'Carmen', 'Antonio', 'Isabel', 'Francisco',
        'Pilar', 'Manuel', 'Rosa', 'David', 'Teresa', 'Javier', 'Ángeles', 'Daniel', 'Cristina', 'Rafael',
        'Marta', 'Alejandro', 'Lucía', 'Sergio', 'Elena', 'Pablo', 'Beatriz', 'Adrián', 'Natalia', 'Rubén',
        'Silvia', 'Iván', 'Patricia', 'Álvaro', 'Raquel', 'Diego', 'Mónica', 'Jorge', 'Sonia', 'Víctor',
        'Andrea', 'Óscar', 'Nuria', 'Marcos', 'Verónica', 'Gonzalo', 'Alicia', 'Héctor', 'Irene', 'Nicolás',
        'Claudia', 'Emilio', 'Rocío', 'Guillermo', 'Amparo', 'Rodrigo', 'Inmaculada', 'Fernando', 'Esther', 'Alberto'
    ]
    
    last_names = [
        'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
        'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
        'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
        'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
        'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'
    ]
    
    specializations = [
        'development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis'
    ]
    
    sub_specializations_map = {
        'development': ['backend', 'frontend', 'automation', 'data_bi'],
        'ui_ux': ['ui_design', 'ux_research', 'prototyping', 'user_testing'],
        'testing': ['unit_testing', 'integration_testing', 'e2e_testing', 'performance_testing'],
        'documentation': ['technical_docs', 'user_docs', 'api_docs', 'training_materials'],
        'management': ['project_management', 'team_lead', 'product_owner', 'scrum_master'],
        'data_analysis': ['data_modeling', 'reporting', 'analytics', 'business_intelligence']
    }
    
    roles = ['admin', 'dev', 'infra', 'super_user']
    
    users_to_create = []
    
    # Crear 100 usuarios (10x más que antes)
    for i in range(100):
        org = random.choice(organizations)
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        specialization = random.choice(specializations)
        
        # Generar sub-especializaciones
        available_subs = sub_specializations_map[specialization]
        num_subs = random.randint(1, min(3, len(available_subs)))
        sub_specs = random.sample(available_subs, num_subs)
        
        user_data = {
            'username': f"{first_name.lower()}.{last_name.lower()}{i+1}",
            'email': f"{first_name.lower()}.{last_name.lower()}{i+1}@{org.name.lower().replace(' ', '')}.com",
            'full_name': f"{first_name} {last_name}",
            'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5/Zem',  # secret
            'role': random.choice(roles),
            'specialization': specialization,
            'sub_specializations': sub_specs,
            'hourly_rate': random.randint(25, 85),
            'weekly_capacity': random.choice([32, 36, 40, 44]),
            'is_active': random.choice([True, True, True, True, False]),  # 80% activos
            'organization_id': org.organization_id,
            'country_code': 'ES',
            'timezone': 'Europe/Madrid',
            'language': 'es'
        }
        
        users_to_create.append(User(**user_data))
    
    # Insertar en lotes para mejor rendimiento
    try:
        db.add_all(users_to_create)
        db.commit()
        print(f"✅ Creados {len(users_to_create)} usuarios exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando usuarios: {str(e)}")
        raise

def init_epics_and_stories(db: Session):
    """Inicializar épicas y historias de usuario con datos realistas"""
    from app.models.epic_models import Epic, UserStory
    
    # Verificar si ya existen épicas
    existing_epics = db.query(Epic).count()
    if existing_epics > 0:
        print(f"Ya existen {existing_epics} épicas en la base de datos")
        return

    # Obtener datos necesarios
    projects = db.query(Project).all()
    users = db.query(User).all()
    
    if not projects or not users:
        print("Faltan proyectos o usuarios para crear épicas y historias")
        return

    # Crear épicas para cada proyecto
    epics_data = []
    
    for i, project in enumerate(projects[:8]):  # Primeros 8 proyectos
        # Crear 2-3 épicas por proyecto
        project_epics = [
            {
                "name": f"Módulo de Autenticación - {project.name}",
                "description": "Implementación completa del sistema de autenticación y autorización con roles y permisos.",
                "project_id": project.project_id,
                "status": "in_progress",
                "priority": "high",
                "estimated_hours": 120,
                "start_date": project.start_date,
                "end_date": project.start_date + timedelta(days=30) if project.start_date else None,
                "tags": {"module": "auth", "security": True}
            },
            {
                "name": f"Dashboard Principal - {project.name}",
                "description": "Desarrollo del dashboard principal con métricas, gráficos y navegación intuitiva.",
                "project_id": project.project_id,
                "status": "planning",
                "priority": "medium",
                "estimated_hours": 80,
                "start_date": project.start_date + timedelta(days=20) if project.start_date else None,
                "end_date": project.start_date + timedelta(days=50) if project.start_date else None,
                "tags": {"module": "dashboard", "ui": True}
            }
        ]
        
        if project.project_type == "development":
            project_epics.append({
                "name": f"API REST - {project.name}",
                "description": "Desarrollo de API REST completa con documentación y testing automatizado.",
                "project_id": project.project_id,
                "status": "planning",
                "priority": "high",
                "estimated_hours": 100,
                "start_date": project.start_date + timedelta(days=10) if project.start_date else None,
                "end_date": project.start_date + timedelta(days=40) if project.start_date else None,
                "tags": {"module": "api", "backend": True}
            })
        
        epics_data.extend(project_epics)

    # Crear épicas
    created_epics = []
    for epic_data in epics_data:
        epic = Epic(**epic_data)
        db.add(epic)
        created_epics.append(epic)
    
    db.flush()  # Para obtener los IDs de las épicas

    # Crear historias de usuario para cada épica
    story_templates = [
        {
            "title": "Como usuario quiero iniciar sesión",
            "description": "Como usuario del sistema, quiero poder iniciar sesión con mi email y contraseña para acceder a mi cuenta.",
            "acceptance_criteria": "- El usuario puede ingresar email y contraseña\n- Se valida la información\n- Se redirige al dashboard tras login exitoso",
            "estimated_hours": 8,
            "priority": "high"
        },
        {
            "title": "Como admin quiero gestionar usuarios",
            "description": "Como administrador, quiero poder crear, editar y desactivar usuarios para mantener el control de acceso.",
            "acceptance_criteria": "- Crear nuevos usuarios\n- Editar información existente\n- Desactivar/activar usuarios\n- Asignar roles",
            "estimated_hours": 16,
            "priority": "high"
        },
        {
            "title": "Como usuario quiero ver mi dashboard",
            "description": "Como usuario, quiero ver un dashboard personalizado con mis métricas y tareas pendientes.",
            "acceptance_criteria": "- Mostrar métricas personalizadas\n- Listar tareas pendientes\n- Gráficos de progreso\n- Navegación rápida",
            "estimated_hours": 12,
            "priority": "medium"
        },
        {
            "title": "Como usuario quiero filtrar información",
            "description": "Como usuario, quiero poder filtrar y buscar información para encontrar datos específicos rápidamente.",
            "acceptance_criteria": "- Filtros por fecha\n- Búsqueda por texto\n- Filtros por categoría\n- Guardar filtros favoritos",
            "estimated_hours": 10,
            "priority": "medium"
        },
        {
            "title": "Como usuario quiero exportar reportes",
            "description": "Como usuario, quiero exportar reportes en diferentes formatos para análisis offline.",
            "acceptance_criteria": "- Exportar a PDF\n- Exportar a Excel\n- Seleccionar rango de fechas\n- Personalizar campos",
            "estimated_hours": 14,
            "priority": "low"
        }
    ]

    for epic in created_epics:
        # Crear 3-5 historias por épica
        num_stories = min(len(story_templates), 4)
        for j in range(num_stories):
            template = story_templates[j % len(story_templates)]
            
            # Asignar usuario basado en especialización
            assigned_user = None
            if "dashboard" in epic.name.lower() or "ui" in str(epic.tags):
                # Buscar diseñador UX/UI
                assigned_user = next((u for u in users if u.specialization == 'ui_ux'), users[0])
            elif "api" in epic.name.lower() or "backend" in str(epic.tags):
                # Buscar desarrollador backend
                assigned_user = next((u for u in users if u.specialization == 'development' and 'backend' in (u.sub_specializations or [])), users[0])
            else:
                # Asignar desarrollador general
                assigned_user = next((u for u in users if u.specialization == 'development'), users[0])
            
            story = UserStory(
                title=f"{template['title']} - {epic.name[:20]}",
                description=template['description'],
                acceptance_criteria=template['acceptance_criteria'],
                estimated_hours=template['estimated_hours'],
                priority=template['priority'],
                status=['backlog', 'todo', 'in_progress', 'in_review', 'done'][j % 5],
                epic_id=epic.epic_id,
                project_id=epic.project_id,
                assigned_user_id=assigned_user.user_id if assigned_user else None,
                tags=["epic", "feature"]
            )
            
            # Si está completada, agregar fecha de completación
            if story.status == 'done':
                story.completed_date = datetime.now() - timedelta(days=5-j)
            
            db.add(story)

    try:
        db.commit()
        print(f"✅ {len(epics_data)} épicas y múltiples historias de usuario creadas exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando épicas y historias: {str(e)}")

def init_tickets(db: Session):
    """Inicializar tickets con datos masivos y realistas"""
    from app.models.ticket_models import Ticket
    import random
    
    # Verificar si ya existen tickets
    existing_tickets = db.query(Ticket).count()
    if existing_tickets > 0:
        print(f"Ya existen {existing_tickets} tickets en la base de datos")
        return

    # Obtener datos necesarios
    projects = db.query(Project).all()
    users = db.query(User).all()
    organizations = db.query(Organization).all()
    
    if not projects or not users or not organizations:
        print("Faltan datos base para crear tickets")
        return

    org = organizations[0]
    
    # Tipos de tickets más realistas
    ticket_types = ['bug', 'feature', 'improvement', 'task', 'support', 'documentation']
    priorities = ['low', 'medium', 'high', 'critical']
    statuses = ['abierto', 'en_progreso', 'en_revision', 'cerrado', 'reabierto']
    
    # Títulos de tickets realistas por tipo
    ticket_titles = {
        'bug': [
            'Error en validación de formulario',
            'Problema de rendimiento en carga de datos',
            'Fallo en autenticación de usuarios',
            'Error 500 en endpoint de pagos',
            'Interfaz no responsive en móviles',
            'Pérdida de datos en formulario',
            'Error de conexión a base de datos',
            'Problema con cache de aplicación',
            'Fallo en envío de emails',
            'Error en cálculo de totales'
        ],
        'feature': [
            'Implementar sistema de notificaciones',
            'Agregar filtros avanzados en búsqueda',
            'Crear dashboard de métricas',
            'Implementar autenticación de dos factores',
            'Agregar exportación a Excel',
            'Crear sistema de comentarios',
            'Implementar chat en tiempo real',
            'Agregar modo oscuro',
            'Crear API para integración externa',
            'Implementar sistema de roles'
        ],
        'improvement': [
            'Optimizar consultas de base de datos',
            'Mejorar UX del formulario de registro',
            'Actualizar diseño de la página principal',
            'Optimizar tiempo de carga de imágenes',
            'Mejorar accesibilidad del sitio',
            'Refactorizar código legacy',
            'Mejorar mensajes de error',
            'Optimizar algoritmo de búsqueda',
            'Mejorar navegación del sitio',
            'Actualizar librerías a versiones recientes'
        ],
        'task': [
            'Configurar entorno de desarrollo',
            'Actualizar documentación técnica',
            'Realizar backup de base de datos',
            'Configurar monitoreo de aplicación',
            'Preparar release notes',
            'Actualizar certificados SSL',
            'Configurar CI/CD pipeline',
            'Realizar pruebas de seguridad',
            'Migrar datos de sistema legacy',
            'Configurar logs de aplicación'
        ],
        'support': [
            'Usuario no puede acceder a su cuenta',
            'Problema con facturación automática',
            'Consulta sobre funcionalidad específica',
            'Solicitud de cambio de permisos',
            'Problema con integración externa',
            'Consulta sobre reportes',
            'Solicitud de capacitación',
            'Problema con sincronización de datos',
            'Consulta sobre API',
            'Solicitud de personalización'
        ],
        'documentation': [
            'Crear guía de usuario para nueva funcionalidad',
            'Actualizar documentación de API',
            'Crear manual de instalación',
            'Documentar proceso de deployment',
            'Crear guía de troubleshooting',
            'Actualizar FAQ del sistema',
            'Crear documentación técnica',
            'Documentar arquitectura del sistema',
            'Crear guía de mejores prácticas',
            'Actualizar changelog del proyecto'
        ]
    }
    
    tickets_to_create = []
    
    # Crear 300 tickets (3x más que antes)
    for i in range(300):
        project = random.choice(projects)
        ticket_type = random.choice(ticket_types)
        title = random.choice(ticket_titles[ticket_type])
        
        # Asignar usuario basado en especialización
        suitable_users = []
        for user in users:
            if ticket_type in ['bug', 'feature', 'improvement'] and user.specialization == 'development':
                suitable_users.append(user)
            elif ticket_type == 'task' and user.specialization in ['development', 'management']:
                suitable_users.append(user)
            elif ticket_type == 'documentation' and user.specialization == 'documentation':
                suitable_users.append(user)
            elif ticket_type == 'support':
                suitable_users.append(user)
        
        if not suitable_users:
            suitable_users = users
        
        assigned_user = random.choice(suitable_users)
        reporter = random.choice(users)
        
        # Fechas realistas
        created_date = datetime.now() - timedelta(days=random.randint(0, 180))
        
        # Determinar si está resuelto y cuándo
        status = random.choice(statuses)
        resolved_at = None
        if status == 'cerrado':
            resolved_at = created_date + timedelta(days=random.randint(1, 30))
        
        # Descripción detallada
        descriptions = {
            'bug': f"Se ha detectado un error en {title.lower()}. El problema se reproduce consistentemente y afecta la funcionalidad normal del sistema.",
            'feature': f"Solicitud para {title.lower()}. Esta funcionalidad mejorará significativamente la experiencia del usuario.",
            'improvement': f"Propuesta para {title.lower()}. Esta mejora optimizará el rendimiento y usabilidad del sistema.",
            'task': f"Tarea técnica: {title.lower()}. Es necesario completar esta actividad para mantener el sistema actualizado.",
            'support': f"Solicitud de soporte: {title.lower()}. El usuario requiere asistencia para resolver este problema.",
            'documentation': f"Documentación requerida: {title.lower()}. Es necesario crear/actualizar la documentación correspondiente."
        }
        
        ticket_data = {
            'title': f"{title} - {project.name}",
            'description': descriptions[ticket_type],
            'ticket_type': ticket_type,
            'priority': random.choice(priorities),
            'status': status,
            'project_id': project.project_id,
            'assigned_to_user_id': assigned_user.user_id,
            'reporter_user_id': reporter.user_id,
            'organization_id': org.organization_id,
            'created_at': created_date,
            'resolved_at': resolved_at,
            'estimated_hours': random.choice([1, 2, 3, 4, 5, 8, 13, 21]),  # Fibonacci
            'tags': {
                'component': random.choice(['frontend', 'backend', 'database', 'api', 'ui']),
                'severity': random.choice(['low', 'medium', 'high', 'critical']),
                'browser': random.choice(['chrome', 'firefox', 'safari', 'edge']) if ticket_type == 'bug' else None
            }
        }
        
        tickets_to_create.append(Ticket(**ticket_data))
    
    # Insertar en lotes
    batch_size = 50
    total_created = 0
    
    try:
        for i in range(0, len(tickets_to_create), batch_size):
            batch = tickets_to_create[i:i + batch_size]
            db.add_all(batch)
            db.commit()
            total_created += len(batch)
            print(f"✅ Procesado lote {i//batch_size + 1}: {total_created}/{len(tickets_to_create)} tickets")
        
        print(f"✅ Creados {total_created} tickets exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando tickets: {str(e)}")
        raise

def init_time_entries(db: Session):
    """Inicializar entradas de tiempo con datos masivos y realistas"""
    from app.models.time_entry_models import TimeEntry
    import random
    
    # Verificar si ya existen entradas de tiempo
    existing_entries = db.query(TimeEntry).count()
    if existing_entries > 0:
        print(f"Ya existen {existing_entries} entradas de tiempo en la base de datos")
        return

    # Obtener datos necesarios
    projects = db.query(Project).all()
    users = db.query(User).all()
    tickets = db.query(Ticket).all()
    stories = db.query(UserStory).all()
    organizations = db.query(Organization).all()
    
    if not projects or not users or not organizations:
        print("Faltan datos base para crear entradas de tiempo")
        return

    org = organizations[0]
    
    activity_types = [
        'desarrollo', 'testing', 'documentacion', 'reunion', 'analisis', 'diseno',
        'revision_codigo', 'deployment', 'soporte', 'investigacion', 'capacitacion'
    ]
    
    statuses = ['pendiente', 'en_progreso', 'completada']
    
    entries_to_create = []
    
    # Crear 1000 entradas de tiempo (10x más que antes)
    for i in range(1000):
        user = random.choice(users)
        project = random.choice(projects)
        
        # Fecha aleatoria en los últimos 6 meses
        days_ago = random.randint(0, 180)
        entry_date = datetime.now() - timedelta(days=days_ago)
        
        # Hora de inicio aleatoria entre 8:00 y 16:00
        start_hour = random.randint(8, 16)
        start_minute = random.choice([0, 15, 30, 45])
        start_time = entry_date.replace(hour=start_hour, minute=start_minute, second=0, microsecond=0)
        
        # Duración aleatoria entre 1 y 8 horas
        duration_hours = random.choice([1, 1.5, 2, 2.5, 3, 4, 6, 8])
        end_time = start_time + timedelta(hours=duration_hours)
        
        # Asignar ticket o historia aleatoriamente (50% de probabilidad)
        ticket_id = random.choice(tickets).ticket_id if tickets and random.choice([True, False]) else None
        story_id = random.choice(stories).story_id if stories and random.choice([True, False]) else None
        
        # Descripción realista basada en el tipo de actividad
        activity = random.choice(activity_types)
        descriptions = {
            'desarrollo': [
                'Implementación de nuevas funcionalidades',
                'Corrección de bugs reportados',
                'Refactoring de código legacy',
                'Desarrollo de API endpoints',
                'Integración con servicios externos'
            ],
            'testing': [
                'Pruebas unitarias de componentes',
                'Testing de integración',
                'Pruebas de regresión',
                'Testing manual de funcionalidades',
                'Automatización de pruebas'
            ],
            'documentacion': [
                'Actualización de documentación técnica',
                'Creación de manuales de usuario',
                'Documentación de APIs',
                'Guías de instalación',
                'Especificaciones técnicas'
            ],
            'reunion': [
                'Daily standup meeting',
                'Sprint planning',
                'Retrospectiva de sprint',
                'Reunión con cliente',
                'Revisión de arquitectura'
            ],
            'analisis': [
                'Análisis de requerimientos',
                'Investigación de tecnologías',
                'Análisis de rendimiento',
                'Estudio de factibilidad',
                'Análisis de riesgos'
            ]
        }
        
        description = random.choice(descriptions.get(activity, ['Trabajo general en el proyecto']))
        
        entry_data = {
            'user_id': user.user_id,
            'project_id': project.project_id,
            'entry_date': entry_date,
            'activity_type': activity,
            'start_time': start_time,
            'end_time': end_time,
            'description': description,
            'status': random.choice(statuses),
            'billable': random.choice([True, True, True, False]),  # 75% billable
            'ticket_id': ticket_id,
            'user_story_id': story_id,
            'organization_id': org.organization_id
        }
        
        entries_to_create.append(TimeEntry(**entry_data))
    
    # Insertar en lotes de 100 para mejor rendimiento
    batch_size = 100
    total_created = 0
    
    try:
        for i in range(0, len(entries_to_create), batch_size):
            batch = entries_to_create[i:i + batch_size]
            db.add_all(batch)
            db.commit()
            total_created += len(batch)
            print(f"✅ Procesado lote {i//batch_size + 1}: {total_created}/{len(entries_to_create)} entradas")
        
        print(f"✅ Creadas {total_created} entradas de tiempo exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando entradas de tiempo: {str(e)}")
        raise

def init_data(db: Session):
    """
    Inicializar todos los datos de prueba en orden correcto
    Sistema inteligente que evita duplicaciones y garantiza consistencia
    """
    print("🚀 Iniciando sistema inteligente de datos de prueba...")
    
    # Verificar si ya existe un conjunto completo de datos
    countries_count = db.query(Country).count()
    orgs_count = db.query(Organization).count()
    users_count = db.query(User).count()
    projects_count = db.query(Project).count()
    time_entries_count = db.query(TimeEntry).count()
    
    # Si ya hay un conjunto completo de datos, no duplicar
    if (countries_count >= 10 and orgs_count >= 1 and users_count >= 5 and 
        projects_count >= 3 and time_entries_count >= 100):
        print("✅ Ya existe un conjunto completo de datos de prueba:")
        print(f"   • Países: {countries_count}")
        print(f"   • Organizaciones: {orgs_count}")
        print(f"   • Usuarios: {users_count}")
        print(f"   • Proyectos: {projects_count}")
        print(f"   • Entradas de Tiempo: {time_entries_count}")
        print("\n🎯 No se requiere inicialización adicional.")
        return
    
    print("📊 Estado actual de la base de datos:")
    print(f"   • Países: {countries_count}")
    print(f"   • Organizaciones: {orgs_count}")
    print(f"   • Usuarios: {users_count}")
    print(f"   • Proyectos: {projects_count}")
    print(f"   • Entradas de Tiempo: {time_entries_count}")
    print("\n🔄 Procediendo con la inicialización inteligente...")
    
    try:
        # 1. Países (base) - Solo si no existen suficientes
        if countries_count < 10:
            print("\n📍 Inicializando países...")
            init_countries(db)
        else:
            print(f"\n📍 Países ya inicializados ({countries_count} encontrados)")
        
        # 2. Organizaciones - Solo si no existe al menos una
        if orgs_count < 1:
            print("\n🏢 Inicializando organizaciones...")
            init_organizations(db)
        else:
            print(f"\n🏢 Organizaciones ya inicializadas ({orgs_count} encontradas)")
        
        # 3. Clientes - Solo si no existen suficientes
        clients_count = db.query(Client).count()
        if clients_count < 3:
            print("\n👥 Inicializando clientes...")
            init_clients(db)
        else:
            print(f"\n👥 Clientes ya inicializados ({clients_count} encontrados)")
        
        # 4. Usuarios con especializaciones - Solo si no existen suficientes
        if users_count < 5:
            print("\n👤 Inicializando usuarios con especializaciones...")
            init_users(db)
        else:
            print(f"\n👤 Usuarios ya inicializados ({users_count} encontrados)")
        
        # 5. Proyectos - Solo si no existen suficientes
        if projects_count < 3:
            print("\n📋 Inicializando proyectos...")
            init_projects(db)
        else:
            print(f"\n📋 Proyectos ya inicializados ({projects_count} encontrados)")
        
        # 6. Épicas y Historias de Usuario - Solo si no existen
        epics_count = db.query(Epic).count()
        stories_count = db.query(UserStory).count()
        if epics_count < 3 or stories_count < 10:
            print("\n📖 Inicializando épicas y historias de usuario...")
            init_epics_and_stories(db)
        else:
            print(f"\n📖 Épicas y historias ya inicializadas ({epics_count} épicas, {stories_count} historias)")
        
        # 7. Tickets - Solo si no existen suficientes
        tickets_count = db.query(Ticket).count()
        if tickets_count < 5:
            print("\n🎫 Inicializando tickets...")
            init_tickets(db)
        else:
            print(f"\n🎫 Tickets ya inicializados ({tickets_count} encontrados)")
        
        # 8. Entradas de Tiempo - Solo si no existen suficientes
        if time_entries_count < 100:
            print("\n⏰ Inicializando entradas de tiempo...")
            init_time_entries(db)
        else:
            print(f"\n⏰ Entradas de tiempo ya inicializadas ({time_entries_count} encontradas)")
        
        # Mostrar resumen final actualizado
        print("\n✅ ¡Inicialización inteligente completada!")
        print("\n📊 Estado final de la base de datos:")
        
        final_countries = db.query(Country).count()
        final_orgs = db.query(Organization).count()
        final_clients = db.query(Client).count()
        final_users = db.query(User).count()
        final_projects = db.query(Project).count()
        final_epics = db.query(Epic).count()
        final_stories = db.query(UserStory).count()
        final_tickets = db.query(Ticket).count()
        final_time_entries = db.query(TimeEntry).count()
        
        print(f"   • Países: {final_countries}")
        print(f"   • Organizaciones: {final_orgs}")
        print(f"   • Clientes: {final_clients}")
        print(f"   • Usuarios: {final_users}")
        print(f"   • Proyectos: {final_projects}")
        print(f"   • Épicas: {final_epics}")
        print(f"   • Historias de Usuario: {final_stories}")
        print(f"   • Tickets: {final_tickets}")
        print(f"   • Entradas de Tiempo: {final_time_entries}")
        
        print("\n🎉 ¡La aplicación está lista con un conjunto completo y consistente de datos!")
        print("🔄 En futuros reinicios, este sistema evitará duplicaciones automáticamente.")
        
    except Exception as e:
        print(f"\n❌ Error durante la inicialización inteligente: {str(e)}")
        db.rollback()
        raise 