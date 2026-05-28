import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Parcelas from './pages/Parcelas.jsx';
import Nodos from './pages/Nodos.jsx';
import Alertas from './pages/Alertas.jsx';
import Perfiles from './pages/Perfiles.jsx';
import Usuarios from './pages/Usuarios.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="parcelas" element={<Parcelas />} />
            <Route path="nodos" element={<Nodos />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="perfiles" element={<RutaProtegida soloAdmin><Perfiles /></RutaProtegida>} />
            <Route path="usuarios" element={<RutaProtegida soloAdmin><Usuarios /></RutaProtegida>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}