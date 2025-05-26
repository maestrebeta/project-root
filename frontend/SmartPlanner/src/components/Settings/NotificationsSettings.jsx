import React from 'react';
import { FiBell } from 'react-icons/fi';
import SettingsSection from './SettingsSection';
import { useAppTheme } from '../../context/ThemeContext';

export default function NotificationsSettings() {
  const theme = useAppTheme();

  return (
    <SettingsSection
      title="Notificaciones"
      description="Configura cómo y cuándo quieres recibir notificaciones"
      icon={FiBell}
    >
      {/* Notificaciones del Sistema */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Notificaciones del Sistema</h3>
          <p className="text-sm text-gray-500 mb-4">Configura las notificaciones generales de la aplicación</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Notificaciones Push</label>
                <p className="text-sm text-gray-500">Recibe notificaciones en tiempo real</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Notificaciones por Email</label>
                <p className="text-sm text-gray-500">Recibe un resumen diario por correo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Notificaciones de Tareas</h3>
          <p className="text-sm text-gray-500 mb-4">Configura las notificaciones relacionadas con tareas</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Asignación de Tareas</label>
                <p className="text-sm text-gray-500">Cuando te asignan una nueva tarea</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Cambios de Estado</label>
                <p className="text-sm text-gray-500">Cuando una tarea cambia de estado</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Menciones</label>
                <p className="text-sm text-gray-500">Cuando alguien te menciona en un comentario</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Recordatorios</h3>
          <p className="text-sm text-gray-500 mb-4">Configura los recordatorios automáticos</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Tareas Pendientes</label>
                <p className="text-sm text-gray-500">Recordatorio diario de tareas pendientes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Fechas Límite</label>
                <p className="text-sm text-gray-500">Recordatorio de fechas límite próximas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${theme.PRIMARY_COLOR}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${theme.PRIMARY_COLOR}-600`}></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
} 