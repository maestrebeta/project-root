import React from "react";
import { useAppTheme } from "../../context/ThemeContext";

const Footer = () => {
  const theme = useAppTheme();
  
  return (
    <footer className={`bg-white border-t border-gray-200 py-4 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} SmartPlanner. Todos los derechos reservados.
        </p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Términos</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacidad</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Ayuda</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;