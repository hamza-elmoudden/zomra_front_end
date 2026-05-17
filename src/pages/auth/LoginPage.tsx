import GoogleLoginButton from '@/components/auth/GoogleLoginButton'

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_GOOGLE_LOGIN
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Zomra</h1>
          <p className="mt-2 text-gray-500">Meet people. Share moments. Nearby.</p>
        </div>
        <GoogleLoginButton onClick={handleGoogleLogin} />
      </div>
    </div>
  )
}
