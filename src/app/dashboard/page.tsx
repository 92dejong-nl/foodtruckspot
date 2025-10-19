'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/auth/login'); // Not signed in
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 flex items-center justify-center">
        <div className="text-slate-600">Laden...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Er is iets misgegaan');
      }
    } catch (error) {
      alert('Er is iets misgegaan bij het upgraden');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-slate-900">
                WeerOmzet
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welkom, {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Welkom bij je persoonlijke WeerOmzet dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trial/Upgrade Status Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">
              Gratis Trial Actief
            </h3>
            <p className="text-blue-100 mb-4">
              Je hebt nog 30 dagen gratis toegang tot alle functies
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {isUpgrading ? 'Laden...' : 'Upgrade naar Pro - €10/maand'}
            </button>
          </div>

          {/* Upload Data Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Data Uploaden
            </h3>
            <p className="text-slate-600 mb-4">
              Upload je omzetdata om inzichten te krijgen
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Data
            </Link>
          </div>

          {/* Analytics Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Analyses
            </h3>
            <p className="text-slate-600 mb-4">
              Bekijk je omzet analyses en rapporten
            </p>
            <Link
              href="/results"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Bekijk Analyses
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Profiel
            </h3>
            <p className="text-slate-600 mb-4">
              Beheer je account instellingen
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
              Instellingen
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Recente Activiteit
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-500 text-center py-8">
              Nog geen activiteit. Begin met het uploaden van je eerste dataset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}