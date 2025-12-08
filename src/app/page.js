"use client";
import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt'; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, CheckCircle2, Clock, Hash, Zap, AlertTriangle, Bell, X } from 'lucide-react';

import Card from '../components/Card';
import Badge from '../components/Badge';
import LineCard from '../components/LineCard'; 
import InfoCard from '../components/InfoCard';

import './page.css';

const MQTT_BROKER_URL = 'wss://test.mosquitto.org:8081/mqtt'; 
const MQTT_TOPIC = 'sensor/accelerometer/data'; 

export default function Dashboard() {
  const [status, setStatus] = useState('disconnected');
  
  const [currentReadings, setCurrentReadings] = useState({
    ax: 0, ay: 0, az: 0, temp: 0, 
    peak_frequency: 0,
    probability: 0,
    energy: 0, 
    magnitude: 0,
    is_anomaly: false,
    timestamp: '--:--:--',
    samples: 0
  });
  
  const [history, setHistory] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const lastAlertTimeRef = useRef(0);
  const MAX_HISTORY = 30; 

  useEffect(() => {
    console.log('Connecting to MQTT...');
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `nextjs_${Math.random().toString(16).slice(3)}`, 
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('MQTT Connected');
      setStatus('connected');
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to ${MQTT_TOPIC}`);
        }
      });
    });

    client.on('error', (err) => {
      console.error('Connection error: ', err);
      setStatus('error');
      client.end();
    });

    client.on('reconnect', () => {
      setStatus('reconnecting');
    });

    client.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          
          const now = new Date();
          const timestamp = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

          const isAnomaly = payload.is_anomaly === true || payload.is_anomaly === "true";

          const newDataPoint = {
            time: timestamp,
            ax: payload.ax,
            ay: payload.ay,
            az: payload.az,
            temp: payload.temp || 0,
            magnitude: payload.magnitude,
            peak_frequency: payload.peak_frequency,
            energy: payload.energy,
            probability: payload.probability,
            is_anomaly: isAnomaly, 
          };

          setCurrentReadings(prev => ({
            ...newDataPoint,
            timestamp: timestamp,
            samples: prev.samples + 1
          }));

          setHistory(prev => {
            const newHistory = [...prev, newDataPoint];
            return newHistory.length > MAX_HISTORY ? newHistory.slice(newHistory.length - MAX_HISTORY) : newHistory;
          });

          if (isAnomaly) {
            const currentTime = Date.now();
            if (currentTime - lastAlertTimeRef.current > 2000) {
              lastAlertTimeRef.current = currentTime;
              
              const newAlert = {
                id: currentTime,
                time: timestamp,
                prob: (payload.probability * 100).toFixed(1),
                energy: payload.energy.toFixed(0),
                type: payload.probability > 0.8 ? 'CRITICAL' : 'WARNING'
              };

              setRecentAlerts(prev => [newAlert, ...prev]);
            }
          }

        } catch (error) {
          console.error('Error parsing MQTT message:', error);
        }
      }
    });

    return () => {
      if (client.connected) {
        client.end();
      }
    };
  }, []); 

  const isSystemNormal = !currentReadings.is_anomaly;
  const clearAlerts = () => setRecentAlerts([]);

  return (
    <div className="dashboard-container">
      <div className="max-width-wrapper">
        
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {recentAlerts.length > 0 && (
                <div className="alert-count-badge">
                  {recentAlerts.length} Anomalias
                </div>
            )}
            <Badge status={status} />
          </div>
        </header>

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

        {recentAlerts.length > 0 && (
          <Card className="alerts-section">
            <div className="alerts-header">
              <div className="alerts-title">
                <Bell size={20} className="text-red-500" />
                <h3>Registro de Alertas</h3>
              </div>
              <button onClick={clearAlerts} className="clear-btn">
                <X size={16} /> Limpar
              </button>
            </div>
            
            <div className="alerts-list" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
              {recentAlerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type.toLowerCase()}`}>
                  <div className="alert-time">{alert.time}</div>
                  <div className="alert-info">
                    <span className="alert-badge">{alert.type === 'CRITICAL' ? 'CRÍTICO' : 'ALERTA'}</span>
                    <span className="alert-desc">
                      Probabilidade: <strong>{alert.prob}%</strong> | Energia: {alert.energy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid-4">
          <LineCard 
            label="Eixo X" 
            value={currentReadings.ax?.toFixed(2)} 
            unit="m/s²" 
            colorStyles={{ bg: '#dbeafe', text: '#2563eb' }} 
          />
          <LineCard 
            label="Eixo Y" 
            value={currentReadings.ay?.toFixed(2)} 
            unit="m/s²" 
            colorStyles={{ bg: '#dcfce7', text: '#16a34a' }} 
          />
          <LineCard 
            label="Eixo Z" 
            value={currentReadings.az?.toFixed(2)} 
            unit="m/s²" 
            colorStyles={{ bg: '#ffedd5', text: '#ea580c' }} 
          />
          <LineCard 
            label="Temperatura" 
            value={currentReadings.temp?.toFixed(1)} 
            unit="°C" 
            colorStyles={{ bg: '#fee2e2', text: '#dc2626' }} 
          />
        </div>

        <div className="grid-main">
          
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
                    domain={['auto', 'auto']} 
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
