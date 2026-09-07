import React from 'react';

interface AvatarShapeProps {
  color: string;
  size?: number;
  label?: string;
  className?: string;
}

export function AvatarShape({ color, size = 64, label, className = '' }: AvatarShapeProps) {
  const innerLabel = label ? label.charAt(0).toUpperCase() : '';

  return (
    <div 
      className={`relative flex items-center justify-center rounded-full ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        boxShadow: 'inset -4px -4px 10px rgba(0,0,0,0.3), 4px 4px 10px rgba(0,0,0,0.5)'
      }}
    >
      <div className="relative z-20 text-white font-black" style={{ fontSize: size * 0.5, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
        {innerLabel}
      </div>
    </div>
  );
}
