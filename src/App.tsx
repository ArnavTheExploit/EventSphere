import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Layout/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { AuthPage } from "./components/Auth/AuthPage";
import { ParticipantDashboard } from "./components/Participant/ParticipantDashboard";
import { OrganizerDashboard } from "./components/Organizer/OrganizerDashboard";
import { ProtectedRoute } from "./components/Routing/ProtectedRoute";
import { Footer } from "./components/Layout/Footer";
import { Testimonials } from "./components/Layout/Testimonials";
import { RegistrationPage } from "./components/Participant/RegistrationPage";

function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-white pb-16 pt-24 md:pt-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 md:text-7xl">
            Where Experiences <br className="hidden md:block" />
            <span className="text-brand-blue">Come to Life.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            EventSphere is the premier platform for discovering campus events, hackathons, and
            cultural fests. Seamlessly organize, register, and connect.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <a
              href="#events"
              className="rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Explore Events
            </a>
            <a
              href="/auth"
              className="rounded-full border border-slate-200 px-8 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      <section id="events" className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
            <a href="#" className="text-sm font-medium text-brand-blue hover:underline">View all &rarr;</a>
          </div>
          <ParticipantDashboard />
        </div>
      </section>

      <Testimonials />
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/participant"
              element={
                <ProtectedRoute requiredRole="participant">
                  <div className="mx-auto max-w-6xl px-4 py-8">
                    <ParticipantDashboard />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/register/:eventId"
              element={
                <ProtectedRoute requiredRole="participant">
                  <RegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <div className="mx-auto max-w-6xl px-4 py-8">
                    <OrganizerDashboard />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}


