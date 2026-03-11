import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Users, UserPlus, Shield, Mail, Phone, Search, Edit2, Trash2 } from 'lucide-react';

export function Equipe() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const currentUser = pb.authStore.model;

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
        telefone: '',
        role: 'Corretor'
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('users').getFullList({
                sort: '-created'
            });
            setUsers(records);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            // Ignore 403 errors if user doesn't have list permissions
        } finally {
            setLoading(false);
        }
    };

    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;
    const isSuperuser = pb.authStore.isSuperuser;

    useEffect(() => {
        if (currentUserRole === 'Admin' || isSuperuser) {
            fetchUsers();
        } else {
            setLoading(false); // Quick exit for non-admins
        }
    }, [currentUserId, currentUserRole, isSuperuser]);

    const handleOpenNewUser = () => {
        setFormData({ id: '', name: '', email: '', password: '', passwordConfirm: '', telefone: '', role: 'Corretor' });
        setIsModalOpen(true);
    };

    const handleOpenEditUser = (u: any) => {
        setFormData({ 
            id: u.id, name: u.name, email: u.email, 
            password: '', passwordConfirm: '', 
            telefone: u.telefone || '', role: u.role || 'Corretor' 
        });
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (uId: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário permanentemente?')) return;
        try {
            await pb.collection('users').delete(uId);
            await fetchUsers();
        } catch (error) {
            console.error('Error deleting user', error);
            alert('Erro ao excluir usuário.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            
            const payload: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                telefone: formData.telefone,
                emailVisibility: true,
            };

            if (formData.password) {
                if (formData.password !== formData.passwordConfirm) {
                    alert('As senhas não coincidem!');
                    setIsSaving(false);
                    return;
                }
                payload.password = formData.password;
                payload.passwordConfirm = formData.passwordConfirm;
            }

            if (formData.id) {
                // Update existing
                await pb.collection('users').update(formData.id, payload);
            } else {
                // Create new
                if (!formData.password || !formData.passwordConfirm) {
                    alert('Senha e Confirmação são obrigatórias para novos usuários.');
                    setIsSaving(false);
                    return;
                }
                payload.password = formData.password;
                payload.passwordConfirm = formData.passwordConfirm;
                await pb.collection('users').create(payload);
            }

            setIsModalOpen(false);
            await fetchUsers();
        } catch (error: any) {
            console.error('Save error full object:', error);
            
            let errorMessage = 'Erro ao salvar usuário.';
            
            // Extract PocketBase detailed validation errors if available
            if (error?.response?.data) {
                const pbErrors = error.response.data;
                const errorDetails = Object.keys(pbErrors).map(key => `${key}: ${pbErrors[key].message}`).join('\n');
                errorMessage += `\nDetalhes:\n${errorDetails}`;
            } else if (error?.data?.message) {
                 errorMessage += ' ' + error.data.message;
            } else if (error?.message) {
                 errorMessage += ' ' + error.message;
            }

            alert(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (currentUser?.role !== 'Admin' && !pb.authStore.isSuperuser) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#ff4d4d' }}>
                <Shield size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h2 className="text-2xl font-bold">Acesso Restrito</h2>
                <p>Apenas usuários com a função de <strong>Administrador</strong> podem acessar a Gestão de Equipe.</p>
            </div>
        );
    }

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                <div>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Gestão da <span className="text-gradient">Equipe</span>
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Controle de acesso, membros e permissões do sistema.</p>
                </div>

                <button onClick={handleOpenNewUser} className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                    <UserPlus size={18} strokeWidth={2} /> Adicionar Membro
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.75rem', width: '100%' }}
                    />
                </div>

                <div className="custom-scrollbar" style={{ overflowX: 'auto', minHeight: '250px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Membro</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Contato</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Função (Role)</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Data de Entrada</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => {
                                const isMe = u.id === currentUser?.id;
                                const avatarUrl = u.avatar ? pb.files.getURL(u, u.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=111&color=fff`;
                                
                                return (
                                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={avatarUrl} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {u.name || 'Sem Nome'} 
                                                        {isMe && <span style={{ fontSize: '0.7rem', background: 'var(--accent-primary)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>VOCÊ</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={12} /> {u.email}</span>
                                                {u.telefone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={12} /> {u.telefone}</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', 
                                                borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                                                background: u.role === 'Admin' ? 'rgba(182, 255, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                                color: u.role === 'Admin' ? '#B6FF00' : 'white'
                                            }}>
                                                {u.role === 'Admin' ? <Shield size={14} /> : <Users size={14} />} {u.role || 'Membro'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {new Date(u.created).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button onClick={() => handleOpenEditUser(u)} title="Editar" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} className="hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                {!isMe && (
                                                    <button onClick={() => handleDeleteUser(u.id)} title="Excluir" style={{ background: 'rgba(255,77,77,0.1)', border: 'none', color: '#ff4d4d', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} className="hover:bg-[rgba(255,77,77,0.2)] transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && !loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Nenhum usuário encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Criação / Edição de Usuário */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setIsModalOpen(false)} />
                    
                    <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', margin: '1rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 className="text-2xl font-bold">{formData.id ? 'Editar Membro' : 'Novo Membro na Equipe'}</h2>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome Completo</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%' }} />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail de Acesso</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Função (Role)</label>
                                    <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%' }}>
                                        <option value="Admin">Admin</option>
                                        <option value="Corretor">Corretor</option>
                                        <option value="Vendedor">Vendedor</option>
                                        <option value="Financeiro">Financeiro</option>
                                        <option value="Membro">Membro</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Telefone</label>
                                    <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} style={{ width: '100%' }} />
                                </div>
                            </div>
                            
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {formData.id ? 'Deixe em branco para manter a senha atual.' : 'Defina uma senha inicial (min 8 caracteres)'}
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input 
                                        type="password" 
                                        placeholder="Senha" 
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})} 
                                        style={{ width: '100%' }} 
                                        minLength={8}
                                        required={!formData.id}
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Confirme" 
                                        value={formData.passwordConfirm} 
                                        onChange={e => setFormData({...formData, passwordConfirm: e.target.value})} 
                                        style={{ width: '100%' }} 
                                        minLength={8}
                                        required={!!formData.password}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '1rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'white' }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSaving} className="nav-btn active" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    {isSaving ? 'Salvando...' : 'Salvar Membro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
