import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Eye, EyeOff, GraduationCap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type FormMode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<FormMode>('login');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStudentId('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
  };

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentId.trim() || !password.trim()) {
      setError('请填写学号和密码');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      login(studentId.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentId.trim() || !name.trim() || !password.trim()) {
      setError('请填写所有字段');
      return;
    }
    if (studentId.trim().length < 3) {
      setError('学号至少需要3位字符');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6位字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      register(studentId.trim(), name.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-pm-bg-primary relative overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0F4C81]/5 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#2A9D8F]/5 blur-[80px]" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-1.5 text-sm text-pm-text-secondary hover:text-pm-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="bg-white rounded-pm-xl shadow-pm-xl border border-pm-border overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-pm-xl bg-pm-primary-light flex items-center justify-center"
            >
              <GraduationCap className="w-8 h-8 text-pm-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold text-pm-text-primary font-heading mb-1">
              {mode === 'login' ? '欢迎回来' : '注册账号'}
            </h1>
            <p className="text-sm text-pm-text-secondary">
              {mode === 'login' ? '登录你的学习账号' : '创建一个新的学习账号'}
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-8 mb-4"
              >
                <div className="px-4 py-2.5 rounded-pm-md bg-pm-error-light text-pm-error text-sm">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-pm-text-primary mb-1.5">
                      学号
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="请输入学号"
                      className="w-full px-4 py-2.5 rounded-pm-lg border border-pm-border bg-pm-bg-primary text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pm-text-primary mb-1.5">
                      密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full px-4 py-2.5 rounded-pm-lg border border-pm-border bg-pm-bg-primary text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text-secondary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pm-lg bg-pm-primary text-white font-medium text-sm hover:bg-pm-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-pm-primary"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    登录
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-pm-text-primary mb-1.5">
                      学号
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="请输入学号（至少3位）"
                      className="w-full px-4 py-2.5 rounded-pm-lg border border-pm-border bg-pm-bg-primary text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pm-text-primary mb-1.5">
                      姓名
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入真实姓名"
                      className="w-full px-4 py-2.5 rounded-pm-lg border border-pm-border bg-pm-bg-primary text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pm-text-primary mb-1.5">
                      密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少6位密码"
                        className="w-full px-4 py-2.5 rounded-pm-lg border border-pm-border bg-pm-bg-primary text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text-secondary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pm-text-primary mb-1.5">
                      确认密码
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full px-4 py-2.5 rounded-pm-lg border border-pm-border bg-pm-bg-primary text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pm-lg bg-pm-accent text-white font-medium text-sm hover:bg-pm-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    注册
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Switch mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-pm-text-secondary hover:text-pm-primary transition-colors"
              >
                {mode === 'login' ? (
                  <span>
                    还没有账号？
                    <span className="text-pm-primary font-medium ml-1">去注册</span>
                  </span>
                ) : (
                  <span>
                    已有账号？
                    <span className="text-pm-primary font-medium ml-1">去登录</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Admin hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-pm-text-muted mt-4"
        >
          管理员账号请使用服务器后台配置的账号密码
        </motion.p>
      </div>
    </div>
  );
}
