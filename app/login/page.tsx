'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loginAction } from './actions'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginAction(email, password, redirectTo)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setLoading(true)
    setError('')

    const result = await loginAction(demoEmail, 'demo1234', redirectTo)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-bold text-white">QGO Relocation</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light text-white leading-relaxed mb-6">
            &ldquo;Professional relocation surveys, from request to delivery.&rdquo;
          </blockquote>
          <div className="flex gap-6 text-slate-400 text-sm">
            <div>
              <div className="text-2xl font-bold text-white">5K+</div>
              <div>Moves completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">50+</div>
              <div>Countries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">98%</div>
              <div>Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">QGO Relocation</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Staff Portal</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to access the dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@qgorelocation.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">Quick Demo Access</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('demo.admin@qgo.com')}
                disabled={loading}
                className="flex flex-col items-center gap-1 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg px-3 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700">Admin</span>
                <span className="text-[10px] text-slate-400">demo.admin@qgo.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('demo.surveyor@qgo.com')}
                disabled={loading}
                className="flex flex-col items-center gap-1 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-lg px-3 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700">Surveyor</span>
                <span className="text-[10px] text-slate-400">demo.surveyor@qgo.com</span>
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
