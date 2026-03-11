import React, { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { X } from 'lucide-react';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    initialData?: any;
}

export function NewProjectModal({ isOpen, onClose, onSaved, initialData }: ProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<{ id: string, nome: string }[]>([]);
    const [usuarios, setUsuarios] = useState<{ id: string, name: string }[]>([]);
    const [ordens, setOrdens] = useState<{ id: string, titulo: string, cliente: string }[]>([]);

    const defaultData = {
        titulo: '',
        descricao: '',
        cliente: '',
        os: '',
        responsavel: '',
        categoria: 'Desenvolvimento',
        status: 'Não Iniciado',
        valor_hora: '',
        data_inicio: '',
        data_entrega: ''
    };

    const [formData, setFormData] = useState(initialData || defaultData);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || defaultData);
            fetchOptions();
        }
    }, [isOpen, initialData]);

    const fetchOptions = async () => {
        try {
            const clientesData = await pb.collection('clientes').getFullList({ sort: 'nome' });
            setClientes(clientesData.map(c => ({ id: c.id, nome: c.nome })));

            const usersData = await pb.collection('users').getFullList({ sort: 'name' });
            setUsuarios(usersData.map(u => ({ id: u.id, name: u.name || u.email })));

            const ordensData = await pb.collection('ordens_servico').getFullList({ sort: '-created' });
            setOrdens(ordensData.map(o => ({ id: o.id, titulo: o.titulo, cliente: o.cliente })));
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Preparar payload
            const payload = {
                ...formData,
                valor_hora: parseFloat(formData.valor_hora) || 0,
                os: formData.os || null,
                responsavel: formData.responsavel || null,
                data_inicio: formData.data_inicio ? new Date(formData.data_inicio).toISOString() : null,
                data_entrega: formData.data_entrega ? new Date(formData.data_entrega).toISOString() : null,
            };

            if (initialData?.id) {
                await pb.collection('projetos').update(initialData.id, payload);
            } else {
                await pb.collection('projetos').create(payload);
            }

            onSaved();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar projeto:', error);
            alert(`Erro ao salvar projeto: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => {
            const temp = { ...prev, [name]: value };
            if (name === 'cliente' && prev.cliente !== value) {
                temp.os = ''; // reset OS if client changes
            }
            return temp;
        });
    };

    const ordensFiltradas = formData.cliente ? ordens.filter(o => o.cliente === formData.cliente) : ordens;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-2xl font-bold">{initialData ? 'Editar Projeto' : 'Novo Projeto'}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Seção 1: Dados do Projeto */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Detalhes do Projeto</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título do Projeto *</label>
                                <input required type="text" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ex: Criação de E-commerce VIP" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descrição</label>
                                <textarea name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Escopo e detalhes..." rows={3} style={{ resize: 'vertical' }} />
                            </div>
                        </div>
                    </div>

                    {/* Seção 2: Classificação e Vínculos */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Classificação</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliente *</label>
                                <select required name="cliente" value={formData.cliente} onChange={handleChange}>
                                    <option value="">Selecione um cliente...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Responsável (Delegar)</label>
                                <select name="responsavel" value={formData.responsavel} onChange={handleChange}>
                                    <option value="">Não atribuído</option>
                                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vincular à Ordem de Serviço (Opcional)</label>
                            <select name="os" value={formData.os} onChange={handleChange}>
                                <option value="">Não vincular</option>
                                {ordensFiltradas.map(o => <option key={o.id} value={o.id}>{o.titulo}</option>)}
                            </select>
                            {formData.cliente && ordensFiltradas.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Nenhuma OS encontrada para este cliente.</p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Categoria</label>
                                <select name="categoria" value={formData.categoria} onChange={handleChange}>
                                    <option value="Desenvolvimento">Desenvolvimento</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Consultoria">Consultoria</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="Não Iniciado">Não Iniciado</option>
                                    <option value="Em Andamento">Em Andamento</option>
                                    <option value="Aguardando Cliente">Aguardando Cliente</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Prazos e Valores */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Planejamento</h3>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data de Início</label>
                                <input type="date" name="data_inicio" value={formData.data_inicio ? formData.data_inicio.split('T')[0] : ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data de Entrega</label>
                                <input type="date" name="data_entrega" value={formData.data_entrega ? formData.data_entrega.split('T')[0] : ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor/Hora (R$)</label>
                                <input type="number" step="0.01" name="valor_hora" value={formData.valor_hora} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', position: 'sticky', bottom: '-2rem', background: '#0a0a0a', padding: '1rem', margin: '0 -2rem -2rem -2rem', borderTop: '1px solid var(--border-glass)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', zIndex: 10 }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Salvando...' : 'Salvar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
