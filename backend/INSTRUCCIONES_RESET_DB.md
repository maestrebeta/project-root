# 🗃️ Instrucciones para Resetear la Base de Datos

## Resumen
Este documento explica cómo resetear completamente la base de datos de SmartPlanner y configurarla desde cero con datos de prueba.

## ✅ Proceso Simplificado

### 1. Resetear Base de Datos
```bash
cd backend
python reset_database.py
```

Este script:
- ✅ Elimina las bases de datos existentes (`smartplanner.db`, `system_intelligence.db`)
- ✅ Aplica las migraciones de Alembic (crea todas las tablas)
- ✅ Verifica que todas las tablas requeridas estén creadas
- ✅ Incluye las correcciones de épicas con estado `'backlog'`

### 2. Inicializar Datos
```bash
python start_system.py
```

Este script:
- ✅ Verifica la estructura de la base de datos
- ✅ Inicializa datos de prueba (países, organizaciones, usuarios, proyectos, épicas, etc.)
- ✅ **NO inicia el backend** (lo harás manualmente)

### 3. Iniciar Backend Manualmente
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Iniciar Frontend
```bash
cd frontend/SmartPlanner
npm run dev
```

## 📊 Datos Incluidos

### Organizaciones
- **TechCorp Solutions** (ID: 1)
- **InnovateHub** (ID: 2)
- **DataDriven Analytics** (ID: 3)

### Usuarios de Prueba
- **admin@techcorp.com** / password: `admin123` (Super Admin)
- **dev@techcorp.com** / password: `dev123` (Desarrollador)
- **manager@techcorp.com** / password: `manager123` (Manager)

### Proyectos
- 15+ proyectos con diferentes estados y tipos
- Proyectos asignados a diferentes organizaciones
- Fechas realistas y horas estimadas

### Épicas y User Stories
- 60+ épicas con estado `'backlog'`, `'planning'`, `'in_progress'`, etc.
- 300+ user stories asignadas a épicas
- Datos realistas con criterios de aceptación

### Entradas de Tiempo
- 500+ entradas de tiempo distribuidas en los últimos 3 meses
- Asignadas a proyectos y user stories
- Estados variados para pruebas

## 🔧 Estados Válidos Actualizados

### Épicas
```
['backlog', 'planning', 'in_progress', 'review', 'done', 'blocked']
```
- **Estado por defecto**: `'backlog'`

### User Stories
```
['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'blocked']
```
- **Estado por defecto**: `'backlog'`

### Proyectos
```
['registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
 'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support']
```

## 🚨 Archivos Eliminados

- ❌ `create_tables_sqlite.py` - **ELIMINADO** (redundante con migraciones de Alembic)
- ✅ Ahora solo usamos migraciones de Alembic para crear tablas

## 🎯 Verificación de Éxito

Después de ejecutar los pasos, deberías ver:

1. **Base de datos creada** con todas las tablas
2. **Datos inicializados** sin errores
3. **Backend accesible** en http://localhost:8000
4. **Frontend accesible** en http://localhost:5173
5. **Sin errores 500** al cargar épicas

## 🔍 Solución de Problemas

### Error en migraciones
```bash
cd backend
python -m alembic upgrade head
```

### Verificar tablas creadas
```bash
cd backend
python -c "
from app.core.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
print('Tablas:', inspector.get_table_names())
"
```

### Verificar datos
```bash
cd backend
python -c "
from app.core.database import get_db
from app.models.epic_models import Epic
db = next(get_db())
epics = db.query(Epic).all()
print(f'Épicas: {len(epics)}')
for epic in epics[:3]:
    print(f'  - {epic.name}: {epic.status}')
"
```

## ✨ Resultado Esperado

- ✅ **0 errores** al iniciar el sistema
- ✅ **Datos suficientes** para pruebas completas
- ✅ **Estados consistentes** entre backend y frontend
- ✅ **Épicas funcionando** correctamente con estado `'backlog'` 