import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Mail, Lock, User, Check, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { sendOtp, registerUser } from '../services/api'
import { useAuth } from '../context/AuthContext'
import loginIllustration from '../assets/login_illustration.jpg'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // OTP Verification state
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  const { login } = useAuth()
  const navigate = useNavigate()

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  // Focus first OTP input on step change
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [step])

  // Send OTP & Initiate Verification
  const handleInitiateRegister = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      await sendOtp({ email: form.email, type: 'register' })
      toast.success('Verification code sent to your email!')
      setStep('otp')
      setResendTimer(60)
      setCanResend(false)
      setOtpDigits(['', '', '', '', '', ''])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP code')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Digit Input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)

    // Auto-advance focus
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  // Handle KeyDown (Backspace navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    }
  }

  // Handle Paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtpDigits(digits)
      if (inputRefs.current[5]) inputRefs.current[5].focus()
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return
    setLoading(true)
    try {
      const res = await sendOtp({ email: form.email, type: 'register' })
      if (res.data?.devMode) {
        toast.info('New OTP code generated! Check server terminal console.')
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

  // Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    const otpCode = otpDigits.join('')
    if (otpCode.length < 6) {
      return toast.error('Please enter the complete 6-digit OTP code')
    }

    setLoading(true)
    try {
      const { data } = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        otp: otpCode,
      })
      login(data)
      toast.success(`Welcome to TaskFlow, ${data.name}! Your account is verified.`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0B131E] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased">
      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#101C2B] rounded-[28px] shadow-xl border border-[#DEDCD5] dark:border-[#1E2D40] overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Side: Hero / Brand Showcase */}
        <div className="relative bg-[#F1EFE9] dark:bg-[#172638] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#DEDCD5] dark:border-[#1E2D40]">
          
          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#145A4A] flex items-center justify-center shadow-sm text-white">
                <Check size={22} strokeWidth={3} className="text-white" />
              </div>
              <span className="text-2xl font-bold font-serif tracking-tight text-[#17202A] dark:text-white">
                TaskFlow
              </span>
            </div>

            {/* Hero Headlines */}
            <div className="mt-8 sm:mt-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-[#17202A] dark:text-white tracking-tight leading-tight">
                {step === 'form' ? (
                  <>
                    Get Started.<br />
                    <span className="text-[#145A4A] dark:text-[#4F8068]">
                      Boost Productivity.
                    </span>
                  </>
                ) : (
                  <>
                    Verify Email.<br />
                    <span className="text-[#145A4A] dark:text-[#4F8068]">
                      Secure Account.
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#5F6872] dark:text-[#89919A] max-w-sm leading-relaxed">
                {step === 'form'
                  ? 'Join TaskFlow today to plan, manage and track your tasks efficiently.'
                  : 'We have sent a 6-digit OTP code to verify your email address.'}
              </p>
            </div>
          </div>

          {/* Illustration Graphics Container */}
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

        {/* Right Side: Register & OTP Panel */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white dark:bg-[#101C2B]">
          
          {/* Top Right Navigation */}
          <div className="flex justify-end text-sm text-[#5F6872] dark:text-[#89919A]">
            <span>Already have an account? </span>
            <Link 
              to="/login" 
              className="ml-1.5 font-semibold text-[#145A4A] dark:text-[#4F8068] hover:text-[#0F4639] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Step 1: Initial Registration Form */}
          {step === 'form' ? (
            <div className="my-auto py-4 sm:py-6 max-w-md w-full mx-auto animate-fade-in">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight">
                  Create Account
                </h2>
                <p className="mt-1.5 text-sm text-[#5F6872] dark:text-[#89919A]">
                  Sign up to start organizing your tasks
                </p>
              </div>

              <form onSubmit={handleInitiateRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
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
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full h-11 pl-11 pr-11 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
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

                <div>
                  <label className="block text-sm font-semibold text-[#17202A] dark:text-gray-200 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-3.5 text-[#89919A] pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
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
                      <span>Verify Email & Create Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Step 2: OTP Email Verification Form */
            <div className="my-auto py-4 sm:py-6 max-w-md w-full mx-auto animate-fade-in">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#5F6872] dark:text-[#89919A] hover:text-[#145A4A] dark:hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft size={14} /> Back to registration
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#E7F0EC] dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068] flex items-center justify-center mb-3">
                  <ShieldCheck size={26} />
                </div>
                <h2 className="text-2xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight">
                  Enter OTP Code
                </h2>
                <p className="mt-1.5 text-sm text-[#5F6872] dark:text-[#89919A] leading-relaxed">
                  We sent a 6-digit verification code to <br />
                  <strong className="text-[#17202A] dark:text-white font-semibold">{form.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                {/* 6-Digit OTP Boxes */}
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

                {/* Resend OTP Timer Row */}
                <div className="flex items-center justify-between text-xs text-[#5F6872] dark:text-[#89919A]">
                  <span>Didn't receive code?</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="font-semibold text-[#145A4A] dark:text-[#4F8068] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Resend OTP
                    </button>
                  ) : (
                    <span className="font-medium text-[#89919A]">
                      Resend in <strong className="text-[#145A4A] dark:text-[#4F8068]">{resendTimer}s</strong>
                    </span>
                  )}
                </div>

                {/* Verify & Complete Button */}
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
                    'Verify & Create Account'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Footer Copyright */}
          <div className="text-center text-xs text-[#89919A] dark:text-gray-500 mt-6">
            © 2026 <span className="font-semibold text-[#5F6872] dark:text-gray-400">TaskFlow</span>. All rights reserved.
          </div>
        </div>

      </div>
    </div>
  )
}
