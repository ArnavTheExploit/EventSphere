export function Testimonials() {
    const reviews = [
        {
            id: 1,
            name: "Sarah Jenkins",
            role: "Participant",
            quote: "EventSphere made finding and registering for the annual Tech Summit seamless. The experience was effortless!",
            avatar: "SJ"
        },
        {
            id: 2,
            name: "David Chen",
            role: "Organizer",
            quote: "Managing registrants for our Hackathon used to be a chaos of spreadsheets. This platform streamlined everything.",
            avatar: "DC"
        },
        {
            id: 3,
            name: "Priya Patel",
            role: "Cultural Secretary",
            quote: "We saw a 40% increase in participation for RhythmVerse thanks to the easy discovery features. Highly recommended.",
            avatar: "PP"
        }
    ];

    return (
        <section className="bg-slate-50 py-16">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold text-slate-900">Trusted by Campus Leaders</h2>
                    <p className="mt-4 text-slate-600">
                        Hear from students and organizers who are transforming their event experiences.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue">
                                    {review.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{review.name}</p>
                                    <p className="text-xs text-slate-500">{review.role}</p>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600">"{review.quote}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
