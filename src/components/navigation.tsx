'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export function Navigation() {
  const { data: session, status } = useSession();
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="bg-blue-100/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout - Stack vertically */}
        <div className="flex flex-col md:hidden py-3 space-y-3">
          {/* Logo row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
            >
              <Image
                src="/images/hero1.jpeg"
                alt="WeerOmzet Logo"
                width={50}
                height={50}
                className="rounded-lg"
                priority
              />
              <span className="text-base font-bold text-[#003f7a]">WeerOmzet</span>
            </button>

            {/* Mobile Language Buttons - Compact */}
            <div className="flex items-center bg-white/60 rounded-lg border border-slate-300/40 p-0.5">
              <button
                onClick={() => setLanguage('nl')}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                  language === 'nl'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Nederlands"
              >
                NL
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('it')}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                  language === 'it'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Italiano"
              >
                IT
              </button>
            </div>
          </div>

          {/* Auth buttons row */}
          <div className="flex items-center justify-end space-x-1.5">
            {status === 'loading' ? (
                <>
                  <div className="bg-slate-200 animate-pulse h-8 w-16 rounded-lg"></div>
                  <div className="bg-slate-200 animate-pulse h-8 w-16 rounded-lg"></div>
                </>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                >
                  {t('nav.out')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors text-xs px-3 py-1.5"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                >
                  {t('nav.trial')}
                </Link>
              </>
            )}
          </div>

          {/* Navigation links row */}
          <div className="flex space-x-4 justify-center">
            <a href="#prijzen" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
              {t('nav.price')}
            </a>
            <a href="#FAQ" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
              {t('nav.faqShort')}
            </a>
            <a href="#Contact" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
              {t('nav.contact')}
            </a>
          </div>
        </div>

        {/* Desktop Layout - Original horizontal layout */}
        <div className="hidden md:flex justify-between items-center h-40">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200"
          >
            <Image
              src="/images/hero1.jpeg"
              alt="WeerOmzet Logo"
              width={150}
              height={150}
              className="rounded-lg"
              priority
            />
            <span className="text-2xl font-bold text-[#003f7a]">WeerOmzet</span>
          </button>

          <div className="flex space-x-8">
            <a href="#prijzen" className="text-lg text-slate-600 hover:text-slate-800 transition-colors font-medium">
              {t('nav.price')}
            </a>
            <a href="#FAQ" className="text-lg text-slate-600 hover:text-slate-800 transition-colors font-medium">
              {t('nav.faq')}
            </a>
            <a href="#Contact" className="text-lg text-slate-600 hover:text-slate-800 transition-colors font-medium">
              {t('nav.contact')}
            </a>
          </div>

          {/* Desktop Language & Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Language Buttons */}
            <div className="flex items-center bg-white/60 rounded-lg border border-slate-300/40 p-1">
              <button
                onClick={() => setLanguage('nl')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                  language === 'nl'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Nederlands"
              >
                NL
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('it')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                  language === 'it'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Italiano"
              >
                IT
              </button>
            </div>

            {status === 'loading' ? (
              <div className="flex items-center space-x-4">
                <div className="bg-slate-200 animate-pulse h-10 w-24 rounded-lg"></div>
                <div className="bg-slate-200 animate-pulse h-10 w-32 rounded-lg"></div>
              </div>
            ) : session ? (
              <>
                <span className="text-slate-600">
                  {t('nav.welcome')}, {session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}
                </span>
                <Link
                  href="/dashboard"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {t('nav.trial')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}