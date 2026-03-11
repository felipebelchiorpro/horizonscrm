import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import {
    ArrowLeft, Mail, Phone, Building2, MapPin,
    Briefcase, FileText, History, Plus,
    ShieldCheck, ExternalLink, Wrench, CheckCircle, Clock
} from 'lucide-react';
import { NewOSModal } from '../components/ordens/NewOSModal';
import { NewClientModal } from '../components/clientes/NewClientModal';
import { NewSupportModal } from '../components/clientes/NewSupportModal';

interface Cliente {
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
    status: string;
    observacoes?: string;
    created: string;
}

export function ClientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [negocios, setNegocios] = useState<any[]>([]);
    const [contratos, setContratos] = useState<any[]>([]);
    const [ordens, setOrdens] = useState<any[]>([]);
    const [suportes, setSuportes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'geral' | 'negocios' | 'contratos' | 'os' | 'suporte'>('geral');
    const [isOSModalOpen, setIsOSModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchClientData();
        }
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const [clientRec, dealsRec, contractsRec] = await Promise.all([
                pb.collection('clientes').getOne<Cliente>(id!),
                pb.collection('negocios').getFullList({ filter: `cliente = "${id}"`, sort: '-created' }),
                pb.collection('contratos').getFullList({ filter: `cliente = "${id}"`, sort: '-created' }),
                // ordens_servico might not exist yet, we'll try/catch separately or check collections first
            ]);

            setCliente(clientRec);
            setNegocios(dealsRec);
            setContratos(contractsRec);

            // Attempt to fetch OS if collection exists
            try {
                const osRec = await pb.collection('ordens_servico').getFullList({ filter: `cliente = "${id}"`, sort: '-created' });
                setOrdens(osRec);
            } catch (e) {
                console.log('Ordem de Serviço collection not found or accessible');
            }

            // Attempt to fetch Suporte logs if collection exists
            try {
                const suporteRec = await pb.collection('suporte').getFullList({ filter: `cliente = "${id}"`, sort: '-data_atividade' });
                setSuportes(suporteRec);
            } catch (e) {
                console.log('Suporte collection not found or accessible');
            }

        } catch (error) {
            console.error('Error fetching client profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando perfil...</div>;
    if (!cliente) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Cliente não encontrado</h2>
            <button onClick={() => navigate('/clientes')} className="glass-panel" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Voltar</button>
        </div>
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Ativo': return { color: 'var(--accent-primary)', bg: 'rgba(182, 255, 0, 0.1)' };
            case 'Lead': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
            default: return { color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)' };
        }
    };

    const handleDelete = async () => {
        if (!cliente) return;
        if (window.confirm('Tem certeza que deseja excluir permanentemente este cliente e todos os seus dados vinculados?')) {
            try {
                await pb.collection('clientes').delete(cliente.id);
                navigate('/clientes'); // Volta para lista após excluir
            } catch (error) {
                console.error('Erro ao excluir do perfil:', error);
                alert('Erro ao excluir cliente. Verifique sua conexão.');
            }
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Navigation & Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('/clientes')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    className="hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> Voltar para Clientes
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setIsEditModalOpen(true)} className="glass-panel hover:bg-[rgba(255,255,255,0.05)] transition-colors" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        Editar Dados
                    </button>
                    <button onClick={handleDelete} className="glass-panel hover:bg-[rgba(239,68,68,0.1)] transition-colors" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', color: '#FF4D4D', border: '1px solid rgba(255, 77, 77, 0.2)', cursor: 'pointer' }}>
                        Excluir
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>

                {/* Side Card: Profile Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '24px',
                            background: 'linear-gradient(135deg, var(--accent-primary), #ffffff)',
                            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#0b0b0b', fontSize: '2rem', fontWeight: 800
                        }}>
                            {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{cliente.nome}</h2>
                        <div style={{ display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, ...getStatusStyle(cliente.status) }}>
                            {cliente.status}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <Mail size={16} /> {cliente.email || 'Não informado'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <Phone size={16} /> {cliente.telefone || 'Não informado'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <Building2 size={16} /> {cliente.empresa || 'Não informado'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <MapPin size={16} /> {cliente.cidade ? `${cliente.cidade}, ${cliente.estado} ` : 'Sem endereço'}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resumo</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Negócios:</span>
                                <span style={{ fontWeight: 600 }}>{negocios.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Contratos:</span>
                                <span style={{ fontWeight: 600 }}>{contratos.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Valor Total:</span>
                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocios.reduce((acc, n) => acc + (n.valor || 0), 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Tabs & Lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
                        {[
                            { id: 'geral', label: 'Visão Geral', icon: <History size={16} /> },
                            { id: 'negocios', label: 'Negócios', icon: <Briefcase size={16} /> },
                            { id: 'contratos', label: 'Contratos', icon: <FileText size={16} /> },
                            { id: 'os', label: 'Ordens de Serviço', icon: <ShieldCheck size={16} /> },
                            { id: 'suporte', label: 'Suporte / Atividades', icon: <Wrench size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600,
                                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    marginBottom: '-1px'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-in">

                        {activeTab === 'geral' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Negócios Recentes</h3>
                                            <button style={{ color: 'var(--accent-primary)', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Ver Todos</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {negocios.slice(0, 3).map(n => (
                                                <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{n.titulo}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.fase}</div>
                                                    </div>
                                                    <div style={{ fontWeight: 600 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n.valor)}</div>
                                                </div>
                                            ))}
                                            {negocios.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Nenhum negócio registrado.</p>}
                                        </div>
                                    </div>

                                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Contratos AtIVOS</h3>
                                            <button style={{ color: 'var(--accent-primary)', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Ver Todos</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {contratos.slice(0, 3).map(c => (
                                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <FileText size={16} color="var(--accent-primary)" />
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.titulo}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.status} - {new Date(c.created).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <ExternalLink size={14} style={{ cursor: 'pointer', opacity: 0.5 }} />
                                                </div>
                                            ))}
                                            {contratos.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Nenhum contrato gerado.</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Observações e Notas</h3>
                                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', minHeight: '100px', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                                        {cliente.observacoes || 'Sem observações cadastradas para este cliente.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'negocios' && (
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Histórico de Negociações</h3>
                                    <button className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: '#0b0b0b' }}>
                                        <Plus size={16} /> Novo Negócio
                                    </button>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TÍTULO</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>VALOR</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>FASE</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {negocios.map(n => (
                                            <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{n.titulo}</td>
                                                <td style={{ padding: '1rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n.valor)}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>{n.fase}</span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(n.created).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'contratos' && (
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Documentos e Contratos</h3>
                                    <button className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: '#0b0b0b' }}>
                                        <Plus size={16} /> Novo Contrato
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    {contratos.map(c => (
                                        <div key={c.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(182, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c.status === 'Assinado' ? 'var(--accent-primary)' : '#FFB800' }}>{c.status.toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{c.titulo}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gerado em {new Date(c.created).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                                                <button style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }} className="glass-panel">Ver</button>
                                                <button style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }} className="glass-panel">PDF</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'os' && (
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Ordens de Serviço</h3>
                                    <button
                                        onClick={() => setIsOSModalOpen(true)}
                                        className="glass-panel"
                                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: '#0b0b0b' }}
                                    >
                                        <Plus size={16} /> Nova OS
                                    </button>
                                </div>
                                {ordens.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TÍTULO</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>VALOR</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STATUS</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PRAZO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ordens.map(o => (
                                                <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{o.titulo}</td>
                                                    <td style={{ padding: '1rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.valor)}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>{o.status}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{o.data_fim ? new Date(o.data_fim).toLocaleDateString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p>Nenhuma ordem de serviço ativa.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'suporte' && (
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Registro de Suporte e Atividades</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Histórico de manutenções, chamados e serviços avulsos realizados para este cliente.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSupportModalOpen(true)}
                                        className="glass-panel"
                                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: '#0b0b0b' }}
                                    >
                                        <Plus size={16} /> Novo Registro
                                    </button>
                                </div>
                                {suportes.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {suportes.map(s => (
                                            <div key={s.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: s.faturavel ? '4px solid var(--accent-primary)' : '4px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{s.titulo}</div>
                                                            {s.faturavel && (
                                                                <span style={{ fontSize: '0.7rem', background: 'rgba(182, 255, 0, 0.1)', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>FATURÁVEL</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <Clock size={12} /> {new Date(s.data_atividade).toLocaleDateString()}
                                                            </span>
                                                            <span>Status: <strong style={{ color: s.status === 'Concluído' ? 'var(--accent-primary)' : '#fff' }}>{s.status}</strong></span>
                                                            {s.tempo_gasto > 0 && <span>Tempo Gasto: <strong>{s.tempo_gasto}h</strong></span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {s.descricao && (
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', lineHeight: '1.5' }}>
                                                        {s.descricao}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <Wrench size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'white' }}>Nenhuma atividade registrada</h4>
                                        <p style={{ fontSize: '0.9rem' }}>Utilize o botão "Novo Registro" para adicionar históricos de suporte, manutenções ou serviços pontuais.</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
            <NewOSModal
                isOpen={isOSModalOpen}
                onClose={() => setIsOSModalOpen(false)}
                onSuccess={fetchClientData}
                initialClientId={cliente.id}
            />
            <NewClientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchClientData} // Atualiza perfil após edição
                initialData={cliente}
            />
            <NewSupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
                onSuccess={fetchClientData}
                clientId={cliente.id}
            />
        </div>
    );
}
