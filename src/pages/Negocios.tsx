import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Plus, MoreVertical, DollarSign, Calendar, User } from 'lucide-react';
import { NewDealModal } from '../components/negocios/NewDealModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

export interface Negocio {
    id: string;
    titulo: string;
    valor: number;
    fase: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechado';
    cliente: string;
    expand?: {
        cliente?: {
            nome: string;
            telefone?: string;
            email?: string;
        }
    };
    data_fechamento: string;
    created: string;
}

const FASES = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];

export function Negocios() {
    const [negocios, setNegocios] = useState<Negocio[]>([]);
    const [, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchNegocios = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('negocios').getFullList<Negocio>({
                sort: '-created',
                expand: 'cliente'
            });
            setNegocios(records);
        } catch (error) {
            console.error('Error fetching negocios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNegocios();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sem data';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) {
            return;
        }

        const newFase = destination.droppableId as Negocio['fase'];
        
        // Update local state immediately for lag-free UI
        const updatedNegocios = negocios.map(n => 
            n.id === draggableId ? { ...n, fase: newFase } : n
        );
        setNegocios(updatedNegocios);

        try {
            await pb.collection('negocios').update(draggableId, { fase: newFase });
        } catch (error) {
            console.error('Erro ao atualizar negócio:', error);
            alert('Erro ao mover o negócio.');
            fetchNegocios(); // Revert em caso de erro
        }
    };

    return (
        <>
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                            Pipeline de <span className="text-gradient">Vendas</span>
                        </h1>
                        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Gerencie suas negociações e acompanhe o funil.</p>
                    </div>

                    <button onClick={() => setIsModalOpen(true)} className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                        <Plus size={18} strokeWidth={2} /> Novo Negócio
                    </button>
                </div>

                {/* Kanban Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div style={{
                        display: 'flex',
                        gap: '1.25rem',
                        overflowX: 'auto',
                        padding: '0.5rem',
                        paddingBottom: '2rem',
                        flex: 1,
                        minHeight: '600px',
                        alignItems: 'flex-start'
                    }} className="custom-scrollbar">
                        {FASES.map((fase) => (
                            <div key={fase} style={{
                                minWidth: '300px',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
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
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{fase}</span>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        opacity: 0.6,
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        {negocios.filter(n => n.fase === fase).length}
                                    </span>
                                </div>

                                {/* Droppable Area */}
                                <Droppable droppableId={fase}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                minHeight: '200px',
                                                background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                borderRadius: '8px',
                                                padding: '0.5rem',
                                                transition: 'background 0.2s ease'
                                            }}
                                        >
                                            {negocios.filter(n => n.fase === fase).map((negocio, index) => (
                                                <Draggable key={negocio.id} draggableId={negocio.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="glass-panel"
                                                            style={{
                                                                padding: '1.25rem',
                                                                cursor: 'grab',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '1rem',
                                                                borderLeft: '3px solid var(--accent-primary)',
                                                                opacity: snapshot.isDragging ? 0.9 : 1,
                                                                transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                                                                boxShadow: snapshot.isDragging ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                                                                ...provided.draggableProps.style
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <h4 style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.3 }}>{negocio.titulo}</h4>
                                                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                                    <MoreVertical size={16} />
                                                                </button>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                                                                    <DollarSign size={16} /> {formatCurrency(negocio.valor)}
                                                                </div>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                    <User size={14} /> {negocio.expand?.cliente?.nome || 'Sem cliente'}
                                                                </div>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                    <Calendar size={14} /> Fechamento: {formatDate(negocio.data_fechamento)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            
                                            {negocios.filter(n => n.fase === fase).length === 0 && !snapshot.isDraggingOver && (
                                                <div style={{
                                                    padding: '2rem',
                                                    textAlign: 'center',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.85rem',
                                                    border: '1px dashed var(--border-glass)',
                                                    borderRadius: 'var(--radius-md)'
                                                }}>
                                                    Arraste para cá
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            <NewDealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchNegocios}
            />
        </>
    );
}
