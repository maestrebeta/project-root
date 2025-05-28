# 🚀 SmartPlanner - Sistema de Gestión de Proyectos ÉPICO

## ✨ Descripción

**SmartPlanner** es un sistema de gestión de proyectos de nivel empresarial con una interfaz de usuario revolucionaria y funcionalidades avanzadas de planificación ágil. Diseñado para equipos que buscan una experiencia de gestión de proyectos verdaderamente **INOLVIDABLE**.

## 🎯 Características Principales

### 🎨 **UI/UX Épica**
- **Interfaz Glassmorphism**: Efectos de cristal y backdrop blur
- **Animaciones Fluidas**: Powered by Framer Motion
- **Gradientes Épicos**: Colores vibrantes y transiciones suaves
- **Responsive Design**: Optimizado para todos los dispositivos
- **Modo Oscuro**: Experiencia visual adaptable

### 📊 **Gestión de Proyectos**
- **Dashboard Inteligente**: Métricas en tiempo real
- **Múltiples Vistas**: Kanban, Lista, Timeline
- **Filtros Avanzados**: Por estado, prioridad, usuario
- **Estadísticas Dinámicas**: Progreso y analíticas automáticas

### 🎯 **Planificación Ágil**
- **Épicas y Historias**: Gestión completa de backlog
- **Drag & Drop Avanzado**: Cambio de estados fluido
- **Story Points**: Estimación y planificación
- **Criterios de Aceptación**: Definición clara de objetivos
- **Valor de Negocio**: Priorización basada en impacto

### 👥 **Gestión de Equipos**
- **Asignación de Tareas**: Distribución inteligente
- **Carga de Trabajo**: Visualización de capacidad
- **Colaboración**: Comentarios y actividad en tiempo real
- **Roles y Permisos**: Control de acceso granular

### 📈 **Analíticas y Reportes**
- **Métricas de Rendimiento**: Velocidad del equipo
- **Burndown Charts**: Progreso del sprint
- **Time Tracking**: Seguimiento de horas
- **Reportes Automáticos**: Insights inteligentes

## 🛠️ Tecnologías

### **Frontend**
- **React 18**: Framework principal
- **Framer Motion**: Animaciones épicas
- **Tailwind CSS**: Estilos utilitarios
- **React Icons**: Iconografía moderna
- **@dnd-kit**: Drag & drop avanzado
- **React Router**: Navegación SPA

### **Backend**
- **FastAPI**: Framework Python moderno
- **SQLAlchemy**: ORM avanzado
- **PostgreSQL**: Base de datos robusta
- **Alembic**: Migraciones de BD
- **JWT**: Autenticación segura
- **Pydantic**: Validación de datos

## 🚀 Instalación y Configuración

### **Prerrequisitos**
```bash
# Node.js 18+
node --version

# Python 3.9+
python --version

# PostgreSQL 13+
psql --version
```

### **Backend Setup**
```bash
# Clonar repositorio
git clone <repository-url>
cd project-root/backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
createdb smartplanner_db

# Ejecutar migraciones
alembic upgrade head

# Inicializar datos
python -m app.core.init_data

# Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**
```bash
# Navegar al frontend
cd ../frontend/SmartPlanner

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📁 Estructura del Proyecto

```
project-root/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuración y seguridad
│   │   ├── models/         # Modelos de base de datos
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── crud/           # Operaciones CRUD
│   │   ├── routers/        # Endpoints API
│   │   └── main.py         # Aplicación principal
│   ├── alembic/            # Migraciones
│   └── requirements.txt    # Dependencias Python
├── frontend/
│   └── SmartPlanner/
│       ├── src/
│       │   ├── components/ # Componentes React
│       │   ├── context/    # Context providers
│       │   ├── services/   # Servicios API
│       │   └── main.jsx    # Punto de entrada
│       ├── public/         # Archivos estáticos
│       └── package.json    # Dependencias Node
└── README.md
```

## 🎮 Uso del Sistema

### **1. Gestión de Proyectos**
1. **Crear Proyecto**: Botón "Nuevo Proyecto" en dashboard
2. **Configurar Detalles**: Nombre, tipo, fechas, estimaciones
3. **Asignar Equipo**: Seleccionar miembros y roles
4. **Definir Objetivos**: Criterios de éxito y métricas

### **2. Planificación Ágil**
1. **Crear Épicas**: Agrupar funcionalidades relacionadas
2. **Definir Historias**: Desglosar épicas en tareas específicas
3. **Estimar Esfuerzo**: Story points y horas de desarrollo
4. **Priorizar Backlog**: Ordenar por valor de negocio

### **3. Ejecución y Seguimiento**
1. **Tablero Kanban**: Visualizar flujo de trabajo
2. **Drag & Drop**: Mover historias entre estados
3. **Actualizar Progreso**: Comentarios y cambios de estado
4. **Monitorear Métricas**: Dashboard en tiempo real

### **4. Colaboración**
1. **Asignar Tareas**: Distribuir trabajo al equipo
2. **Comentarios**: Comunicación contextual
3. **Notificaciones**: Alertas de cambios importantes
4. **Actividad**: Historial completo de acciones

