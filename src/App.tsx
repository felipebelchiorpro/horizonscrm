import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Negocios } from './pages/Negocios';
import { Projetos } from './pages/Projetos';
import { ProjetoDetalhes } from './pages/ProjetoDetalhes';
import { Contratos } from './pages/Contratos';
import { Servicos } from './pages/Servicos';
import { ClientProfile } from './pages/ClientProfile';
import { OrdensServico } from './pages/OrdensServico';
import { MeuPerfil } from './pages/MeuPerfil';
import { Equipe } from './pages/Equipe';
import { Login } from './pages/Login';
import { pb } from './lib/pocketbase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setIsAuthenticated(pb.authStore.isValid);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClientProfile />} />
          <Route path="negocios" element={<Negocios />} />
          <Route path="projetos" element={<Projetos />} />
          <Route path="projetos/:id" element={<ProjetoDetalhes />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="ordens-servico" element={<OrdensServico />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="perfil" element={<MeuPerfil />} />
          <Route path="equipe" element={<Equipe />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
