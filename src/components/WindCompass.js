import React from 'react';

const WindCompass = ({ direction = 0, size = 120 }) => {
  // direction is degrees where 0 = North, 90 = East
  const rotationStyle = {
    transform: `rotate(${direction}deg)`,
    transition: 'transform 0.4s ease',
    transformOrigin: '50% 50%'
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="45" fill="none" stroke="#ccc" strokeWidth="2" />
      <g style={rotationStyle}>
        <polygon points="50,12 45,52 50,47 55,52" fill="#e53935" stroke="#333" strokeWidth="0.5" />
      </g>
      <text x="50" y="20" textAnchor="middle" fill="#ddd" fontSize="8">N</text>
      <text x="78" y="52" textAnchor="middle" fill="#ddd" fontSize="8">E</text>
      <text x="50" y="86" textAnchor="middle" fill="#ddd" fontSize="8">S</text>
      <text x="22" y="52" textAnchor="middle" fill="#ddd" fontSize="8">W</text>
    </svg>
  );
};

export default WindCompass;
