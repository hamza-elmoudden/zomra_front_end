import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-500">Page not found</p>
        <Link
          to="/home"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-2 text-white hover:bg-primary-600"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
