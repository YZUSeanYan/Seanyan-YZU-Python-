import { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Flame, LogIn, LogOut, ShieldCheck, ChevronDown, Settings } from 'lucide-react';
import { PythonLogo } from './SvgAssets';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const location = useLocation();
  const { stats } = useStudyStats();
  const { authState, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const canUsePractice2 = authState.user?.role === 'admin' || Boolean(authState.user?.practice2Enabled);
  const navLinks = useMemo(
    () => [
      { to: '/', label: '首页' },
      { to: '/practice', label: '练习' },
      ...(canUsePractice2 ? [{ to: '/practice-2', label: '专项练习2' }] : []),
      { to: '/memory', label: '背题' },
      { to: '/sim-exam', label: '仿真' },
      { to: '/wrongbook', label: '错题本' },
      { to: '/stats', label: '统计' },
      { to: '/settings', label: '设置' },
    ],
    [canUsePractice2]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-pm-bg-card border-b border-pm-border"
      style={{
        boxShadow: scrolled ? 'var(--pm-shadow-sm)' : 'none',
        transition: 'box-shadow 200ms ease',
      }}
    >
      <div className="max-w-[1200px] mx-auto h-full px-3 sm:px-4 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <PythonLogo className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="font-heading font-semibold text-[18px] sm:text-[22px] text-pm-primary">
            SeanYan
          </span>
        </NavLink>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className="relative px-4 py-2 text-sm font-medium font-body transition-colors"
                style={{
                  color: isActive ? 'var(--pm-primary)' : 'var(--pm-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--pm-text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--pm-text-secondary)';
                }}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-pm-primary rounded-full"
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Streak Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-pm-full bg-pm-orange-light">
            <Flame className="w-4 h-4 text-pm-orange" />
            <span className="text-sm font-semibold text-pm-orange">{stats.streakDays}</span>
          </div>

          {/* Auth Section */}
          {authState.isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-pm-md hover:bg-pm-bg-primary transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-pm-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {authState.user?.name.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-pm-text-primary max-w-[80px] truncate">
                  {authState.user?.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-pm-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-[min(92vw,12rem)] bg-white rounded-pm-lg border border-pm-border shadow-pm-lg py-1 z-50"
                  >
                    <div className="px-3 py-2 border-b border-pm-border mb-1">
                      <p className="text-sm font-medium text-pm-text-primary truncate">
                        {authState.user?.name}
                      </p>
                      <p className="text-xs text-pm-text-muted truncate">
                        {authState.user?.studentId}
                      </p>
                    </div>
                    {isAdmin() && (
                      <NavLink
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-pm-text-secondary hover:bg-pm-bg-primary hover:text-pm-text-primary transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        后台管理
                      </NavLink>
                    )}
                    <NavLink
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-pm-text-secondary hover:bg-pm-bg-primary hover:text-pm-text-primary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      设置与关于
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-pm-error hover:bg-pm-error-light transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
            >
              <LogIn className="w-3.5 h-3.5" />
              登录
            </NavLink>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-1 rounded-md hover:bg-pm-bg-primary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-pm-text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-pm-text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="md:hidden bg-pm-bg-card border-b border-pm-border shadow-pm-lg max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="block px-3 py-2 rounded-pm-md text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? 'var(--pm-primary)' : 'var(--pm-text-secondary)',
                    backgroundColor: isActive ? 'var(--pm-primary-light)' : 'transparent',
                  }}
                >
                  {link.label}
                </NavLink>
              );
            })}
            {!authState.isLoggedIn && (
              <NavLink
                to="/login"
                className="block px-3 py-2 rounded-pm-md text-sm font-medium text-pm-primary bg-pm-primary-light"
              >
                登录
              </NavLink>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
