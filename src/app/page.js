"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, CheckCircle2, Thermometer, Clock, Hash, Zap, AlertTriangle, Battery } from 'lucide-react';

// Import local components
import Card from '../components/Card';
import Badge from '../components/Badge';
import LineCard from '../components/LineCard'; // Renamed import
import InfoCard from '../components/InfoCard';

// Import CSS
import './page.css';

export default function Dashboard() {
  const [status, setStatus] = useState('connected');
  const [currentReadings, setCurrentReadings] = useState({
    ax: 0, ay: 0, az: 0, 
    temp: 0,
    peak_frequency: 0,
    probability: 0,
    energy: 0, // Added Energy
    is_anomaly: false,
    timestamp: new Date().toLocaleTimeString(),
    samples: 0
  });
  const [history, setHistory] = useState([]);
  const MAX_HISTORY = 30; 

  useEffect(() => {
    // -------------------------------------------------------------------------
    // REAL MQTT INTEGRATION:
    // const payload = JSON.parse(message.toString()); 
    // updateDashboard(payload);
    // -------------------------------------------------------------------------

    const interval = setInterval(() => {
      const now = new Date();
      
      const newAx = (Math.random() - 0.5) * 2; 
      const newAy = (Math.random() - 0.5) * 2;
      const newAz = 9.8 + (Math.random() - 0.5) * 1.5;
      const newPeakFreq = 5 + Math.random() * 50; 
      const newProb = Math.random(); 
      const newEnergy = Math.random() * 10; // Simulated Energy 0-10
      const newIsAnomaly = newProb > 0.8 ? "true" : "false"; 

      const newDataPoint = {
        time: now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ax: newAx, 
        ay: newAy, 
        az: newAz, 
        peak_frequency: newPeakFreq,
        probability: newProb,
        energy: newEnergy, // Added to data point
        is_anomaly: newIsAnomaly === "true",
        temp: 30 + Math.random() * 5, 
        samples: Math.floor(Math.random() * 1000) 
      };

      setCurrentReadings(prev => ({
        ...newDataPoint,
        timestamp: newDataPoint.time,
        samples: prev.samples + 1
      }));

      setHistory(prev => {
        const newHistory = [...prev, newDataPoint];
        return newHistory.length > MAX_HISTORY ? newHistory.slice(newHistory.length - MAX_HISTORY) : newHistory;
      });
    }, 1000); 

    return () => clearInterval(interval);
  }, []);

  const isSystemNormal = !currentReadings.is_anomaly;

  return (
    <div className="dashboard-container">
      <div className="max-width-wrapper">
        
        {/* Header */}
        <header className="header">
          <div className="header-title-group">
            <div className="icon-box">
              <Activity size={24} />
            </div>
            <div className="title">
              <h1>Dashboard Acelerômetro</h1>
              <p>Monitoramento em tempo real</p>
            </div>
          </div>
          <Badge status={status} />
        </header>

        {/* Status Banner */}
        <div className={`status-banner ${isSystemNormal ? 'normal' : 'alert'}`}>
          <div className="status-icon">
            {isSystemNormal ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="status-text">
            <h3>{isSystemNormal ? 'Sistema Normal' : 'Anomalia Detectada'}</h3>
            <p>
              {isSystemNormal 
                ? 'Todos os parâmetros estão dentro do esperado.' 
                : 'Padrão de vibração anômalo detectado pelo modelo ML.'}
            </p>
          </div>
        </div>

        {/* Top Row: Axis Cards + Temperature */}
        <div className="grid-4">
          <LineCard 
            label="Eixo X" 
            value={currentReadings.ax} 
            unit="m/s²" 
            colorStyles={{ bg: '#dbeafe', text: '#2563eb' }} 
          />
          <LineCard 
            label="Eixo Y" 
            value={currentReadings.ay} 
            unit="m/s²" 
            colorStyles={{ bg: '#dcfce7', text: '#16a34a' }} 
          />
          <LineCard 
            label="Eixo Z" 
            value={currentReadings.az} 
            unit="m/s²" 
            colorStyles={{ bg: '#ffedd5', text: '#ea580c' }} 
          />
           <LineCard 
            label="Temp" 
            value={(currentReadings.temp || 0)} 
            unit="°C" 
            colorStyles={{ bg: '#fee2e2', text: '#ef4444' }} 
          />
        </div>

        {/* Main Content Grid: Probability Chart + Axis Chart */}
        <div className="grid-main">
          
          {/* Probability Chart (Left) */}
          <Card style={{ minHeight: '400px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Probabilidade</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Histórico de Detecção (ML)</p>
            </div>
            
             <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="time" 
                    tick={{fontSize: 10, fill: '#9CA3AF'}} 
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#8b5cf6'}} 
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="probability" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Probabilidade" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Main Axis Chart (Right) */}
          <Card style={{ minHeight: '400px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Histórico de Aceleração</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Eixos X, Y, Z</p>
            </div>
            
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="time" 
                    tick={{fontSize: 12, fill: '#9CA3AF'}} 
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#9CA3AF'}} 
                    tickLine={false}
                    axisLine={false}
                    domain={[-5, 15]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="ax" stroke="#3B82F6" strokeWidth={2} dot={false} name="Eixo X" isAnimationActive={false} />
                  <Line type="monotone" dataKey="ay" stroke="#22C55E" strokeWidth={2} dot={false} name="Eixo Y" isAnimationActive={false} />
                  <Line type="monotone" dataKey="az" stroke="#F97316" strokeWidth={2} dot={false} name="Eixo Z" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Bottom Cards - Now with Energy */}
        <div className="grid-5">
          <InfoCard icon={Clock} label="Última Leitura" value={currentReadings.timestamp} />
          <InfoCard icon={Hash} label="Amostras" value={currentReadings.samples} />
          <InfoCard 
            icon={Activity} 
            label="Pico Frequência" 
            value={`${(currentReadings.peak_frequency || 0).toFixed(2)} Hz`} 
          />
          <InfoCard 
            icon={Zap} 
            label="Energia" 
            value={(currentReadings.energy || 0).toFixed(2)} 
          />
          <InfoCard 
            icon={Activity} 
            label="Magnitude" 
            value={`${(currentReadings.magnitude || 0).toFixed(2)} m/s²`} 
          />
        </div>

      </div>
    </div>
  );
}