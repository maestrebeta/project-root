import React from 'react';
import { useAppTheme } from '../../context/ThemeContext';

export default function AccessDenied({ 
  title = "Acceso Denegado", 
  message = "No tienes permisos para acceder a esta funcionalidad.", 
  details = "Esta funcionalidad está reservada para usuarios con permisos específicos.",
  icon = "lock"
}) {
  const theme = useAppTheme();

  return (
    <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-8 ${theme.FONT_CLASS}`}>
      <div className={`
        relative 
        bg-white 
        border-2 
        ${theme.PRIMARY_BORDER_CLASS} 
        rounded-2xl 
        shadow-2xl 
        max-w-xl 
        w-full 
        p-10 
        overflow-hidden
        transition-all 
        duration-300 
        hover:shadow-3xl 
        hover:scale-[1.02]
      `}>
        {/* Fondo degradado sutil */}
        <div 
          className={`
            absolute 
            inset-0 
            opacity-10 
            ${theme.PRIMARY_GRADIENT_CLASS} 
            -z-10
          `}
        />

        {/* Ícono grande */}
        <div 
          className={`
            mx-auto 
            mb-6 
            w-24 
            h-24 
            flex 
            items-center 
            justify-center 
            rounded-full 
            ${theme.PRIMARY_BG_CLASS} 
            ${theme.PRIMARY_FONT_CLASS}
          `}
        >
          <span className="material-icons-outlined text-6xl">{icon}</span>
        </div>

        {/* Título */}
        <h2 
          className={`
            text-3xl 
            font-bold 
            mb-4 
            ${theme.PRIMARY_COLOR_CLASS}
          `}
        >
          {title}
        </h2>

        {/* Mensaje principal */}
        <p 
          className="
            text-lg 
            text-gray-700 
            mb-3 
            font-medium
          "
        >
          {message}
        </p>

        {/* Detalles adicionales */}
        <p 
          className="
            text-sm 
            text-gray-500 
            italic
            mb-6
          "
        >
          {details}
        </p>

        {/* Botón de retorno */}
        <button
          onClick={() => window.history.back()}
          className={`
            ${theme.PRIMARY_BUTTON_CLASS} 
            px-6 
            py-3 
            rounded-lg 
            flex 
            items-center 
            justify-center 
            gap-2 
            mx-auto 
            hover:opacity-90 
            transition-opacity
          `}
        >
          <span className="material-icons-outlined">arrow_back</span>
          Volver
        </button>

        {/* Decoración de fondo */}
        <div 
          className={`
            absolute 
            -top-10 
            -right-10 
            w-32 
            h-32 
            opacity-10 
            rounded-full 
            ${theme.PRIMARY_BG_CLASS}
            -z-20
          `}
        />
        <div 
          className={`
            absolute 
            -bottom-10 
            -left-10 
            w-32 
            h-32 
            opacity-10 
            rounded-full 
            ${theme.PRIMARY_BG_CLASS}
            -z-20
          `}
        />
      </div>
    </div>
  );
} 