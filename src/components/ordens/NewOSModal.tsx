import { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { X, ShieldCheck, User, Tag, DollarSign } from 'lucide-react';

interface NewOSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialClientId?: string;
}

export function NewOSModal({ isOpen, onClose, onSuccess, initialClientId }: NewOSModalProps) {
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        cliente: initialClientId || '',
        titulo: '',
        descricao: '',
        valor: 0,
        status: 'Pendente',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialClientId) {
            setFormData(prev => ({ ...prev, cliente: initialClientId }));
        }
    }, [initialClientId]);

    const fetchInitialData = async () => {
        try {
            const [clientsList, servicesList] = await Promise.all([
                pb.collection('clientes').getFullList({ sort: 'nome' }),
                pb.collection('servicos').getFullList({ sort: 'nome' })
            ]);
            setClientes(clientsList);
            setServicos(servicesList);
        } catch (error) {
            console.error('Error fetching data for OS:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await pb.collection('ordens_servico').create(formData);
            onSuccess();
            onClose();
            setFormData({
                cliente: initialClientId || '',
                titulo: '',
                descricao: '',
                valor: 0,
                status: 'Pendente',
                data_inicio: new Date().toISOString().split('T')[0],
                data_fim: ''
            });
        } catch (error) {
            console.error('Error creating OS:', error);
            alert('Erro ao criar Ordem de Serviço. Verifique se a coleção "ordens_servico" existe.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (serviceId: string) => {
        const service = servicos.find(s => s.id === serviceId);
        if (service) {
            setFormData(prev => ({
                ...prev,
                titulo: `OS: ${service.nome}`,
                valor: service.valor_padrao || 0,
                descricao: service.descricao_padrao || ''
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', zIndex: 100000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(182, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Nova Ordem de Serviço</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliente</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <select
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '2.75rem' }}
                                disabled={!!initialClientId}
                            >
                                <option value="">Selecionar Cliente...</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.empresa ? `(${c.empresa})` : ''}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tipo de Serviço (Opcional)</label>
                        <div style={{ position: 'relative' }}>
                            <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <select onChange={(e) => handleServiceChange(e.target.value)} style={{ paddingLeft: '2.75rem' }}>
                                <option value="">Auto-preencher com serviço...</option>
                                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título da OS</label>
                        <input name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ex: Manutenção Preventiva - Servidor" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor (R$)</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <input name="valor" type="number" step="0.01" value={formData.valor} onChange={handleChange} placeholder="0,00" style={{ paddingLeft: '2.75rem' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status Inicial</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Execução">Em Execução</option>
                                <option value="Concluída">Concluída</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data de Início</label>
                            <input name="data_inicio" type="date" value={formData.data_inicio} onChange={handleChange} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Previsão de Entrega</label>
                            <input name="data_fim" type="date" value={formData.data_fim} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descrição do Serviço</label>
                        <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={4} placeholder="Descreva os detalhes da OS..." />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: 'transparent', border: '1px solid var(--border-glass)' }} className="glass-panel">Cancelar</button>
                        <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.875rem', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-md)', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Criando...' : 'Gerar Ordem de Serviço'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
