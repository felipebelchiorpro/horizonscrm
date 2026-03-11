import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Search, Plus, MoreHorizontal, Mail, Phone, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NewClientModal } from '../components/clientes/NewClientModal';

export interface Cliente {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    empresa: string;
    cargo?: string;
    documento?: string;
    cep?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    observacoes?: string;
    status: 'Ativo' | 'Inativo' | 'Lead';
    created: string;
    updated: string;
}

export function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Cliente | undefined>(undefined);
    const navigate = useNavigate();

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.actions-menu-dropdown') && !target.closest('.actions-menu-btn')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchClientes() {
        try {
            setLoading(true);
            console.log('Buscando lista de clientes...');
            const records = await pb.collection('clientes').getFullList<Cliente>({
                sort: '-created',
            });
            console.log('Clientes encontrados:', records.length, records);
            setClientes(records);
        } catch (error: any) {
            console.error('Erro ao buscar clientes:', error);
            if (error.status === 404) {
                console.warn('Coleção "clientes" não encontrada no PocketBase.');
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchClientes();

        // Inscrever para atualizações em tempo real
        pb.collection('clientes').subscribe('*', function (e) {
            console.log('Realtime update detected:', e.action, e.record);
            fetchClientes(); // Recarrega a lista completa para manter consistência
        });

        // Cleanup: desincrever ao desmontar
        return () => {
            pb.collection('clientes').unsubscribe('*');
        };
    }, []);

    const filteredClientes = clientes.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.empresa && c.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === '' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            // Optimistic update for immediate visual feedback
            const previousClients = [...clientes];
            setClientes(prev => prev.filter(c => c.id !== id));
            setOpenMenuId(null);

            try {
                console.log('Tentando excluir cliente ID:', id);
                await pb.collection('clientes').delete(id);
                console.log('Cliente excluído com sucesso');
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Não foi possível excluir o cliente. Os dados serão restaurados.');
                setClientes(previousClients); // Revert optimistic update
            }
        }
    };

    const handleEdit = (cliente: Cliente, e: React.MouseEvent) => {
        e.stopPropagation();
        setClientToEdit(cliente);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Ativo':
                return <span style={{ background: 'rgba(182, 255, 0, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(182, 255, 0, 0.2)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600 }}>Ativo</span>;
            case 'Lead':
                return <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600 }}>Lead</span>;
            case 'Inativo':
            default:
                return <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600 }}>Inativo</span>;
        }
    };

    return (
        <>
            <div className="animate-fade-in" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                            Gestão de <span className="text-gradient">Clientes</span>
                        </h1>
                        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Visualize e gerencie sua carteira de contatos.</p>
                    </div>

                    <button onClick={() => { setClientToEdit(undefined); setIsModalOpen(true); }} className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                        <Plus size={18} strokeWidth={2} /> Novo Cliente
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'visible' }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, empresa ou e-mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: 'auto', background: 'rgba(255,255,255,0.02)', padding: '0.65rem 1rem' }}
                            >
                                <option value="">Todos os Status</option>
                                <option value="Ativo">Ativo</option>
                                <option value="Lead">Lead</option>
                                <option value="Prospect">Prospect</option>
                                <option value="Inativo">Inativo</option>
                            </select>
                        </div>
                    </div>

                    {/* Table/List */}
                    <div style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>CLIENTE</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>CONTATO</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>STATUS</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Carregando clientes...
                                        </td>
                                    </tr>
                                ) : filteredClientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Nenhum cliente encontrado. Adicione seu primeiro cliente!
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClientes.map((cliente) => (
                                        <tr
                                            key={cliente.id}
                                            onClick={() => navigate(`/clientes/${cliente.id}`)}
                                            style={{ borderBottom: '1px solid var(--border-glass)', transition: 'var(--transition-fast)', cursor: 'pointer' }}
                                            className="hover:bg-[rgba(255,255,255,0.03)]"
                                        >
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, rgba(182,255,0,0.2), rgba(255,255,255,0.05))', border: '1px solid rgba(182,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 600 }}>
                                                        {cliente.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cliente.nome}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                                                            <Building2 size={12} /> {cliente.cargo ? `${cliente.cargo} em ` : ''}{cliente.empresa || 'Sem empresa'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Mail size={14} /> {cliente.email || '-'}
                                                    </span>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Phone size={14} /> {cliente.telefone || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                {getStatusBadge(cliente.status)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', position: 'relative' }}>
                                                <button
                                                    className="actions-menu-btn hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === cliente.id ? null : cliente.id);
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {openMenuId === cliente.id && (
                                                    <div
                                                        className="actions-menu-dropdown glass-panel animate-fade-in"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '2rem',
                                                            top: '2rem',
                                                            zIndex: 9999, // Super alto para garantir clique
                                                            minWidth: '150px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: '0.5rem',
                                                            gap: '0.25rem',
                                                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                                            pointerEvents: 'auto'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                navigate(`/clientes/${cliente.id}`);
                                                                setOpenMenuId(null);
                                                            }}
                                                            style={{ textAlign: 'left', padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', width: '100%', pointerEvents: 'auto' }}
                                                            className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                                                        >
                                                            Ver Perfil
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleEdit(cliente, e);
                                                            }}
                                                            style={{ textAlign: 'left', padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', width: '100%', pointerEvents: 'auto' }}
                                                            className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                                                        >
                                                            Editar Cliente
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDelete(cliente.id, e);
                                                            }}
                                                            style={{ textAlign: 'left', padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', width: '100%', pointerEvents: 'auto' }}
                                                            className="hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                                                        >
                                                            Excluir Cliente
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <NewClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchClientes}
                initialData={clientToEdit}
            />
        </>
    );
}
