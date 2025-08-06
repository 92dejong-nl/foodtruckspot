import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="bg-stone-50 border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-800">🚚 FoodTruckSpot</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#prijzen" className="text-slate-600 hover:text-blue-800 transition-colors font-medium">
                Prijzen
              </a>
              <a href="#contact" className="text-slate-600 hover:text-blue-800 transition-colors font-medium">
                Contact
              </a>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                Mijn Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-amber-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Vervang onderbuikgevoel door feiten.
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
              FoodTruckSpot analyseert je verkoopdata en koppelt dit aan het weer.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {/* Input Block */}
            <div className="bg-stone-100 p-8 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Wat je nodig hebt</h3>
              <p className="text-slate-600">
                Een simpel bestand met: Datum, Locatie, Omzet.
              </p>
            </div>
            
            {/* Output Block */}
            <div className="bg-stone-100 p-8 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Wat je ontdekt</h3>
              <p className="text-slate-600">
                Welke dagen, locaties en weersomstandigheden écht voor je werken.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="mb-4">
              <Link href="/upload" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block">
                Upload je data
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              Start voor €19/maand. Altijd opzegbaar.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Zie hoe het dashboard werkt
            </h2>
          </div>
          <div className="relative">
            <div className="aspect-video bg-stone-100 rounded-xl overflow-hidden shadow-lg border border-stone-200">
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-stone-50 to-stone-100">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">2 minuten demo</h3>
                  <p className="text-slate-600">Bekijk hoe FoodTruckSpot je data analyseert</p>
                  <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Start demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="py-20 bg-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Van data naar concrete inzichten
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Onze analyse legt de verborgen patronen in je cijfers bloot.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-stone-50 p-8 rounded-xl shadow-sm border border-stone-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Locatie Prestatie</h3>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-slate-700 text-sm leading-relaxed">
                  &ldquo;Locatie A presteert 40% beter op doordeweekse dagen dan in het weekend.&rdquo;
                </p>
              </div>
            </div>
            
            <div className="bg-stone-50 p-8 rounded-xl shadow-sm border border-stone-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Dagpatronen</h3>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-slate-700 text-sm leading-relaxed">
                  &ldquo;Je denkt dat vrijdag top is, maar de data toont dat donderdag structureel 15% winstgevender is.&rdquo;
                </p>
              </div>
            </div>
            
            <div className="bg-stone-50 p-8 rounded-xl shadow-sm border border-stone-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🌤️</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Weer Impact</h3>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-slate-700 text-sm leading-relaxed">
                  &ldquo;Ontdek dat locatie A een &apos;mooi-weer-locatie&apos; is, terwijl locatie C (bij het overdekte station) juist stabiel presteert tijdens regenachtige dagen.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="prijzen" className="py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Eén simpele prijs. Altijd opzegbaar.
            </h2>
            <p className="text-xl text-slate-600">
              Krijg doorlopend inzicht in de prestaties van je foodtruck.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <div className="bg-stone-100 rounded-2xl shadow-xl p-8 border-2 border-blue-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Per Maand</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-blue-800">€19</span>
                </div>
                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Start met een analyse van je volledige historie</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Voeg maandelijks nieuwe data toe en volg je groei</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Ontdek seizoenspatronen en trends over tijd</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Onbeperkte toegang tot je interactieve dashboard</span>
                  </li>
                </ul>
                <Link href="/upload" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg text-lg font-semibold transition-colors block text-center">
                  Start je abonnement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-neutral-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-blue-800">🚚 FoodTruckSpot</span>
              </div>
              <p className="text-slate-600 mb-6 max-w-md">
                FoodTruckSpot: Continue data-analyse voor Nederlandse foodtrucks.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-slate-600">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <a href="mailto:hallo@foodtruckspot.nl" className="hover:text-blue-800 transition-colors">
                    hallo@foodtruckspot.nl
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Links</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-slate-600 hover:text-blue-800 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-slate-600 hover:text-blue-800 transition-colors">Voorwaarden</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-12 pt-8 text-center">
            <p className="text-slate-600">
              © 2024 FoodTruckSpot. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
