# SmartPlanner Backend - Configuración Completa

## 🚀 Configuración Rápida

### 1. Recrear las Tablas

Para garantizar que todo funcione correctamente, ejecuta el script directo (recomendado):

```bash
cd backend
python reset_db_direct.py
```

Alternativas:
- `python reset_db_simple.py` (requiere Alembic)
- `python reset_db.py` (requiere permisos de PostgreSQL)

Este script:
- ✅ Elimina la base de datos existente
- ✅ Crea una nueva base de datos limpia
- ✅ Ejecuta todas las migraciones
- ✅ Carga datos de ejemplo
- ✅ Configura épicas e historias de usuario

### 2. Verificar la Configuración

Después del reset, verifica que todo esté correcto:

```bash
python verify_db.py
```

### 3. Iniciar el Servidor

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Datos de Ejemplo Incluidos

### Organizaciones
- **TechCorp Solutions** - Organización principal
- **ProMedical Systems** - Organización secundaria

### Usuarios de Prueba
- **admin@techcorp.com** / `TechCorp2024!` (Administrador)
- **dev@techcorp.com** / `TechCorp2024!` (Desarrollador)
- **admin@promedical.com** / `Promedical2024!` (Admin ProMedical)

### Proyectos
- **Sistema de Gestión V2.0** (TechCorp)
- **Plataforma LIMS** (ProMedical)

### Épicas y Historias
- ✅ Épicas con estados: `planning`, `in_progress`, `review`, `done`, `blocked`
- ✅ Historias con estados: `backlog`, `todo`, `in_progress`, `in_review`, `testing`, `done`, `blocked`
- ✅ Relaciones correctas entre proyectos, épicas e historias

## 🔧 Componentes Configurados

### Modelos
- ✅ `Epic` - Épicas con estados consistentes
- ✅ `UserStory` - Historias de usuario completas
- ✅ `Project` - Proyectos con relaciones a épicas
- ✅ Relaciones bidireccionales configuradas

### Esquemas (Pydantic)
- ✅ Validación de estados de épicas
- ✅ Validación de estados de historias
- ✅ Esquemas de creación y actualización

### CRUD Operations
- ✅ Operaciones completas para épicas
- ✅ Operaciones completas para historias
- ✅ Cálculo automático de estadísticas
- ✅ Actualización de progreso de épicas

### API Endpoints
- ✅ `/epics/` - CRUD de épicas
- ✅ `/epics/stories/` - CRUD de historias
- ✅ `/epics/planning/stats` - Estadísticas de planificación
- ✅ Autenticación y autorización por organización

## 🎯 Estados Válidos

### Épicas
- `planning` - Planificación (estado inicial)
- `in_progress` - En progreso
- `review` - En revisión
- `done` - Completada
- `blocked` - Bloqueada

### Historias de Usuario
- `backlog` - Backlog (estado inicial)
- `todo` - Por hacer
- `in_progress` - En progreso
- `in_review` - En revisión
- `testing` - En pruebas
- `done` - Completada
- `blocked` - Bloqueada

## 🔍 Verificación de Funcionamiento

### 1. Probar Endpoints
```bash
# Obtener épicas
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/epics/

# Obtener historias
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/epics/stories/

# Estadísticas de planificación
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/epics/planning/stats
```

### 2. Frontend
El frontend debe poder:
- ✅ Cargar épicas sin errores de validación
- ✅ Crear nuevas épicas con estados válidos
- ✅ Mover historias entre estados del kanban
- ✅ Mostrar estadísticas de progreso

## 🚨 Solución de Problemas

### Error de Estados
Si ves errores como "Status must be one of: ['planning', ...]":
1. Ejecuta `python reset_db.py`
2. Verifica con `python verify_db.py`

### Error de Relaciones
Si hay errores de relaciones entre modelos:
1. Los modelos ya tienen las relaciones configuradas
2. No es necesario el archivo `relationships.py`

### Error de Autenticación
1. Asegúrate de estar logueado en el frontend
2. Verifica que el token JWT sea válido
3. Confirma que el usuario pertenezca a una organización

## 📝 Notas Importantes

- ✅ Todos los estados son consistentes entre migración, modelos y esquemas
- ✅ Las relaciones están configuradas correctamente
- ✅ Los datos de ejemplo incluyen casos realistas
- ✅ La autenticación funciona por organización
- ✅ Las estadísticas se calculan automáticamente

¡SmartPlanner está listo para usar! 🎉 