# Guía de Migraciones de Base de Datos

Este proyecto utiliza Alembic para manejar las migraciones de la base de datos. A continuación, se describe cómo trabajar con las migraciones.

## Configuración Inicial

La configuración ya está realizada. Los archivos principales son:
- `alembic.ini`: Configuración general de Alembic
- `alembic/env.py`: Configuración de la integración con SQLAlchemy
- Las migraciones se almacenan en `alembic/versions/`

## Comandos Comunes

### 1. Crear una Nueva Migración

Para crear una nueva migración después de modificar los modelos:

```bash
cd backend
alembic revision --autogenerate -m "descripción del cambio"
```

Esto generará un nuevo archivo en `alembic/versions/` con los cambios detectados.

### 2. Aplicar Migraciones

Las migraciones se aplican automáticamente al iniciar la aplicación, pero también puedes aplicarlas manualmente:

```bash
cd backend
alembic upgrade head
```

### 3. Revertir Migraciones

Para revertir la última migración:

```bash
cd backend
alembic downgrade -1
```

Para revertir a una versión específica:

```bash
cd backend
alembic downgrade <revision_id>
```

### 4. Ver Estado de Migraciones

Para ver qué migraciones están pendientes:

```bash
cd backend
alembic current
alembic history
```

## Buenas Prácticas

1. **Siempre revisar las migraciones autogeneradas**: Alembic puede no detectar todos los cambios correctamente.
2. **Hacer commit de las migraciones**: Los archivos de migración deben estar en control de versiones.
3. **Probar las migraciones**: Siempre probar las migraciones en un ambiente de desarrollo antes de aplicarlas en producción.
4. **Documentar cambios complejos**: Si una migración incluye transformaciones de datos complejas, documentarlas en el archivo de migración.

## Solución de Problemas

Si encuentras problemas con las migraciones:

1. Verifica que todos los modelos estén importados correctamente en `env.py`
2. Asegúrate de que la URL de la base de datos sea correcta en `alembic.ini`
3. Si hay conflictos, puedes intentar:
   - Revertir a una versión anterior conocida
   - Eliminar la base de datos y recrearla (solo en desarrollo)
   - Revisar el historial de migraciones para identificar el problema 