'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from 'react';
import { Navigation } from "@/components/navigation";

// Screenshot Slider Component
function ScreenshotSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  const screenshots = [
    {
      src: "/images/foto3.png",
      alt: "Dashboard overzicht met omzetanalyse",
      title: "Dashboard overzicht met omzetanalyse"
    },
    {
      src: "/images/foto4.png", 
      alt: "Locatie vergelijking met prestatie grafieken",
      title: "Locatie vergelijking met prestatie grafieken"
    },
    {
      src: "/images/foto5.png",
      alt: "Weer impact analyse per locatie", 
      title: "Weer impact analyse per locatie"
    },
    {
      src: "/images/foto6.png",
      alt: "Trends en patronen overzicht",
      title: "Trends en patronen overzicht"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (!isPaused && !fullscreenImage) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused, fullscreenImage]);

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (fullscreenImage) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          prevSlideFullscreen();
        } else if (e.key === 'ArrowRight') {
          nextSlideFullscreen();
        } else if (e.key === 'Escape') {
          closeFullscreen();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [fullscreenImage, currentSlide]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  
  const openFullscreen = (imageSrc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenImage(imageSrc);
    // Set the current slide to match the clicked image
    const imageIndex = screenshots.findIndex(screenshot => screenshot.src === imageSrc);
    if (imageIndex !== -1) {
      setCurrentSlide(imageIndex);
    }
    // No scrolling - let modal position itself naturally
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const nextSlideFullscreen = () => {
    const nextIndex = (currentSlide + 1) % screenshots.length;
    setCurrentSlide(nextIndex);
    setFullscreenImage(screenshots[nextIndex].src);
  };

  const prevSlideFullscreen = () => {
    const prevIndex = (currentSlide - 1 + screenshots.length) % screenshots.length;
    setCurrentSlide(prevIndex);
    setFullscreenImage(screenshots[prevIndex].src);
  };

  return (
    <div 
      className="relative max-w-5xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Slider Container */}
      <div className="relative h-80 lg:h-96 overflow-hidden rounded-2xl shadow-2xl">
        {/* Sliding Images Container */}
        <div 
          className="flex transition-all duration-1000 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {screenshots.map((screenshot, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <div
                className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm border border-blue-200/50 shadow-xl mx-2 sm:mx-4 h-full overflow-hidden rounded-xl cursor-pointer group"
                onClick={(e) => openFullscreen(screenshot.src, e)}
              >
                <div className="relative h-64 lg:h-80">
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    fill
                    className="object-cover transition-all duration-300"
                    quality={100}
                    priority={index === currentSlide}
                  />
                  {/* Click indicator */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                </div>
                <div className="p-3 sm:p-4 text-center bg-gradient-to-r from-blue-50/80 to-sky-50/80">
                  <h5 className="text-sm sm:text-lg font-semibold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors duration-300">{screenshot.title}</h5>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-blue-200/50 z-20 opacity-0 hover:opacity-100 group-hover:opacity-100"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-blue-200/50 z-20 opacity-0 hover:opacity-100 group-hover:opacity-100"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Enhanced Dots Navigation */}
      <div className="flex justify-center mt-8 space-x-3">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative transition-all duration-500 rounded-full ${
              index === currentSlide 
                ? 'w-12 h-3 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-300/50' 
                : 'w-3 h-3 bg-blue-300/70 hover:bg-blue-400 hover:scale-125'
            }`}
          >
            {/* Progress indicator for active slide */}
            {index === currentSlide && !isPaused && (
              <div 
                className="absolute inset-0 bg-white/30 rounded-full origin-left"
                style={{
                  animation: 'slideProgress 5s linear infinite'
                }}
              />
            )}
          </button>
        ))}
      </div>


      {/* Enhanced Fullscreen Modal */}
      {fullscreenImage && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={closeFullscreen}
          />

          {/* Popup Container */}
          <div className="fixed inset-0 flex items-end justify-center z-50 p-4 pb-8">
            <div
              className="relative max-w-6xl w-full transform transition-all duration-300 animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation Arrows */}
              <button
                onClick={prevSlideFullscreen}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-20"
                title="Vorige afbeelding"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlideFullscreen}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-20"
                title="Volgende afbeelding"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Close button */}
              <button
                onClick={closeFullscreen}
                className="absolute -top-4 -right-4 bg-white hover:bg-slate-50 rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-30"
                title="Sluiten"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image popup with enhanced styling */}
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="relative">
                  <Image
                    src={fullscreenImage}
                    alt={screenshots.find(s => s.src === fullscreenImage)?.alt || "Screenshot"}
                    width={1400}
                    height={900}
                    className="object-contain w-full max-h-[80vh]"
                    quality={100}
                    priority
                  />

                  {/* Image title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-white text-lg font-semibold">
                      {screenshots.find(s => s.src === fullscreenImage)?.title}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      {currentSlide + 1} van {screenshots.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fullscreen dots navigation */}
              <div className="flex justify-center mt-6 space-x-3">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      setFullscreenImage(screenshots[index].src);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentSlide
                        ? 'w-12 h-3 bg-white shadow-lg'
                        : 'w-3 h-3 bg-white/50 hover:bg-white/70 hover:scale-125'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/70 rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-blue-50/50 transition-colors duration-200"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">{question}</h3>
          <svg
            className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-6 pb-6">
          <p className="text-slate-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// Scroll Animation Hook
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Animated Card Component
function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform-gpu ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-12 scale-90'
      }`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : '0ms'
      }}
    >
      {children}
    </div>
  );
}

