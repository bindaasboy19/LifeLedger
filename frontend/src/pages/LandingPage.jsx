import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const featureCards = [
  {
    title: 'Live Blood Intelligence',
    description: 'Real-time stock visibility across hospitals and blood banks with expiry-aware tracking.'
  },
  {
    title: 'SOS Emergency Mesh',
    description: 'Instant donor matching based on compatibility, location, and active availability signals.'
  },
  {
    title: 'Predictive Preparedness',
    description: 'AI-powered 7-day demand forecasting for shortage prevention and smarter governance.'
  }
];

const highlights = [
  {
    label: 'About Us',
    heading: 'LifeLedger connects urgency with action.',
    text: 'We built LifeLedger to remove delays in blood response through coordinated hospitals, donors, and administrators.'
  },
  {
    label: 'Aims & Vision',
    heading: 'Zero avoidable blood shortage.',
    text: 'Our vision is a responsive national blood grid where verified institutions can predict, coordinate, and respond before scarcity escalates.'
  },
  {
    label: 'Contact Us',
    heading: 'Partner, integrate, and scale impact.',
    text: 'Reach our implementation team for NGO onboarding, hospital integrations, and emergency workflow rollouts.'
  }
];

const metrics = [
  { value: '24/7', label: 'Emergency readiness' },
  { value: '8', label: 'Blood groups tracked' },
  { value: '7-day', label: 'Demand forecast horizon' },
  { value: 'Real-time', label: 'Cross-client updates' }
];

const roleJourneys = {
  user: {
    title: 'Patient / Attendant',
    steps: ['Search nearest blood source', 'Trigger SOS in one tap', 'Track response lifecycle']
  },
  donor: {
    title: 'Donor',
    steps: ['Set availability status', 'Accept SOS requests nearby', 'Track donation history and cooldown']
  },
  hospital: {
    title: 'Hospital / Blood Bank',
    steps: ['Update stock in real-time', 'Create donation camps', 'Monitor shortage forecast']
  },
  admin: {
    title: 'Admin',
    steps: ['Verify organizations', 'Review SOS logs and analytics', 'Generate prototype activity data']
  }
};

const faqs = [
  {
    q: 'Can we run this as a demo instantly?',
    a: 'Yes. Use seeded demo accounts and trigger prototype activity from the admin dashboard to populate fresh SOS, stock, and camps.'
  },
  {
    q: 'What if AI service is down?',
    a: 'The backend now serves fallback forecasts from historical signals, so dashboards remain operational with a warning banner.'
  },
  {
    q: 'Is this suitable for deployment demos?',
    a: 'Yes. The app is structured for Vercel + Render deployment and includes environment-driven config and seed scripts.'
  }
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeRole, setActiveRole] = useState('user');
  const [activeFaq, setActiveFaq] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % highlights.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentJourney = useMemo(() => roleJourneys[activeRole], [activeRole]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 animate-float rounded-full bg-brand-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-72 h-80 w-80 animate-float rounded-full bg-rose-300/30 blur-3xl [animation-delay:0.8s]" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-52 w-52 animate-float rounded-full bg-emerald-200/30 blur-3xl [animation-delay:1.4s]" />

      <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-600">LifeLedger</p>
            <h1 className="text-lg font-extrabold">Smart Blood Bank Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">
              Login
            </Link>
            <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:translate-y-[-1px]">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 md:px-8 md:pt-14">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-6 animate-fade-up">
            <p className="inline-flex rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand-700 dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-200">
              Built for real emergency operations
            </p>
            <h2 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Coordinate blood response with speed, trust, and intelligence.
            </h2>
            <p className="max-w-xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
              LifeLedger unifies donors, hospitals, blood banks, and administrators through real-time updates, SOS workflows, and predictive planning.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-rose-500/30 transition hover:translate-y-[-1px]">
                Start Saving Lives
              </Link>
              <Link to="/login" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                I Already Have an Account
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 animate-fade-up [animation-delay:180ms]">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Key outcomes</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {metrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className="rounded-2xl bg-white/75 p-4 transition hover:scale-[1.02] dark:bg-slate-900/70"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <p className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">{metric.value}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{metric.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mt-16">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">Features</p>
            <h3 className="text-3xl font-extrabold">Operational modules that actually work in crisis</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((card, index) => (
              <article
                key={card.title}
                className="glass-card rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <h4 className="text-xl font-bold">{card.title}</h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">Role journey</p>
            <h3 className="mt-2 text-3xl font-extrabold">Interactive flow for each participant</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(roleJourneys).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveRole(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    activeRole === key
                      ? 'bg-brand-600 text-white'
                      : 'border border-slate-300 bg-white/70 dark:border-slate-700 dark:bg-slate-900/70'
                  }`}
                >
                  {roleJourneys[key].title}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
              <p className="font-semibold text-brand-800 dark:text-brand-200">{currentJourney.title}</p>
              <ol className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {currentJourney.steps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="glass-card relative rounded-3xl p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">About / Vision / Contact</p>
            <h4 className="mt-3 text-2xl font-extrabold">{highlights[activeSlide].heading}</h4>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">{highlights[activeSlide].text}</p>
            <div className="mt-6 flex gap-2">
              {highlights.map((item, index) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 w-10 rounded-full transition ${
                    activeSlide === index ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={item.label}
                />
              ))}
            </div>
            <div className="mt-8 rounded-2xl bg-slate-900 px-5 py-4 text-white dark:bg-slate-800">
              <p className="text-sm font-semibold">Contact us</p>
              <p className="mt-1 text-sm text-slate-200">support@lifeledger.app | +91 98765 43210</p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">FAQ</p>
            <h3 className="mt-2 text-3xl font-extrabold">Questions teams ask during rollout</h3>
            <div className="mt-5 space-y-3">
              {faqs.map((item, index) => (
                <div key={item.q} className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                  <button
                    type="button"
                    onClick={() => setActiveFaq((prev) => (prev === index ? -1 : index))}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="font-semibold">{item.q}</span>
                    <span className="text-lg font-bold">{activeFaq === index ? '−' : '+'}</span>
                  </button>
                  {activeFaq === index ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.a}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-rose-600 p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Ready to onboard?</p>
            <h3 className="mt-2 text-3xl font-extrabold md:text-4xl">Join LifeLedger and build a no-delay blood response network.</h3>
            <p className="mt-3 max-w-3xl text-sm text-white/90 md:text-base">
              Register your role, complete verification, and start coordinating stock, donor response, camps, analytics, and prototype workflows in one platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 transition hover:translate-y-[-1px]">
                Register Now
              </Link>
              <Link to="/login" className="rounded-xl border border-white/70 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Login to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
