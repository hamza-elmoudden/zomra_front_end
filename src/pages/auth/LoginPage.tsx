import GoogleLoginButton from '@/components/auth/GoogleLoginButton'

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_GOOGLE_LOGIN
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'var(--z-bg)' }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,92,231,0.12) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div className="w-full max-w-sm text-center relative z-10 animate-slide-up">
        {/* Logo mark */}
        <div
          style={{
            width: 72, height: 72,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(108,92,231,0.4)',
          }}
        >
          <span style={{ fontSize: 28 }}>✦</span>
        </div>

        <h1
          className="font-display font-bold gradient-text"
          style={{ fontSize: 36, letterSpacing: '-1px', marginBottom: 8 }}
        >
          Zomra
        </h1>
        <p style={{ fontSize: 15, color: 'var(--z-muted)', marginBottom: 40, lineHeight: 1.5 }}>
          Meet people. Share moments.<br />
          <span style={{ color: 'var(--z-accent2)' }}>Nearby.</span>
        </p>

        {/* Feature bullets */}
        <div
          style={{
            background: 'var(--z-surface)',
            border: '1px solid var(--z-border)',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 28,
            textAlign: 'left',
          }}
        >
          {[
            ['🗺️', 'Discover events near you'],
            ['👥', 'Meet like-minded people'],
            ['💬', 'Chat before you meet'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 13, color: 'var(--z-text)' }}>{text}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontSize: 13, color: 'var(--z-text)' }}>Rate your experiences</span>
          </div>
        </div>

        <GoogleLoginButton onClick={handleGoogleLogin} />

        <p style={{ fontSize: 12, color: 'var(--z-muted)', marginTop: 20, lineHeight: 1.5 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
