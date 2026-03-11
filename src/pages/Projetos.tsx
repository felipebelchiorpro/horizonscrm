import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import { Plus, Search, Calendar, CheckSquare, AlignLeft, LayoutGrid, FolderClosed } from 'lucide-react';
import { NewProjectModal } from '../components/projetos/NewProjectModal';

interface Projeto {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    subcategoria: string;
    status: string;
    data_inicio: string;
    data_entrega: string;
    responsavel: string;
    cliente: string;
    expand?: {
        responsavel?: { avatar: string, name: string };
        cliente?: { nome: string };
    }
}

const STATUSES = ['Não Iniciado', 'Em Andamento', 'Aguardando Cliente', 'Concluído', 'Cancelado'];

export function Projetos() {
    const navigate = useNavigate();
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const fetchProjetos = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('projetos').getFullList<Projeto>({
                sort: '-created',
                expand: 'responsavel,cliente'
            });
            setProjetos(records);
        } catch (error) {
            console.error('Error fetching projetos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, projetoId: string) => {
        e.stopPropagation();
        const novoStatus = e.target.value;
        try {
            await pb.collection('projetos').update(projetoId, { status: novoStatus });
            setProjetos(prev => prev.map(p => p.id === projetoId ? { ...p, status: novoStatus } : p));
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Não foi possível atualizar o status.');
        }
    };

    const handleDragStart = (e: React.DragEvent, projetoId: string) => {
        e.dataTransfer.setData('projetoId', projetoId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessário para permitir o drop
    };

    const handleDrop = async (e: React.DragEvent, novoStatus: string) => {
        e.preventDefault();
        const projetoId = e.dataTransfer.getData('projetoId');
        if (!projetoId) return;

        try {
            await pb.collection('projetos').update(projetoId, { status: novoStatus });
            setProjetos(prev => prev.map(p => p.id === projetoId ? { ...p, status: novoStatus } : p));
        } catch (error) {
            console.error('Erro ao atualizar status (drag and drop):', error);
            alert('Não foi possível atualizar o status.');
        }
    };

    const getDeadlineColor = (data_entrega: string | undefined | null, status: string) => {
        if (!data_entrega || status === 'Concluído' || status === 'Cancelado') return 'var(--text-muted)';
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const entrega = new Date(data_entrega);
        entrega.setHours(0, 0, 0, 0);
        
        const diffTime = entrega.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return '#ff3333'; // Atrasado (Vermelho)
        if (diffDays <= 3) return '#ffaa00'; // Próximo (Laranja/Amarelo)
        return 'var(--text-muted)'; // Normal
    };

    useEffect(() => {
        fetchProjetos();
    }, []);

    const filteredProjetos = projetos.filter(p =>
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.expand?.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
                {/* Header Área Inspirado no Bitrix24 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                            Gerenciamento de <span className="text-gradient">Projetos</span>
                        </h1>
                        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Projetos organizados por categoria.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)'}}>
                            <button 
                                onClick={() => setViewMode('list')} 
                                style={{ padding: '0.5rem', borderRadius: '8px', background: viewMode === 'list' ? 'rgba(182, 255, 0, 0.1)' : 'transparent', color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                            >
                                <AlignLeft size={20} />
                            </button>
                            <button 
                                 onClick={() => setViewMode('kanban')} 
                                 style={{ padding: '0.5rem', borderRadius: '8px', background: viewMode === 'kanban' ? 'rgba(182, 255, 0, 0.1)' : 'transparent', color: viewMode === 'kanban' ? 'var(--accent-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    
                        <button onClick={() => setIsModalOpen(true)} className="glass-panel hover-glow" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                            <Plus size={18} strokeWidth={2} /> Novo Projeto
                        </button>
                    </div>
                </div>

                {/* View Container */}
                <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar projetos, clientes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.75rem', width: '100%', background: 'rgba(0,0,0,0.2)' }}
                        />
                    </div>

                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando projetos...</div>
                    ) : filteredProjetos.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FolderClosed size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            Nenhum projeto encontrado.
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="custom-scrollbar" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {/* Agrupar projetos por Categoria na Visão de Lista */}
                            {Array.from(new Set(filteredProjetos.map(p => p.categoria))).map(categoria => {
                                const projetosDaCategoria = filteredProjetos.filter(p => p.categoria === categoria);
                                
                                return (
                                    <div key={categoria} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>{categoria}</h2>
                                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {projetosDaCategoria.length}
                                            </span>
                                        </div>

                                        <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Projeto</th>
                                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Cliente</th>
                                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Responsável</th>
                                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Prazos</th>
                                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projetosDaCategoria.map(p => (
                                                        <tr 
                                                            key={p.id} 
                                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} 
                                                            className="hover:bg-white/5 transition-colors cursor-pointer"
                                                            onClick={() => navigate(`/projetos/${p.id}`)}
                                                        >
                                                            <td style={{ padding: '1rem' }}>
                                                                <div style={{ fontWeight: 600, color: 'white' }}>{p.titulo}</div>
                                                            </td>
                                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                                                {p.expand?.cliente?.nome || 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                {p.expand?.responsavel ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <img 
                                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.expand?.responsavel?.name || 'User')}&background=random`} 
                                                                            alt="Avatar"
                                                                            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                                                                        />
                                                                        <span style={{ fontSize: '0.9rem' }}>{p.expand.responsavel.name}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Não atribuído</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: getDeadlineColor(p.data_entrega, p.status), fontWeight: getDeadlineColor(p.data_entrega, p.status) !== 'var(--text-muted)' ? 600 : 400 }}>
                                                                    <Calendar size={14} />
                                                                    {p.data_entrega ? new Date(p.data_entrega).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                                                <select 
                                                                    value={p.status} 
                                                                    onChange={(e) => handleStatusChange(e, p.id)}
                                                                    style={{ 
                                                                        padding: '0.25rem 0.5rem', 
                                                                        borderRadius: '12px', 
                                                                        fontSize: '0.8rem', 
                                                                        fontWeight: 600,
                                                                        background: p.status === 'Concluído' ? 'rgba(182, 255, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                                                        color: p.status === 'Concluído' ? 'var(--accent-primary)' : 'white',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <option value="Não Iniciado" style={{ color: 'black' }}>Não Iniciado</option>
                                                                    <option value="Em Andamento" style={{ color: 'black' }}>Em Andamento</option>
                                                                    <option value="Aguardando Cliente" style={{ color: 'black' }}>Aguardando Cliente</option>
                                                                    <option value="Concluído" style={{ color: 'black' }}>Concluído</option>
                                                                    <option value="Cancelado" style={{ color: 'black' }}>Cancelado</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            gap: '1.25rem',
                            overflowX: 'auto',
                            padding: '0.5rem',
                            paddingBottom: '2rem',
                            flex: 1,
                            alignItems: 'flex-start'
                        }} className="custom-scrollbar">
                            {/* Pipeline (Kanban) agrupado por Status */}
                            {STATUSES.map((status) => {
                                const projetosDoStatus = filteredProjetos.filter(p => p.status === status);
                                
                                return (
                                    <div 
                                        key={status} 
                                        style={{
                                            minWidth: '320px',
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem'
                                        }}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, status)}
                                    >
                                        {/* Column Header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-glass)'
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{status}</span>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                opacity: 0.6,
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '0.1rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                {projetosDoStatus.length}
                                            </span>
                                        </div>

                                        {/* Cards Column */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            minHeight: '100px'
                                        }}>
                                            {projetosDoStatus.map((p) => (
                                                <div 
                                                    key={p.id} 
                                                    className="glass-panel hover-glow" 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, p.id)}
                                                    style={{ 
                                                        padding: '1.5rem', 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        gap: '1rem', 
                                                        background: 'rgba(0,0,0,0.3)', 
                                                        cursor: 'grab',
                                                        borderLeft: getDeadlineColor(p.data_entrega, p.status) !== 'var(--text-muted)' ? `3px solid ${getDeadlineColor(p.data_entrega, p.status)}` : '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                    onClick={() => navigate(`/projetos/${p.id}`)}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{p.titulo}</h3>
                                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{p.expand?.cliente?.nome || 'N/A'}</span>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>
                                                                    {p.categoria}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {p.descricao || 'Nenhuma descrição fornecida.'}
                                                    </p>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                                            <CheckSquare size={16} color={p.status === 'Concluído' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                                                            <select 
                                                                value={p.status} 
                                                                onChange={(e) => handleStatusChange(e, p.id)}
                                                                style={{ 
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: p.status === 'Concluído' ? 'var(--accent-primary)' : 'var(--text-muted)',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 500,
                                                                    outline: 'none',
                                                                    cursor: 'pointer',
                                                                    padding: 0
                                                                }}
                                                            >
                                                                {STATUSES.map(s => <option key={s} value={s} style={{ color: 'black' }}>{s}</option>)}
                                                            </select>
                                                        </div>
                                                        {p.expand?.responsavel && (
                                                            <img 
                                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.expand?.responsavel?.name || 'User')}&background=random`} 
                                                                alt="Avatar"
                                                                title={p.expand.responsavel.name}
                                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--bg-color)' }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {projetosDoStatus.length === 0 && (
                                                <div style={{
                                                    padding: '2rem',
                                                    textAlign: 'center',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.85rem',
                                                    border: '1px dashed var(--border-glass)',
                                                    borderRadius: 'var(--radius-md)'
                                                }}>
                                                    Nenhum projeto
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={fetchProjetos} />}
        </>
    );
}
