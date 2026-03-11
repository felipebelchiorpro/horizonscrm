import { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { X, DollarSign, Briefcase, Calendar, User } from 'lucide-react';

interface NewDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ClienteOption {
    id: string;
    nome: string;
    empresa: string;
}

export function NewDealModal({ isOpen, onClose, onSuccess }: NewDealModalProps) {
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<ClienteOption[]>([]);

    const [formData, setFormData] = useState({
        titulo: '',
        valor: '',
        fase: 'Prospecção',
        cliente: '',
        data_fechamento: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchClientes();
        }
    }, [isOpen]);

    const fetchClientes = async () => {
        try {
            const records = await pb.collection('clientes').getFullList<ClienteOption>({
                sort: 'nome',
                fields: 'id,nome,empresa'
            });
            setClientes(records);
        } catch (error) {
            console.error('Error fetching clientes for select:', error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Clean data for PocketBase
            const payload = {
                ...formData,
                valor: parseFloat(formData.valor) || 0,
            };

            await pb.collection('negocios').create(payload);
            onSuccess();
            onClose();
            setFormData({ titulo: '', valor: '', fase: 'Prospecção', cliente: '', data_fechamento: '' });
        } catch (error) {
            console.error('Error creating deal:', error);
            alert('Erro ao salvar o negócio. Verifique os campos.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '1rem', padding: '2.5rem', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-2xl font-bold">Novo Negócio</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título da Negociação *</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                required
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                placeholder="Ex: Venda de Software Enterprise"
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor (R$)</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <input
                                    type="number"
                                    step="0.01"
                                    name="valor"
                                    value={formData.valor}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estágio</label>
                            <select name="fase" value={formData.fase} onChange={handleChange}>
                                <option value="Prospecção">Prospecção</option>
                                <option value="Qualificação">Qualificação</option>
                                <option value="Proposta">Proposta</option>
                                <option value="Negociação">Negociação</option>
                                <option value="Fechado">Fechado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliente Vinculado</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <select
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.75rem' }}
                            >
                                <option value="">Selecione um cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nome} {c.empresa ? `(${c.empresa})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Previsão de Fechamento</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                type="date"
                                name="data_fechamento"
                                value={formData.data_fechamento}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Criando...' : 'Criar Negócio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
