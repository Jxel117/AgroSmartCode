import { useState } from 'react';
import LogEventos from '../components/LogEventos';
import StatsPanel from '../components/StatsPanel';
import ExportPanel from '../components/ExportPanel';
import EncabezadoPagina from '../components/EncabezadoPagina';

const TABS = [
  { id: 'log', label: 'Log de eventos' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'export', label: 'Exportar' },
];

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('log');

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/logo_agrosmart_planta.svg"
              alt="AgroSmart"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1>AgroSmart — Panel de Auditoría</h1>
          </div>
          <div className="header-user">
            {user.correo}
            <button className="btn" onClick={onLogout} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <EncabezadoPagina
          titulo="Auditoría"
          descripcion="Monitoreo de eventos y actividades del sistema AgroSmart"
        />

        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'log' && <LogEventos />}
        {activeTab === 'stats' && <StatsPanel />}
        {activeTab === 'export' && <ExportPanel />}
      </main>
    </>
  );
}
