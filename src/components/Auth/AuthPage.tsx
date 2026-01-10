import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types";

type Mode = "signin" | "signup";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("participant");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, assignRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, role);
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/");
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      // Pass the role only if we are in signup mode.
      const userRole = await signInWithGoogle(mode === "signup" ? role : undefined);
      if (userRole) {
        navigate("/");
      } else {
        // If no role returned, user needs to pick one (likely first time login via "Sign In").
        setShowRoleSelection(true);
      }
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? "Google sign-in failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (selected: UserRole) => {
    await assignRole(selected);
    navigate("/");
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="grid max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          {/* Left Side: Brand & Visuals */}
          <div className="relative hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <img src="/logo.png" alt="EventSphere" className="h-10 w-10 rounded-xl" />
                <span className="text-2xl font-bold tracking-tight">EventSphere</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                One platform for all your <span className="text-brand-pink">event needs</span>.
              </h2>
              <p className="mt-4 text-slate-400">
                Whether you are organizing a hackathon or participating in a cultural fest, we have got you covered.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/20 text-brand-orange">📅</div>
                <div>
                  <p className="font-semibold">Seamless Registration</p>
                  <p className="text-xs text-slate-400">Join events in seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/20 text-brand-blue">📊</div>
                <div>
                  <p className="font-semibold">Real-time Analytics</p>
                  <p className="text-xs text-slate-400">For organizers and admins</p>
                </div>
              </div>
            </div>

            {/* Decorative Background Circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-brand-pink/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl" />
          </div>

          {/* Right Side: Auth Form */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-2xl font-bold text-slate-900">
                {mode === "signin" ? "Welcome back" : "Create an account"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {mode === "signin"
                  ? "Enter your details to access your account."
                  : "Get started with your free account today."}
              </p>
            </div>

            {/* Toggle Mode */}
            <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setRole("participant")}
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${role === "participant"
                      ? "border-brand-pink bg-brand-pink/5 text-brand-pink"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span className="block text-xl">👤</span>
                    <span className="mt-1 block text-xs font-semibold">Participant</span>
                  </div>
                  <div
                    onClick={() => setRole("organizer")}
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${role === "organizer"
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span className="block text-xl">👔</span>
                    <span className="mt-1 block text-xs font-semibold">Organizer</span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              onClick={handleGoogle}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>

      {showRoleSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">Finish Setting Up</h3>
            <p className="mt-2 text-slate-600">
              Please select how you will be using EventSphere.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleRoleSelect("participant")}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-brand-pink hover:bg-brand-pink/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink/10 text-xl">👤</div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">Participant</span>
                  <span className="text-sm text-slate-500">I want to discover and join events</span>
                </div>
              </button>
              <button
                onClick={() => handleRoleSelect("organizer")}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-brand-blue hover:bg-brand-blue/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-xl">👔</div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">Organizer</span>
                  <span className="text-sm text-slate-500">I want to create and manage events</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

