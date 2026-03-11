import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Plus, Search, Tag, DollarSign, Trash2, Edit2, X } from 'lucide-react';

interface Servico {
    id: string;
    nome: string;
    valor_padrao: number;
    descricao_padrao: string;
    condicao_pagamento: string;
    created: string;
}

export function Servicos() {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingServico, setEditingServico] = useState<Servico | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        valor_padrao: '',
        descricao_padrao: '',
        condicao_pagamento: '100% no final'
    });

    const paymentOptions = ['100% no final', '50% antes / 50% depois', '100% antecipado', 'Personalizado'];

    const fetchServicos = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('servicos').getFullList<Servico>({
                sort: '-created',
            });
            setServicos(records);
        } catch (error) {
            console.error('Error fetching servicos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServicos();
    }, []);

    const handleOpenModal = (servico?: Servico) => {
        if (servico) {
            setEditingServico(servico);
            setFormData({
                nome: servico.nome,
                valor_padrao: servico.valor_padrao.toString(),
                descricao_padrao: servico.descricao_padrao,
                condicao_pagamento: servico.condicao_pagamento || '100% no final'
            });
        } else {
            setEditingServico(null);
            setFormData({ nome: '', valor_padrao: '', descricao_padrao: '', condicao_pagamento: '100% no final' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                nome: formData.nome,
                valor_padrao: parseFloat(formData.valor_padrao) || 0,
                descricao_padrao: formData.descricao_padrao,
                condicao_pagamento: formData.condicao_pagamento
            };

            if (editingServico) {
                await pb.collection('servicos').update(editingServico.id, data);
            } else {
                await pb.collection('servicos').create(data);
            }

            setIsModalOpen(false);
            fetchServicos();
        } catch (error) {
            console.error('Error saving servico:', error);
            alert('Erro ao salvar serviço.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                await pb.collection('servicos').delete(id);
                fetchServicos();
            } catch (error) {
                console.error('Error deleting servico:', error);
            }
        }
    };

    const filteredServicos = servicos.filter(s =>
        s.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                <div>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Tipos de <span className="text-gradient">Serviço</span>
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Gerencie os modelos e valores dos seus serviços.</p>
                </div>

                <button onClick={() => handleOpenModal()} className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                    <Plus size={18} strokeWidth={2} /> Novo Tipo
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.75rem', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredServicos.map(s => (
                        <div key={s.id} className="glass-panel hover-glow" style={{ padding: '1.5rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(182, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                    <Tag size={20} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleOpenModal(s)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', color: '#FF4D4D', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.nome}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '1rem' }}>
                                <DollarSign size={16} />
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valor_padrao || 0)}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
                                {s.descricao_padrao}
                            </p>
                        </div>
                    ))}
                </div>

                {filteredServicos.length === 0 && !loading && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum tipo de serviço cadastrado.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setIsModalOpen(false)} />
                    <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', zIndex: 100000 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 className="text-2xl font-bold">{editingServico ? 'Editar Tipo' : 'Novo Tipo'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nome do Serviço *</label>
                                <input required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: InfoGráfico, Consultoria" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor Padrão (R$)</label>
                                    <input type="number" value={formData.valor_padrao} onChange={e => setFormData({ ...formData, valor_padrao: e.target.value })} placeholder="0,00" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Condição de Pagamento</label>
                                    <select value={formData.condicao_pagamento} onChange={e => setFormData({ ...formData, condicao_pagamento: e.target.value })}>
                                        {paymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descrição para o Contrato</label>
                                <textarea
                                    value={formData.descricao_padrao}
                                    onChange={e => setFormData({ ...formData, descricao_padrao: e.target.value })}
                                    placeholder="Este texto será inserido na cláusula de 'Descrição dos Serviços' do contrato."
                                    style={{ height: '120px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'white' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 2, padding: '0.875rem', borderRadius: '10px', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', fontWeight: 600 }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
