import React from 'react';
import Card from './Card';
import './LineCard.css';

const LineCard = ({ label, value, unit, colorStyles }) => {
  // Safe conversion: Convert to Number, default to 0 if invalid
  const numericValue = Number(value) || 0;

  return (
    <Card className="line-card">
      <div className="line-header">
        <span className="line-label">{label}</span>
        <div 
          className="line-icon"
          style={{ backgroundColor: colorStyles.bg, color: colorStyles.text }}
        >
          {label.split(' ')[1]}
        </div>
      </div>
      <div>
        {/* Now use numericValue which is guaranteed to be a number */}
        <span className="line-value">{numericValue.toFixed(3)}</span>
        <span className="line-unit">{unit}</span>
      </div>
    </Card>
  );
};

export default LineCard;