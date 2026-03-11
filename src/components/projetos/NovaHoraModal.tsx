import React, { useState } from 'react';
import { pb } from '../../lib/pocketbase';
import { X } from 'lucide-react';

interface NovaHoraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    projetoId: string;
    responsavelId?: string;
}

export function NovaHoraModal({ isOpen, onClose, onSaved, projetoId, responsavelId }: NovaHoraModalProps) {
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        data: new Date().toISOString().split('T')[0],
        horas: '',
        minutos: '',
        descricao: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            const totalMinutos = (parseInt(formData.horas || '0') * 60) + parseInt(formData.minutos || '0');
            
            if (totalMinutos <= 0) {
                alert("Por favor, informe o tempo gasto.");
                setLoading(false);
                return;
            }

            const payload = {
                projeto: projetoId,
                responsavel: responsavelId || null,
                data: new Date(formData.data).toISOString(),
                minutos_gastos: totalMinutos,
                descricao: formData.descricao,
                faturado: false
            };

            await pb.collection('horas_projeto').create(payload);
            
            onSaved();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar horas:', error);
            alert(`Erro ao salvar horas: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '1rem', padding: '2rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-xl font-bold">Apontar Horas</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }} className="hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data da Atividade *</label>
                        <input required type="date" name="data" value={formData.data} onChange={handleChange} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tempo Gasto *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" name="horas" value={formData.horas} onChange={handleChange} placeholder="0" min="0" style={{ width: '100%' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Horas</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" name="minutos" value={formData.minutos} onChange={handleChange} placeholder="0" min="0" max="59" style={{ width: '100%' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Minutos</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>O que foi feito? *</label>
                        <textarea required name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descreva a atividade realizada..." rows={4} style={{ resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Salvando...' : 'Salvar Horas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
