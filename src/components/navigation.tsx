'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-blue-100/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout - Stack vertically */}
        <div className="flex flex-col md:hidden py-4 space-y-4">
          {/* Logo and title row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200"
            >
              <Image
                src="/images/hero1.jpeg"
                alt="WeerOmzet Logo"
                width={80}
                height={80}
                className="rounded-lg"
                priority
              />
              <span className="text-xl font-bold text-[#003f7a]">WeerOmzet</span>
            </button>

            {/* Mobile Auth Buttons */}
            {status === 'loading' ? (
              <div className="flex items-center space-x-2">
                <div className="bg-slate-200 animate-pulse h-8 w-20 rounded-lg"></div>
                <div className="bg-slate-200 animate-pulse h-8 w-20 rounded-lg"></div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/dashboard"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  Uitloggen
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors text-sm"
                >
                  Inloggen
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  Start gratis trial
                </Link>
              </div>
            )}
          </div>

          {/* Navigation links row */}
          <div className="flex space-x-6 justify-center">
            <a href="#prijzen" className="text-base text-slate-600 hover:text-slate-800 transition-colors font-medium">
              Prijs
            </a>
            <a href="#FAQ" className="text-base text-slate-600 hover:text-slate-800 transition-colors font-medium">
              FAQ
            </a>
            <a href="#Contact" className="text-base text-slate-600 hover:text-slate-800 transition-colors font-medium">
              Contact
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
              Prijs
            </a>
            <a href="#FAQ" className="text-lg text-slate-600 hover:text-slate-800 transition-colors font-medium">
              Veelgestelde vragen
            </a>
            <a href="#Contact" className="text-lg text-slate-600 hover:text-slate-800 transition-colors font-medium">
              Contact
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="flex items-center space-x-4">
                <div className="bg-slate-200 animate-pulse h-10 w-24 rounded-lg"></div>
                <div className="bg-slate-200 animate-pulse h-10 w-32 rounded-lg"></div>
              </div>
            ) : session ? (
              <>
                <span className="text-slate-600">
                  Welkom, {session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}
                </span>
                <Link
                  href="/dashboard"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  Inloggen
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Start gratis trial
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}