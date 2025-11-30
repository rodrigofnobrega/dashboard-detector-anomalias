import React from 'react';
import Card from './Card';
import './InfoCard.css';

const InfoCard = ({ icon: Icon, label, value }) => (
  <Card>
    <div className="info-header">
      <Icon size={20} color="#9ca3af" />
      <span className="info-label">{label}</span>
    </div>
    <div className="info-value">
      {value}
    </div>
  </Card>
);

export default InfoCard;
