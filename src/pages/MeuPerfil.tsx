import { useState, useRef } from 'react';
import { pb } from '../lib/pocketbase';
import { User, Mail, Phone, Shield, Camera, Lock } from 'lucide-react';

export function MeuPerfil() {
    const user = pb.authStore.model;
    const isAdmin = pb.authStore.isSuperuser;
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        telefone: user?.telefone || '',
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        password: '',
        passwordConfirm: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        
        try {
            setLoading(true);
            
            if (isAdmin) {
                // PocketBase _superusers typically do not accept custom fields like name and telefone.
                // It's recommended to create a regular user account in 'Equipe' and give it 'Admin' role.
                setMessage({ text: 'Por restrições técnicas do PocketBase, a conta Master não armazena Nome ou Telefone. Crie um membro "Admin" na aba "Equipe" para ter um perfil completo.', type: 'error' });
                return;
            } else {
                await pb.collection('users').update(user?.id as string, formData);
            }
            
            setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
            
            // Refresh auth store model
            await pb.collection('users').getOne(user?.id as string).then(record => {
                pb.authStore.save(pb.authStore.token, record);
            });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ text: error.message || 'Erro ao atualizar o perfil.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        
        if (passwordData.password !== passwordData.passwordConfirm) {
            setMessage({ text: 'As novas senhas não coincidem.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            if (isAdmin) {
                await pb.collection('_superusers').update(user?.id as string, {
                    oldPassword: passwordData.oldPassword,
                    password: passwordData.password,
                    passwordConfirm: passwordData.passwordConfirm,
                });
            } else {
                await pb.collection('users').update(user?.id as string, {
                    oldPassword: passwordData.oldPassword,
                    password: passwordData.password,
                    passwordConfirm: passwordData.passwordConfirm,
                });
            }
            setMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
            setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' });
        } catch (error: any) {
            console.error('Error changing password:', error);
            setMessage({ text: 'Erro ao alterar a senha. Verifique a senha atual.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const data = new FormData();
            data.append('avatar', file);

            if (isAdmin) {
                await pb.collection('_superusers').update(user?.id as string, data);
            } else {
                await pb.collection('users').update(user?.id as string, data);
            }
            setMessage({ text: 'Foto atualizada!', type: 'success' });
            
            const collectionName = isAdmin ? '_superusers' : 'users';
            await pb.collection(collectionName).getOne(user?.id as string).then(record => {
                pb.authStore.save(pb.authStore.token, record);
            });
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ text: 'Erro ao fazer upload da foto.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const avatarUrl = user?.avatar 
        ? pb.files.getURL(user, user.avatar) 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=0D8BFF&color=fff`;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div>
                <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                    Meu <span className="text-gradient">Perfil</span>
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Gerencie suas informações e credenciais de acesso.</p>
            </div>

            {message.text && (
                <div style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    background: message.type === 'success' ? 'rgba(182, 255, 0, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                    color: message.type === 'success' ? '#B6FF00' : '#FF4D4D',
                    border: `1px solid ${message.type === 'success' ? 'rgba(182, 255, 0, 0.2)' : 'rgba(255, 77, 77, 0.2)'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Header Profile Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-glass)' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ 
                            width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
                            border: '3px solid var(--accent-primary)', background: 'rgba(255,255,255,0.05)'
                        }}>
                            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ 
                                position: 'absolute', bottom: 0, right: 0, 
                                background: 'var(--accent-primary)', color: '#000', 
                                border: 'none', borderRadius: '50%', width: '32px', height: '32px', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' 
                            }}
                            title="Trocar Foto"
                        >
                            <Camera size={16} />
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                    
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {isAdmin ? 'PocketBase Super Admin' : (user?.name || 'Completar Perfil')}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {user?.email}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', background: 'rgba(182, 255, 0, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                                <Shield size={14} /> {isAdmin ? 'Super Admin' : (user?.role || 'Admin')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Update Basic Info */}
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Informações Pessoais</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome Completo</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    style={{ paddingLeft: '2.75rem', width: '100%' }}
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Telefone</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                                    style={{ paddingLeft: '2.75rem', width: '100%' }}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargo / Função no Sistema</label>
                            <div style={{ position: 'relative' }}>
                                <Shield size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    value={isAdmin ? 'Super Administrador (PocketBase)' : (user?.role || 'Não definido')}
                                    disabled
                                    style={{ paddingLeft: '2.75rem', width: '100%', opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                                />
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>* Apenas Admins podem alterar</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={loading} className="nav-btn active" style={{ display: 'inline-flex', justifyContent: 'center' }}>
                            {loading ? 'Salvando...' : 'Salvar Informações'}
                        </button>
                    </div>
                </form>

                {/* Form Update Password */}
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-glass)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Segurança e Acesso</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha Atual</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="password" 
                                    required
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                                    style={{ paddingLeft: '2.75rem', width: '100%' }}
                                    placeholder="Sua senha atual"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nova Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        type="password" 
                                        required
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                                        style={{ paddingLeft: '2.75rem', width: '100%' }}
                                        placeholder="No mínimo 8 caracteres"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Confirmar Nova Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        type="password" 
                                        required
                                        value={passwordData.passwordConfirm}
                                        onChange={(e) => setPasswordData({...passwordData, passwordConfirm: e.target.value})}
                                        style={{ paddingLeft: '2.75rem', width: '100%' }}
                                        placeholder="Repita a nova senha"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={loading} style={{ background: 'transparent', border: '1px solid var(--border-glass)', padding: '0.75rem 1.5rem', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                            {loading ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
