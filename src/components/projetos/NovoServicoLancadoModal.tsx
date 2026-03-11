import React, { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { X } from 'lucide-react';

interface NovoServicoLancadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    projetoId: string;
}

export function NovoServicoLancadoModal({ isOpen, onClose, onSaved, projetoId }: NovoServicoLancadoModalProps) {
    const [loading, setLoading] = useState(false);
    const [servicosDisponiveis, setServicosDisponiveis] = useState<{ id: string, nome: string, valor_padrao: number }[]>([]);
    
    const [formData, setFormData] = useState({
        servico: '',
        quantidade: 1,
        valor_unitario: '',
        observacao: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchServicos();
            setFormData({
                servico: '',
                quantidade: 1,
                valor_unitario: '',
                observacao: ''
            });
        }
    }, [isOpen]);

    const fetchServicos = async () => {
        try {
            const res = await pb.collection('servicos').getFullList({ sort: 'nome' });
            setServicosDisponiveis(res as any);
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
        }
    };

    const handleServicoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const servicoId = e.target.value;
        const servicoSelecionado = servicosDisponiveis.find(s => s.id === servicoId);
        
        setFormData(prev => ({ 
            ...prev, 
            servico: servicoId,
            valor_unitario: servicoSelecionado ? servicoSelecionado.valor_padrao.toString() : '' 
        }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            const vlrUnit = parseFloat(formData.valor_unitario) || 0;
            const payload = {
                projeto: projetoId,
                servico: formData.servico,
                quantidade: formData.quantidade,
                valor_unitario: vlrUnit,
                valor_total: vlrUnit * formData.quantidade,
                observacao: formData.observacao,
                faturado: false
            };

            await pb.collection('servicos_lancados').create(payload);
            
            onSaved();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar serviço:', error);
            alert(`Erro ao salvar serviço. Certifique-se de selecionar um serviço válido.`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const valorTotalPrevisto = (parseFloat(formData.valor_unitario) || 0) * formData.quantidade;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '1rem', padding: '2rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-xl font-bold">Lançar Serviço Avulso</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Serviço a Inserir *</label>
                        <select required name="servico" value={formData.servico} onChange={handleServicoChange}>
                            <option value="">Selecione um serviço cadastrado...</option>
                            {servicosDisponiveis.map(s => (
                                <option key={s.id} value={s.id}>{s.nome} (Padrão: R$ {s.valor_padrao})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quantidade *</label>
                            <input required type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} min="1" step="1" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor Unitário (R$)</label>
                            <input required type="number" name="valor_unitario" value={formData.valor_unitario} onChange={handleChange} step="0.01" min="0" />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(182, 255, 0, 0.05)', border: '1px solid rgba(182, 255, 0, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Valor Total Previsto:</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalPrevisto)}
                        </span>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Observações</label>
                        <textarea name="observacao" value={formData.observacao} onChange={handleChange} placeholder="Detalhes opcionais sobre esse item extra..." rows={3} style={{ resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Salvando...' : 'Adicionar Serviço'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