## 🔧 Configuración Avanzada

### **Variables de Entorno**

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost/smartplanner_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=SmartPlanner
```

### **Personalización de Estados**
```javascript
// Configurar estados personalizados del kanban
const customStates = [
  { id: 'backlog', label: 'Backlog', color: '#6B7280', icon: '📋' },
  { id: 'todo', label: 'Por Hacer', color: '#3B82F6', icon: '📝' },
  { id: 'in_progress', label: 'En Progreso', color: '#F59E0B', icon: '⚡' },
  { id: 'done', label: 'Completado', color: '#10B981', icon: '✅' }
];
```

## 🎨 Componentes Principales

### **PlanningContainer**
- Contenedor principal del módulo de planificación
- Gestión de estado global
- Integración con servicios backend

### **KanbanBoard**
- Tablero drag & drop épico
- Animaciones fluidas
- Estados personalizables

### **StoryDetailsModal**
- Modal completo para gestión de historias
- Tabs organizados (Detalles, Planificación, Actividad)
- Integración completa con backend

### **EpicModal**
- Gestión de épicas
- Formulario avanzado
- Validaciones en tiempo real

## 🔌 API Endpoints

### **Proyectos**
```
GET    /projects/              # Listar proyectos
POST   /projects/              # Crear proyecto
GET    /projects/{id}          # Obtener proyecto
PUT    /projects/{id}          # Actualizar proyecto
DELETE /projects/{id}          # Eliminar proyecto
GET    /projects/stats         # Estadísticas
```

### **Épicas**
```
GET    /epics/                 # Listar épicas
POST   /epics/                 # Crear épica
GET    /epics/{id}             # Obtener épica
PUT    /epics/{id}             # Actualizar épica
DELETE /epics/{id}             # Eliminar épica
GET    /epics/project/{id}     # Épicas por proyecto
```

### **Historias de Usuario**
```
GET    /epics/stories/         # Listar historias
POST   /epics/stories/         # Crear historia
GET    /epics/stories/{id}     # Obtener historia
PUT    /epics/stories/{id}     # Actualizar historia
DELETE /epics/stories/{id}     # Eliminar historia
```

## 🎯 Funcionalidades Épicas

### **Drag & Drop Inteligente**
- Detección automática de zonas de drop
- Animaciones de feedback visual
- Actualización de estado en tiempo real
- Rollback automático en caso de error

### **Filtros Avanzados**
- Filtro por múltiples criterios
- Búsqueda en tiempo real
- Guardado de filtros favoritos
- Filtros inteligentes sugeridos

### **Métricas en Tiempo Real**
- Cálculo automático de progreso
- Estadísticas de velocidad del equipo
- Predicciones de finalización
- Alertas de riesgo automáticas

### **Colaboración Avanzada**
- Comentarios con menciones
- Historial de actividad completo
- Notificaciones inteligentes
- Sincronización en tiempo real

## 🚀 Despliegue en Producción

### **Docker Setup**
```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/smartplanner
    depends_on:
      - db

  frontend:
    build: ./frontend/SmartPlanner
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=smartplanner
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔒 Seguridad

### **Autenticación**
- JWT tokens con expiración
- Refresh tokens automáticos
- Logout seguro
- Protección CSRF

### **Autorización**
- Roles y permisos granulares
- Acceso basado en organización
- Validación en frontend y backend
- Auditoría de acciones

### **Validación de Datos**
- Esquemas Pydantic estrictos
- Sanitización de inputs
- Validación de tipos
- Manejo seguro de errores

## 📊 Monitoreo y Logs

### **Logging**
```python
# Configuración de logs
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### **Métricas**
- Tiempo de respuesta de API
- Uso de memoria y CPU
- Errores y excepciones
- Actividad de usuarios

## 🤝 Contribución

### **Guías de Desarrollo**
1. **Fork** el repositorio
2. **Crear** rama feature (`git checkout -b feature/amazing-feature`)
3. **Commit** cambios (`git commit -m 'Add amazing feature'`)
4. **Push** a la rama (`git push origin feature/amazing-feature`)
5. **Abrir** Pull Request

### **Estándares de Código**
- **Python**: PEP 8, type hints
- **JavaScript**: ESLint, Prettier
- **Commits**: Conventional Commits
- **Tests**: Cobertura mínima 80%

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🎉 Créditos

Desarrollado con ❤️ por el equipo de SmartPlanner.

**¡Gracias por usar SmartPlanner! 🚀**

---

## 🔥 Próximas Funcionalidades

- [ ] **Integración con Slack/Teams**
- [ ] **Reportes PDF automáticos**
- [ ] **Plantillas de proyecto**
- [ ] **Integración con Git**
- [ ] **App móvil nativa**
- [ ] **IA para estimaciones**
- [ ] **Integración con calendarios**
- [ ] **Webhooks personalizados**

---

*SmartPlanner - Donde la planificación se vuelve épica* ✨ 