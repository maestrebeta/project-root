import React from 'react';
import { useAppTheme } from '../../context/ThemeContext';

export default function SettingsSection({ 
  title, 
  description, 
  icon: Icon,
  children 
}) {
  const theme = useAppTheme();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon className={`w-6 h-6 ${theme.PRIMARY_COLOR_CLASS}`} />}
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
} 