import React from 'react';
import Card from './Card';
import './LineCard.css';

const LineCard = ({ label, value, unit, colorStyles }) => (
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
      <span className="line-value">{value.toFixed(3)}</span>
      <span className="line-unit">{unit}</span>
    </div>
  </Card>
);

export default LineCard;
