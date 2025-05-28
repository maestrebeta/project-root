#!/usr/bin/env python3
"""
Script para probar la creación de historias de usuario
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.models.epic_models import Epic, UserStory
from app.models.project_models import Project
from app.models.user_models import User
from app.schemas.epic_schema import UserStoryCreate
from app.crud import epic_crud

def test_story_creation():
    """Probar la creación de una historia de usuario"""
    db = next(get_db())
    
    try:
        print("🔍 Verificando datos existentes...")
        
        # Obtener un proyecto existente
        project = db.query(Project).first()
        if not project:
            print("❌ No hay proyectos disponibles")
            return
        print(f"✅ Proyecto encontrado: {project.name} (ID: {project.project_id})")
        
        # Obtener una épica existente
        epic = db.query(Epic).filter(Epic.project_id == project.project_id).first()
        if not epic:
            print("❌ No hay épicas disponibles para este proyecto")
            return
        print(f"✅ Épica encontrada: {epic.name} (ID: {epic.epic_id})")
        
        # Obtener un usuario existente
        user = db.query(User).first()
        if not user:
            print("❌ No hay usuarios disponibles")
            return
        print(f"✅ Usuario encontrado: {user.username} (ID: {user.user_id})")
        
        # Crear datos de historia de prueba
        story_data = UserStoryCreate(
            epic_id=epic.epic_id,
            project_id=project.project_id,
            title="Historia de prueba desde script",
            description="Esta es una historia creada para probar la funcionalidad",
            status="todo",
            priority="medium",
            story_points=3,
            ui_hours=2.0,
            development_hours=5.0,
            testing_hours=2.0,
            assigned_user_id=user.user_id,
            business_value="Verificar que la creación de historias funciona correctamente"
        )
        
        print(f"🔄 Creando historia de usuario...")
        print(f"   - Título: {story_data.title}")
        print(f"   - Épica: {epic.name}")
        print(f"   - Proyecto: {project.name}")
        print(f"   - Usuario asignado: {user.username}")
        
        # Crear la historia
        created_story = epic_crud.create_user_story(db, story_data)
        
        print(f"✅ Historia creada exitosamente!")
        print(f"   - ID: {created_story.story_id}")
        print(f"   - Título: {created_story.title}")
        print(f"   - Estado: {created_story.status}")
        print(f"   - Prioridad: {created_story.priority}")
        print(f"   - Story Points: {created_story.story_points}")
        print(f"   - Horas UI: {created_story.ui_hours}")
        print(f"   - Horas Desarrollo: {created_story.development_hours}")
        print(f"   - Horas Testing: {created_story.testing_hours}")
        
        # Verificar que se puede recuperar
        retrieved_story = epic_crud.get_user_story(db, created_story.story_id)
        if retrieved_story:
            print(f"✅ Historia recuperada correctamente desde la base de datos")
        else:
            print(f"❌ Error: No se pudo recuperar la historia creada")
            
        return created_story
        
    except Exception as e:
        print(f"❌ Error al crear historia: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

def test_story_update():
    """Probar la actualización de una historia existente"""
    db = next(get_db())
    
    try:
        print("\n🔍 Probando actualización de historia...")
        
        # Obtener una historia existente
        story = db.query(UserStory).first()
        if not story:
            print("❌ No hay historias disponibles para actualizar")
            return
            
        print(f"✅ Historia encontrada: {story.title} (ID: {story.story_id})")
        print(f"   - Estado actual: {story.status}")
        
        # Actualizar el estado
        from app.schemas.epic_schema import UserStoryUpdate
        update_data = UserStoryUpdate(
            status="in_progress",
            description="Historia actualizada desde script de prueba"
        )
        
        updated_story = epic_crud.update_user_story(db, story.story_id, update_data)
        
        print(f"✅ Historia actualizada exitosamente!")
        print(f"   - Nuevo estado: {updated_story.status}")
        print(f"   - Nueva descripción: {updated_story.description}")
        
        return updated_story
        
    except Exception as e:
        print(f"❌ Error al actualizar historia: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("🧪 Iniciando pruebas de historias de usuario...")
    
    # Probar creación
    created_story = test_story_creation()
    
    # Probar actualización
    updated_story = test_story_update()
    
    if created_story and updated_story:
        print("\n🎉 Todas las pruebas pasaron exitosamente!")
        print("✅ La creación y actualización de historias funciona correctamente")
    else:
        print("\n❌ Algunas pruebas fallaron")
        print("🔧 Revisar la configuración del backend") 