// Video Player Component
function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(false);
  };

  return (
    <div className="relative group">
      <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-300">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          poster="/images/thumbnail.png"
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <source src="/video/schermopname1.mp4" type="video/mp4" />
          Je browser ondersteunt geen HTML5 video.
        </video>
        
        {/* Play Button Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl"
            >
              <svg className="w-8 h-8 text-slate-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Video Controls Overlay */}
        {isPlaying && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all duration-200"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">TruckSpot Dashboard Demo</div>
              </div>
              <button
                onClick={() => videoRef.current?.requestFullscreen()}
                className="w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all duration-200"
                title="Volledig scherm"
              >
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Video Description */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Bekijk hoe je omzetdata duidelijk wordt weergegeven</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50">
      <Navigation />



      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-sky-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            {/* Text Content */}
            <div className="relative z-10">
              <div className="bg-blue-50/95 backdrop-blur-sm p-8 lg:p-12 rounded-2xl shadow-xl border-2 border-blue-200/60">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-6 leading-tight">
                  Begrijp je omzet, zie wat werkt
                </h1>
                <div className="mb-8 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xl md:text-2xl text-blue-900">Snel inzicht in je omzet per locatie en maand</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xl md:text-2xl text-blue-900">Spot patronen, zie weergevoeligheid per locatie</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xl md:text-2xl text-blue-900">Gewoon, handig om te weten</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register" className="bg-[#003f7a] hover:bg-[#002d5a] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block text-center">
                    Probeer gratis voor 30 dagen
                  </Link>
                  <a href="#demo" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block text-center border border-slate-300">
                    Bekijk Demo
                  </a>
                </div>
              </div>
            </div>
            
            {/* Foto1 Image */}
            <div className="relative">
              <div className="relative min-h-[50vh] lg:min-h-[60vh] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/foto1.jpeg"
                  alt="Foto1"
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Integrated Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedCard>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 overflow-hidden">
              {/* What you need - Top */}
              <div className="bg-blue-50/60 p-12">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-2xl font-semibold text-slate-800 mb-6">💡 Wat je nodig hebt</h3>
                  <div className="bg-white/70 p-6 rounded-xl border border-blue-200">
                    <p className="text-lg text-slate-700 mb-4">
                      Een CSV of Excel met 3 kolommen:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                        <span className="text-slate-700"><strong>Datum</strong> (bijv. 15-01-2024)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                        <span className="text-slate-700"><strong>Locatie</strong> (bijv. Museumplein)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                        <span className="text-slate-700"><strong>Omzet</strong> (bijv. €450)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-100/90 p-12">
                {/* What you get back */}
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-2xl font-semibold text-slate-800 mb-6">⚡ Wat je terugkrijgt</h3>
                  
                  {/* Direct insights */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-slate-800 mb-4">Direct inzicht in:</h4>
                    <div className="bg-white/70 p-6 rounded-xl border border-blue-200 space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700"><strong>Beste locatie:</strong> Albert Cuyp €580 gem. vs Oosterpark €440 gem.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700"><strong>Weekpatronen:</strong> Zaterdag +35% meer omzet dan maandag</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700"><strong>Seizoenstrends:</strong> Zomer €520/dag vs winter €380/dag</span>
                      </div>
                    </div>
                  </div>

                  {/* Weather impact */}
                  <div>
                    <h4 className="text-lg font-medium text-slate-800 mb-4">Weerimpact per locatie:</h4>
                    <div className="bg-white/70 p-6 rounded-xl border border-blue-200 space-y-4">
                      <div className="border-l-4 border-orange-400 pl-4">
                        <div className="font-medium text-slate-800 mb-1">Oosterpark:</div>
                        <div className="text-slate-600 text-sm">Bij regen -€120, bij &lt;10°C -€80</div>
                      </div>
                      <div className="border-l-4 border-green-400 pl-4">
                        <div className="font-medium text-slate-800 mb-1">Albert Cuyp:</div>
                        <div className="text-slate-600 text-sm">Stabiel bij regen (-€30), temperatuur weinig effect</div>
                      </div>
                    </div>
                  </div>

                  {/* Screenshot Gallery */}
                  <div className="mt-12">
                    <h4 className="text-lg font-medium text-slate-800 mb-6 text-center">Zie je resultaten in actie:</h4>
                    <ScreenshotSlider />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20 bg-gradient-to-br from-blue-50 to-sky-50" style={{scrollMarginTop: '180px'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedCard>
            <div className="text-center mb-12">
              
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Zie hoe het dashboard werkt
              </h2>
              <p className="text-xl text-slate-600">
                Een korte demo van je persoonlijke omzet dashboard
              </p>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={200}>
            <VideoPlayer />
          </AnimatedCard>
        </div>
      </section>



      {/* Pricing Section */}
      <section id="prijzen" className="py-20 bg-gradient-to-br from-blue-50 to-sky-50" style={{scrollMarginTop: '180px'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedCard>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Eén simpele prijs. Altijd opzegbaar.
              </h2>
              <p className="text-xl text-slate-600">
                Handig dashboard voor €10 per maand. Meer niet. 30 dagen gratis proef.
              </p>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={200}>
            <div className="max-w-lg mx-auto">
              <div className="bg-white/70 rounded-2xl shadow-xl p-8 border-2 border-blue-300">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Per Maand</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-slate-800">€10</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-left">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-slate-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700">Upload je data en krijg direct inzichten</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-slate-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700">Update maandelijks en track je ontwikkeling</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-slate-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700">Zie patronen en trends in je omzet</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-slate-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700">Altijd toegang tot je persoonlijke dashboard</span>
                    </li>
                  </ul>
                  <Link href="/auth/register" className="w-full bg-[#003f7a] hover:bg-[#002d5a] text-white py-4 px-6 rounded-lg text-lg font-semibold transition-colors block text-center">
                    Start vandaag
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedCard>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Veelgestelde vragen
              </h2>
            </div>
          </AnimatedCard>
          <div className="space-y-4">
            <AnimatedCard delay={100}>
              <FAQItem
                question="Hoe snel zie ik resultaten?"
                answer="Direct na upload krijg je een volledig dashboard met analyses van je historische data. Nieuwe inzichten krijg je elke maand als je nieuwe data toevoegt."
              />
            </AnimatedCard>
            <AnimatedCard delay={200}>
              <FAQItem
                question="Welk formaat moet mijn data hebben?"
                answer="Een simpel CSV bestand met drie kolommen: Datum, Locatie, Omzet."
              />
            </AnimatedCard>
            <AnimatedCard delay={300}>
              <FAQItem
                question="Kan ik altijd opzeggen?"
                answer="Ja, maandelijks opzegbaar. Geen lange contracten of verborgen kosten. Je betaalt alleen voor de maanden die je gebruikt."
              />
            </AnimatedCard>
            <AnimatedCard delay={400}>
              <FAQItem
                question="Wordt mijn data veilig bewaard?"
                answer="Absoluut. Alle data wordt versleuteld opgeslagen en alleen gebruikt voor jouw persoonlijke analyses. We delen nooit data met derden."
              />
            </AnimatedCard>
            <AnimatedCard delay={500}>
              <FAQItem
                question="Hoe werkt de 30 dagen gratis proef?"
                answer="Je krijgt 30 dagen volledige toegang tot alle functies. Je kunt binnen deze periode kosteloos opzeggen - er zijn dan geen kosten aan verbonden. Na 30 dagen gaat het abonnement automatisch door voor €10 per maand, tenzij je eerder opzegt."
              />
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-br from-blue-100 to-sky-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedCard>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="col-span-2">
                <div className="flex items-center mb-4">
                  <span className="text-2xl font-bold text-slate-800">🚚 WeerOmzet</span>
                </div>
                <p className="text-slate-600 mb-6 max-w-md">
                  Simpel dashboard voor foodtruck eigenaren. Begrijp je omzet, zie patronen.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-slate-600">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <a href="mailto:hallo@truckspot.nl" className="hover:text-slate-800 transition-colors">
                      hallo@truckspot.nl
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Links</h4>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className="text-slate-600 hover:text-slate-800 transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="text-slate-600 hover:text-slate-800 transition-colors">Voorwaarden</Link></li>
                </ul>
              </div>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={200}>
            <div className="border-t border-slate-200 mt-12 pt-8 text-center">
              <p className="text-slate-600">
                © 2025 WeerOmzet. Alle rechten voorbehouden.
              </p>
            </div>
          </AnimatedCard>
        </div>
      </footer>
    </div>
  );
}
