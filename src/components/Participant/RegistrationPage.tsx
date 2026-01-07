import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockEvents } from "../../mockData";
import { db } from "../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export function RegistrationPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const event = mockEvents.find((e) => e.id === eventId);

    const [formData, setFormData] = useState({
        name: "",
        email: user?.email || "",
        phone: "",
        college: "",
        year: "",
        teamMembers: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!event) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-slate-500">Event not found.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!user) {
                throw new Error("You must be logged in to register.");
            }

            const registrationData = {
                eventId: event.id,
                userId: user.uid,
                ...formData,
                registeredAt: new Date().toISOString(),
            };

            // Write to Firebase Firestore
            await addDoc(collection(db, "registrations"), registrationData);

            setSuccess(true);
            setTimeout(() => {
                navigate("/participant");
            }, 2000);

        } catch (err: any) {
            console.error("Registration failed:", err);
            setError("Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="mx-auto flex h-96 max-w-lg items-center justify-center px-4">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Registration Successful!</h2>
                    <p className="mt-2 text-slate-500">You have successfully registered for {event.title}. Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Event Details Column */}
                <div>
                    <img
                        src={event.posterUrl || event.imageUrl}
                        alt={event.title}
                        className="w-full rounded-2xl shadow-lg object-contain bg-slate-100" // object-contain to show full poster
                    />

                    <div className="mt-8 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                            <span className="mt-2 inline-block rounded-full bg-brand-pink/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-pink">
                                {event.category}
                            </span>
                        </div>

                        <p className="text-lg leading-relaxed text-slate-600">{event.aboutEvent || event.description}</p>

                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="border-t border-slate-100 pt-4">
                                <dt className="text-sm font-medium text-slate-500">Date & Time</dt>
                                <dd className="mt-1 text-base text-slate-900">{event.date} • {event.time}</dd>
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <dt className="text-sm font-medium text-slate-500">Location</dt>
                                <dd className="mt-1 text-base text-slate-900">{event.location}</dd>
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <dt className="text-sm font-medium text-slate-500">Registration Fee</dt>
                                <dd className="mt-1 text-base font-semibold text-brand-blue">{event.registrationFee || "Free"}</dd>
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <dt className="text-sm font-medium text-slate-500">Team Size</dt>
                                <dd className="mt-1 text-base text-slate-900">{event.teamSize || "Individual"}</dd>
                            </div>
                        </dl>

                        {event.prizes && (
                            <div className="rounded-xl bg-amber-50 p-6 border border-amber-100">
                                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-900">
                                    <span className="text-xl">🏆</span> Prizes & Awards
                                </h3>
                                <p className="mt-2 text-amber-800">{event.prizes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registration Form Column */}
                <div className="lg:pl-8">
                    <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                        <h2 className="text-xl font-bold text-slate-900">Register Now</h2>
                        <p className="border-b border-slate-100 pb-4 text-sm text-slate-500">
                            Secure your spot for this event.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">College / Company</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.college}
                                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                        placeholder="Institution"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Year / Designation</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                    placeholder="e.g. 3rd Year / Developer"
                                />
                            </div>

                            {event.teamSize !== "Individual" && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Team Members (Optional)</label>
                                    <textarea
                                        value={formData.teamMembers}
                                        onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                        placeholder="List names of other team members..."
                                        rows={3}
                                    />
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-2 w-full rounded-full bg-gradient-to-r from-brand-orange to-brand-pink py-3 text-sm font-bold text-white shadow-lg shadow-brand-pink/30 hover:shadow-brand-pink/50 disabled:opacity-70"
                            >
                                {isSubmitting ? "Processing..." : "Confirm Registration"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
