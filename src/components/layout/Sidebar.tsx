import { NavLink } from 'react-router-dom';
import { pb } from '../../lib/pocketbase';

const navGroups = [
    {
        title: 'PRINCIPAL',
        items: [
            { label: 'Dashboard', path: '/' },
        ]
    },
    {
        title: 'GESTÃO DE VENDAS',
        items: [
            { label: 'Clientes', path: '/clientes' },
            { label: 'Negócios (Funil)', path: '/negocios' },
            { label: 'Contratos', path: '/contratos' },
        ]
    },
    {
        title: 'GESTÃO OPERACIONAL',
        items: [
            { label: 'Projetos (Kanban)', path: '/projetos' },
            { label: 'Ordens de Serviço', path: '/ordens-servico' },
            { label: 'Catálogo de Serviços', path: '/servicos' },
        ]
    },
    {
        title: 'SISTEMA',
        items: [
            { label: 'Meu Perfil', path: '/perfil' },
            { label: 'Equipe', path: '/equipe', adminOnly: true },
        ]
    }
];

interface SidebarProps {
    isOpen?: boolean;
}

export function Sidebar({ isOpen = true }: SidebarProps) {
    return (
        <aside className={`sidebar glass-panel ${!isOpen ? 'collapsed' : ''}`}>
            <div className="sidebar-header" style={{ padding: '3rem 0 2rem', display: 'flex', justifyContent: 'center', gap: '1.25rem', alignItems: 'center' }}>
                <div className="sidebar-logo-icon">
                    <div className="sidebar-logo-icon-inner"></div>
                </div>
                <h1 style={{ fontSize: '1.75rem', lineHeight: '1.1', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>
                    Horizons<br />CRM
                </h1>
            </div>

            <nav className="sidebar-nav">
                {navGroups.map((group, groupIdx) => (
                    <div key={groupIdx} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 600, 
                            color: 'var(--text-muted)', 
                            letterSpacing: '0.08em', 
                            marginBottom: '0.75rem',
                            paddingLeft: '1.25rem',
                            textTransform: 'uppercase'
                        }}>
                            {group.title}
                        </div>
                        {group.items.filter(item => !item.adminOnly || pb.authStore.isSuperuser || pb.authStore.model?.role === 'Admin').map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-btn">
                    Configurações
                </button>
                <button className="nav-btn" onClick={() => pb.authStore.clear()}>
                    Sair
                </button>
                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', lineHeight: 1.4 }}>
                    &copy; Todos direitos reservados<br/>
                    2026 GRUPO BELCHIOR<br/>VENTURE INVESTIMENTOS
                </div>
            </div>
        </aside>
    );
}
