// Traducciones de roles del inglés (backend) al español (frontend)
export const ROLE_TRANSLATIONS = {
  'admin': 'Administrador',
  'dev': 'Desarrollador', 
  'infra': 'Infraestructura',
  'super_user': 'Super Usuario'
};

// Función para traducir un rol del inglés al español
export const translateRole = (role) => {
  return ROLE_TRANSLATIONS[role] || role;
};

// Función para obtener todos los roles en español para selects
export const getRolesForSelect = () => {
  return Object.entries(ROLE_TRANSLATIONS).map(([key, label]) => ({
    value: key,
    label: label
  }));
}; 