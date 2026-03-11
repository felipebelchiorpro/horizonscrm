import { useState } from 'react';
import { pb } from '../../lib/pocketbase';
import { X, Clock, CheckCircle, HardDrive, DollarSign } from 'lucide-react';

interface NewSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientId: string;
}

export function NewSupportModal({ isOpen, onClose, onSuccess, clientId }: NewSupportModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cliente: clientId,
        titulo: '',
        descricao: '',
        status: 'Pendente',
        data_atividade: new Date().toISOString().split('T')[0],
        faturavel: false,
        tempo_gasto: 0
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await pb.collection('suporte').create(formData);
            onSuccess();
            onClose();
            setFormData({
                cliente: clientId,
                titulo: '',
                descricao: '',
                status: 'Pendente',
                data_atividade: new Date().toISOString().split('T')[0],
                faturavel: false,
                tempo_gasto: 0
            });
        } catch (error) {
            console.error('Error creating support log:', error);
            alert('Erro ao registrar atividade. Verifique se o schema "suporte" já foi criado no PocketBase.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', margin: '1rem', padding: '2rem', zIndex: 100000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(182, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                            <HardDrive size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Registro de Atividade</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título da Atividade</label>
                        <input name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ex: Manutenção no Servidor, Configuração de Rede..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data da Atividade</label>
                            <input name="data_atividade" type="date" value={formData.data_atividade} onChange={handleChange} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status Atual</label>
                            <select name="status" value={formData.status} onChange={handleChange} required>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Concluído">Concluído</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descrição e Detalhes</label>
                        <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={4} placeholder="Descreva os problemas enfrentados, o que foi configurado ou instalado..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', alignItems: 'flex-start' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tempo Gasto (Opcional, em horas)</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input name="tempo_gasto" type="number" step="0.5" min="0" value={formData.tempo_gasto} onChange={handleChange} style={{ paddingLeft: '2.75rem' }} placeholder="Ex: 1.5" />
                            </div>
                        </div>

                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            padding: '1rem', 
                            background: formData.faturavel ? 'rgba(182, 255, 0, 0.1)' : 'rgba(255,255,255,0.03)', 
                            border: formData.faturavel ? '1px solid rgba(182, 255, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            marginTop: '1.75rem',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ 
                                width: '20px', height: '20px', borderRadius: '6px', 
                                background: formData.faturavel ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {formData.faturavel && <CheckCircle size={14} color="#000" />}
                            </div>
                            <input type="checkbox" name="faturavel" checked={formData.faturavel} onChange={handleChange} style={{ display: 'none' }} />
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: formData.faturavel ? 'var(--accent-primary)' : 'white' }}>Cobrança Futura</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Marcar como faturável</div>
                            </div>
                            <DollarSign size={20} style={{ marginLeft: 'auto', color: formData.faturavel ? 'var(--accent-primary)' : 'var(--text-muted)', opacity: formData.faturavel ? 1 : 0.3 }} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: 'transparent', border: '1px solid var(--border-glass)' }} className="glass-panel hover:bg-[rgba(255,255,255,0.05)]">Cancelar</button>
                        <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.875rem', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-md)', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Registrando...' : 'Registrar Atividade'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
