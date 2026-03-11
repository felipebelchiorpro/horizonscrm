import { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { X } from 'lucide-react';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function NewClientModal({ isOpen, onClose, onSuccess, initialData }: ClientModalProps) {
    const [loading, setLoading] = useState(false);

    const defaultData = {
        nome: '',
        documento: '', // CPF/CNPJ
        email: '',
        telefone: '',
        empresa: '',
        cargo: '',
        cep: '',
        endereco: '',
        cidade: '',
        estado: '',
        status: 'Lead',
        observacoes: ''
    };

    const [formData, setFormData] = useState(initialData || defaultData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData(defaultData);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            console.log('Dados do formulário:', formData);
            if (initialData?.id) {
                const result = await pb.collection('clientes').update(initialData.id, formData);
                console.log('Cliente atualizado com sucesso:', result);
            } else {
                const result = await pb.collection('clientes').create(formData);
                console.log('Cliente criado com sucesso:', result);
            }
            onSuccess();
            onClose();
            // Reset form handled by useEffect on next open
        } catch (error: any) {
            console.error('Erro detalhado ao salvar cliente:', error);
            alert(`Erro ao salvar cliente: ${error.message || 'Erro desconhecido'}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-2xl font-bold">Novo Cliente</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Seção 1: Dados Pessoais / Corporativos */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Informações Básicas</h3>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-full)', padding: '0.25rem', border: '1px solid var(--border-glass)' }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev: any) => ({ ...prev, tipo: 'PF' }))}
                                    style={{
                                        padding: '0.25rem 1rem',
                                        borderRadius: 'var(--radius-full)',
                                        background: (!formData.tipo || formData.tipo === 'PF') ? 'var(--accent-primary)' : 'transparent',
                                        color: (!formData.tipo || formData.tipo === 'PF') ? '#0b0b0b' : 'var(--text-muted)',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Pessoa Física
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev: any) => ({ ...prev, tipo: 'PJ' }))}
                                    style={{
                                        padding: '0.25rem 1rem',
                                        borderRadius: 'var(--radius-full)',
                                        background: formData.tipo === 'PJ' ? 'var(--accent-primary)' : 'transparent',
                                        color: formData.tipo === 'PJ' ? '#0b0b0b' : 'var(--text-muted)',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Pessoa Jurídica
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nome Completo / Razão Social *</label>
                                <input required type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder={formData.tipo === 'PJ' ? "Ex: Tech Corp Ltda" : "Ex: João Silva"} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {formData.tipo === 'PJ' ? 'CNPJ' : 'CPF'}
                                </label>
                                <input type="text" name="documento" value={formData.documento} onChange={handleChange} placeholder={formData.tipo === 'PJ' ? "00.000.000/0001-00" : "000.000.000-00"} />
                            </div>
                        </div>
                    </div>

                    {/* Seção 2: Contato & Profissional */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Contato Profissional</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>E-mail</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="joao@empresa.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Telefone / WhatsApp</label>
                                <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Empresa</label>
                                <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Tech Corp" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cargo</label>
                                <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} placeholder="Diretor Comercial" />
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Endereço (Opcional) */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Endereço</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>CEP</label>
                                <input type="text" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                                <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Av. Paulista, 1000" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cidade</label>
                                <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="São Paulo" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado (UF)</label>
                                <input type="text" name="estado" value={formData.estado} onChange={handleChange} placeholder="SP" maxLength={2} />
                            </div>
                        </div>
                    </div>

                    {/* Seção 4: Status e Observações */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Detalhes Adicionais</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fase no funil (Status)</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="Lead">Lead (Contato Inicial)</option>
                                    <option value="Prospect">Prospect (Em negociação)</option>
                                    <option value="Ativo">Cliente Ativo</option>
                                    <option value="Inativo">Inativo / Ex-cliente</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Observações</label>
                                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange as any} placeholder="Notas adicionais sobre o cliente..." rows={3} style={{ resize: 'vertical' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'var(--bg-card)', padding: '1rem 0', margin: '-2rem 0 -2rem 0', borderTop: '1px solid var(--border-glass)' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Salvando...' : 'Salvar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
