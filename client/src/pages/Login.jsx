import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Mail, Lock, Check, ShieldCheck, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react'
import { loginUser, sendOtp, loginWithOtp, resetPassword } from '../services/api'
import { useAuth } from '../context/AuthContext'
import loginIllustration from '../assets/login_illustration.jpg'

export default function Login() {
  const [activeTab, setActiveTab] = useState('password') // 'password' | 'otp'
  
  // Password Login state
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  // OTP Login state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  // Forgot Password / Reset Password Modal state
  const [forgotModal, setForgotModal] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: Email, 2: OTP + New Password
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const resetInputRefs = useRef([])

  const { login } = useAuth()
  const navigate = useNavigate()

  // Countdown timer for OTP Login
  useEffect(() => {
    let interval = null
    if (activeTab === 'otp' && otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [activeTab, otpSent, resendTimer])

  // Focus OTP input when sent
  useEffect(() => {
    if (activeTab === 'otp' && otpSent && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [activeTab, otpSent])

  // Password Login Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await loginUser(form)
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  // Request OTP for Login
  const handleRequestLoginOtp = async (e) => {
    e.preventDefault()
    if (!otpEmail) return toast.error('Please enter your email address')
    
    setLoading(true)
    try {
      await sendOtp({ email: otpEmail, type: 'login' })
      toast.success('Login OTP code sent to your email!')
      setOtpSent(true)
      setResendTimer(60)
      setCanResend(false)
      setOtpDigits(['', '', '', '', '', ''])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP code')
    } finally {
      setLoading(false)
    }
  }

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    if (!canResend) return
    setLoading(true)
    try {
      const res = await sendOtp({ email: otpEmail, type: 'login' })
      if (res.data?.devMode) {
        toast.info('New OTP code generated! Check server console terminal.')
      } else {
        toast.success('New OTP verification code sent!')
      }
      setResendTimer(60)
      setCanResend(false)
      setOtpDigits(['', '', '', '', '', ''])
      if (inputRefs.current[0]) inputRefs.current[0].focus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  // OTP Input Handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      setOtpDigits(pastedData.split(''))
      if (inputRefs.current[5]) inputRefs.current[5].focus()
    }
  }

  // Submit OTP Login
  const handleOtpLoginSubmit = async (e) => {
    e.preventDefault()
    const otpCode = otpDigits.join('')
    if (otpCode.length < 6) return toast.error('Please enter the full 6-digit OTP code')

    setLoading(true)
    try {
      const { data } = await loginWithOtp({ email: otpEmail, otp: otpCode })
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code')
    } finally {
      setLoading(false)
    }
  }

  // Reset Password OTP handlers
  const handleSendResetOtp = async (e) => {
    e.preventDefault()
    if (!resetEmail) return toast.error('Please enter your email')
    setLoading(true)
    try {
      const res = await sendOtp({ email: resetEmail, type: 'reset' })
      if (res.data?.devMode) {
        toast.info('Reset OTP code generated! Check server console terminal.')
      } else {
        toast.success('Reset OTP code sent to your email!')
      }
      setResetStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    const otpCode = resetOtpDigits.join('')
    if (otpCode.length < 6) return toast.error('Please enter the 6-digit OTP code')
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters')

    setLoading(true)
    try {
      const { data } = await resetPassword({ email: resetEmail, otp: otpCode, newPassword })
      login(data)
      toast.success('Password updated successfully! Welcome back.')
      setForgotModal(false)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0B131E] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased">
      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#101C2B] rounded-[28px] shadow-xl border border-[#DEDCD5] dark:border-[#1E2D40] overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Side: Hero Showcase */}
        <div className="relative bg-[#F1EFE9] dark:bg-[#172638] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#DEDCD5] dark:border-[#1E2D40]">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#145A4A] flex items-center justify-center shadow-sm text-white">
                <Check size={22} strokeWidth={3} className="text-white" />
              </div>
              <span className="text-2xl font-bold font-serif tracking-tight text-[#17202A] dark:text-white">
                TaskFlow
              </span>
            </div>

            <div className="mt-8 sm:mt-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-[#17202A] dark:text-white tracking-tight leading-tight">
                Organize Tasks.<br />
                <span className="text-[#145A4A] dark:text-[#4F8068]">
                  Boost Productivity.
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#5F6872] dark:text-[#89919A] max-w-sm leading-relaxed">
                TaskFlow helps you plan, manage and track your tasks efficiently.
              </p>
            </div>
          </div>

          <div className="relative mt-6 lg:mt-4 flex items-center justify-center">
            <div className="relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-md border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B]">
              <img 
                src={loginIllustration} 
                alt="TaskFlow Productivity 3D Illustration" 
                className="w-full h-auto object-contain select-none"
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Panel */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white dark:bg-[#101C2B]">
          
          {/* Top Navigation */}
          <div className="flex justify-end text-sm text-[#5F6872] dark:text-[#89919A]">
            <span>Don't have an account? </span>
            <Link 
              to="/register" 
              className="ml-1.5 font-semibold text-[#145A4A] dark:text-[#4F8068] hover:text-[#0F4639] hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Form Content Area */}
          <div className="my-auto py-4 sm:py-6 max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight">
                Welcome Back!
              </h2>
              <p className="mt-1.5 text-sm text-[#5F6872] dark:text-[#89919A]">
                Login to continue to your account
              </p>
            </div>

            {/* Login Mode Tab Switcher */}
            <div className="flex p-1 bg-[#F7F5F0] dark:bg-[#172638] rounded-xl mb-6 border border-[#DEDCD5] dark:border-[#1E2D40]">
              <button
                type="button"
                onClick={() => { setActiveTab('password'); setOtpSent(false); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'password'
                    ? 'bg-white dark:bg-[#101C2B] text-[#145A4A] dark:text-white shadow-sm'
                    : 'text-[#5F6872] dark:text-[#89919A] hover:text-[#17202A]'
                }`}
              >
                <Lock size={15} /> Password Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('otp')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'otp'
                    ? 'bg-white dark:bg-[#101C2B] text-[#145A4A] dark:text-white shadow-sm'
                    : 'text-[#5F6872] dark:text-[#89919A] hover:text-[#17202A]'
                }`}
              >
                <ShieldCheck size={15} /> Email OTP Login
              </button>
            </div>

            {/* Tab 1: Password Login Form */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Enter your email"
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Enter your password"
                      className="w-full h-12 pl-11 pr-11 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 text-[#89919A] hover:text-[#17202A] dark:hover:text-gray-300 transition-colors p-1"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#145A4A] border-[#DEDCD5] dark:border-[#1E2D40] focus:ring-[#145A4A] accent-[#145A4A] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[#5F6872] dark:text-gray-300 group-hover:text-[#17202A] dark:group-hover:text-white transition-colors">
                      Remember me
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => { setForgotModal(true); setResetStep(1); setResetEmail(form.email || ''); }}
                    className="text-sm font-semibold text-[#145A4A] dark:text-[#4F8068] hover:text-[#0F4639] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  id="login-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 bg-[#145A4A] hover:bg-[#0F4639] active:scale-[0.99] text-white font-semibold rounded-xl shadow-sm transition-all text-base flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: OTP Login Form */}
            {activeTab === 'otp' && (
              <div className="animate-fade-in">
                {!otpSent ? (
                  <form onSubmit={handleRequestLoginOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !otpEmail}
                      className="w-full h-12 mt-2 bg-[#145A4A] hover:bg-[#0F4639] active:scale-[0.99] text-white font-semibold rounded-xl shadow-sm transition-all text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        <>
                          <Mail size={18} />
                          <span>Send Login OTP Code</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* OTP Verification Form */
                  <form onSubmit={handleOtpLoginSubmit} className="space-y-5">
                    <div className="flex items-center justify-between text-xs text-[#5F6872] dark:text-[#89919A] mb-1">
                      <span>OTP sent to: <strong className="text-[#17202A] dark:text-white font-semibold">{otpEmail}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[#145A4A] dark:text-[#4F8068] hover:underline font-semibold"
                      >
                        Change Email
                      </button>
                    </div>

                    {/* 6-digit OTP Inputs */}
                    <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#5F6872] dark:text-[#89919A]">
                      <span>Didn't get code?</span>
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendLoginOtp}
                          disabled={loading}
                          className="font-semibold text-[#145A4A] dark:text-[#4F8068] hover:underline flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> Resend OTP
                        </button>
                      ) : (
                        <span>Resend in <strong className="text-[#145A4A] dark:text-[#4F8068]">{resendTimer}s</strong></span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpDigits.join('').length < 6}
                      className="w-full h-12 bg-[#145A4A] hover:bg-[#0F4639] active:scale-[0.99] text-white font-semibold rounded-xl shadow-sm transition-all text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        'Verify & Login'
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer Copyright */}
          <div className="text-center text-xs text-[#89919A] dark:text-gray-500 mt-6">
            © 2026 <span className="font-semibold text-[#5F6872] dark:text-gray-400">TaskFlow</span>. All rights reserved.
          </div>
        </div>

      </div>

      {/* Forgot Password OTP Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101C2B]/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#101C2B] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#DEDCD5] dark:border-[#1E2D40]">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#E7F0EC] dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068] flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <h3 className="text-lg font-bold font-serif text-[#17202A] dark:text-white">
                  Reset Password via OTP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModal(false)}
                className="text-[#89919A] hover:text-[#17202A] dark:hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <p className="text-sm text-[#5F6872] dark:text-[#89919A]">
                  Enter your registered email address to receive a password reset OTP verification code.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="flex-1 py-2.5 px-4 bg-[#F1EFE9] dark:bg-[#172638] hover:bg-[#DEDCD5] dark:hover:bg-[#1E2D40] text-[#17202A] dark:text-gray-200 font-medium rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !resetEmail}
                    className="flex-1 py-2.5 px-4 bg-[#145A4A] hover:bg-[#0F4639] text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center disabled:opacity-60"
                  >
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-sm text-[#5F6872] dark:text-[#89919A]">
                  Enter the 6-digit OTP sent to <strong className="text-[#17202A] dark:text-white">{resetEmail}</strong> and your new password.
                </p>

                {/* 6-Digit OTP Inputs */}
                <div>
                  <label className="block text-xs font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Verification OTP Code
                  </label>
                  <div className="flex justify-between gap-1.5">
                    {resetOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (resetInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          if (!/^\d*$/.test(e.target.value)) return
                          const arr = [...resetOtpDigits]
                          arr[idx] = e.target.value.slice(-1)
                          setResetOtpDigits(arr)
                          if (e.target.value && idx < 5 && resetInputRefs.current[idx + 1]) {
                            resetInputRefs.current[idx + 1].focus()
                          }
                        }}
                        className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A]"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-11 pl-11 pr-11 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 text-[#89919A] p-1"
                    >
                      {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="flex-1 py-2.5 px-4 bg-[#F1EFE9] dark:bg-[#172638] text-[#17202A] dark:text-gray-200 font-medium rounded-xl text-sm flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || resetOtpDigits.join('').length < 6 || newPassword.length < 6}
                    className="flex-1 py-2.5 px-4 bg-[#145A4A] hover:bg-[#0F4639] text-white font-medium rounded-xl text-sm flex items-center justify-center disabled:opacity-60"
                  >
                    {loading ? 'Updating...' : 'Reset & Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
