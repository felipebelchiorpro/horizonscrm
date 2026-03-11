import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Primeiro tenta logar como Super Admin do PocketBase
            try {
                await pb.admins.authWithPassword(email, password);
                navigate('/');
                return;
            } catch (adminErr) {
                // Se der erro de Admin, tenta logar como usuário comum da tabela 'users'
                await pb.collection('users').authWithPassword(email, password);
                navigate('/');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(182, 255, 0, 0.05), transparent 50%), radial-gradient(circle at 100% 100%, rgba(20, 20, 20, 1), transparent 50%)',
            padding: '2rem'
        }}>
            <div className="glass-panel animate-fade-in" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Animation removed by request */}
                
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ 
                        width: '64px', height: '64px', margin: '0 auto 1.5rem', 
                        background: 'rgba(182, 255, 0, 0.1)', border: '1px solid rgba(182, 255, 0, 0.2)',
                        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Lock style={{ color: 'var(--accent-primary)' }} size={32} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                        Horizons<span className="text-gradient">CRM</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Faça login para acessar sua conta</p>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(255, 77, 77, 0.1)', color: '#FF4D4D', border: '1px solid rgba(255, 77, 77, 0.2)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '2.75rem', width: '100%', height: '48px' }}
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '2.75rem', width: '100%', height: '48px' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="nav-btn active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '48px', marginTop: '1rem' }}>
                        {loading ? 'Autenticando...' : (
                            <>Entrar <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>
            </div>
            
            <div style={{ position: 'absolute', bottom: '1.5rem', textAlign: 'center', width: '100%', color: 'var(--text-muted)', fontSize: '0.8rem', zIndex: 1 }}>
                &copy; Todos direitos reservados - 2026 GRUPO BELCHIOR VENTURE INVESTIMENTOS
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
