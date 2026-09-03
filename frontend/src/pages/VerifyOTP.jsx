import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/');
      return;
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pasted.every((char) => /^\d$/.test(char))) {
      setOtp([...pasted, ...Array(6 - pasted.length).fill('')]);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      toast.success(res.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await api.post('/auth/resend-otp', { email });
      toast.success(res.data.message);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <MessageCircle className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PingTalk</h1>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MailCheck className="text-primary" size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verify your email
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              We sent a 6-digit code to <br />
              <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
             className="w-full bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-6">
            {timer > 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Resend code in <span className="font-medium text-gray-700 dark:text-gray-300">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;