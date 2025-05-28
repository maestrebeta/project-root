#!/usr/bin/env python3
import sys
sys.path.append('.')

from app.routers.user_router import get_users_capacity_analytics
from app.core.database import get_db
from app.models.user_models import User
from app.core.security import get_current_user_organization
from unittest.mock import Mock

def test_endpoint():
    # Crear un mock del usuario actual
    mock_user = Mock()
    mock_user.organization_id = 1

    # Obtener la sesión de base de datos
    db_gen = get_db()
    db = next(db_gen)

    try:
        print("🧪 Probando endpoint capacity-analytics directamente...")
        
        # Llamar directamente al endpoint
        result = get_users_capacity_analytics(db=db, current_user=mock_user)
        print('✅ Endpoint ejecutado exitosamente')
        print(f'Usuarios encontrados: {len(result["users"])}')
        print(f'Resumen: {result["summary"]}')
        print(f'Workload summary: {len(result["workload_summary"])}')
        
        # Verificar estructura de respuesta
        if "users" in result and "summary" in result and "workload_summary" in result:
            print("✅ Estructura de respuesta correcta")
        else:
            print("❌ Estructura de respuesta incorrecta")
            
    except Exception as e:
        print(f'❌ Error en endpoint: {e}')
        print(f'Tipo de error: {type(e).__name__}')
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoint() 