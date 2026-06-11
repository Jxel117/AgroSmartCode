import { Routes, Route } from 'react-router-dom';
import RutaProtegida from './components/RutaProtegida.jsx';
import RutaPublica from './components/RutaPublica.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Parcelas from './pages/Parcelas.jsx';
import Nodos from './pages/Nodos.jsx';
import Alertas from './pages/Alertas.jsx';
import Perfiles from './pages/Perfiles.jsx';
import Usuarios from './pages/Usuarios.jsx';
import OlvidarPassword from './pages/OlvidarPassword.jsx';
import ActivarCuenta from './pages/ActivarCuenta.jsx';
import RegistrarEmpresa from './pages/RegistrarEmpresa.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RutaPublica><Login /></RutaPublica>} />
      <Route path="/olvidar-password" element={<RutaPublica><OlvidarPassword /></RutaPublica>} />
      <Route path="/registrar-empresa" element={<RutaPublica><RegistrarEmpresa /></RutaPublica>} />
      <Route path="/activar/:token" element={<RutaPublica><ActivarCuenta modo="activar" /></RutaPublica>} />
      <Route path="/recuperar/:token" element={<RutaPublica><ActivarCuenta modo="recuperar" /></RutaPublica>} />

      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Dashboard />} />
        <Route path="parcelas" element={<Parcelas />} />
        <Route path="nodos" element={<Nodos />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="perfiles" element={<Perfiles />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
    </Routes>
  );
}