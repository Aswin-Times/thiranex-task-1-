import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Brand } from './Brand';

interface Props {
  onAuthenticate: (mode: 'login' | 'register', data: { name: string; email: string; password: string }) => Promise<void>;
}

export function AuthScreen({ onAuthenticate }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAuthenticate(mode, form);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to continue.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Brand inverse />
        <div className="auth-story__content">
          <span className="eyebrow eyebrow--light">WORK WITH INTENTION</span>
          <h1>Turn your plans into<br /><em>meaningful progress.</em></h1>
          <p>A calm, focused workspace that helps you organise the work that matters and finish every day with clarity.</p>
          <div className="auth-benefits">
            {['Capture tasks in seconds', 'Stay focused on what matters', 'See progress as it happens'].map((item) => (
              <span key={item}><CheckCircle2 size={18} /> {item}</span>
            ))}
          </div>
        </div>
        <p className="auth-story__quote">“Small steps, consistently taken, create remarkable outcomes.”</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand"><Brand /></div>
          <span className="eyebrow">WELCOME TO TASKFLOW</span>
          <h2>{mode === 'login' ? 'Good to see you again.' : 'Create your workspace.'}</h2>
          <p className="auth-card__subtitle">
            {mode === 'login' ? 'Sign in to pick up where you left off.' : 'Start organising your work in less than a minute.'}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Create account</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <label>Full name
                <span className="input-wrap"><UserRound size={18} /><input required minLength={2} autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></span>
              </label>
            )}
            <label>Email address
              <span className="input-wrap"><Mail size={18} /><input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span>
            </label>
            <label>Password
              <span className="input-wrap"><LockKeyhole size={18} /><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button primary-button--wide" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="auth-terms">By continuing, you agree to use Taskflow thoughtfully and responsibly.</p>
        </div>
      </section>
    </main>
  );
}

