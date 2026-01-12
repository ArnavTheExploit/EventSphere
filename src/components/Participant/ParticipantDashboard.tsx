import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockEvents } from "../../mockData";
import type { Event, EventCategory } from "../../types";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const categories: EventCategory[] = [
  "Hackathons",
  "Art Competitions",
  "Dance & Music",
  "Cultural Events",
  "Tech Events",
  "Workshops"
];

export function ParticipantDashboard({ limit }: { limit?: number }) {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "All">("All");
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const navigate = useNavigate();

  // Fetch real events from Firebase to merge with mock events
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const fetchedEvents: Event[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push(doc.data() as Event);
      });
      // Merge unique events (Firebase events override mock events with same id)
      setEvents(() => {
        const unique = [...mockEvents];
        fetchedEvents.forEach(fe => {
          const existingIdx = unique.findIndex(e => e.id === fe.id);
          if (existingIdx === -1) {
            unique.push(fe);
          } else {
            unique[existingIdx] = fe;
          }
        });
        return unique;
      });
    });
    return () => unsubscribe();
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (activeCategory !== "All") {
      filtered = events.filter((e) => e.category === activeCategory);
    }
    return limit ? filtered.slice(0, limit) : filtered;
  }, [activeCategory, limit, events]);

  const handleRegisterClick = (eventId: string) => {
    navigate(`/register/${eventId}`);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Explore Events</h1>
            <p className="mt-2 text-slate-600">
              Browse upcoming events and register to secure your spot.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activeCategory === "All"
              ? "border-brand-blue bg-brand-blue text-white"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activeCategory === cat
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <article
            key={event.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold backdrop-blur text-brand-dark">
                {event.category}
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{event.description}</p>

              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-slate-500">
                <div>
                  <dt className="font-semibold text-slate-900">Date</dt>
                  <dd>{event.date}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Location</dt>
                  <dd className="truncate">{event.location}</dd>
                </div>
              </dl>

              <div className="mt-6 mt-auto">
                <button
                  type="button"
                  onClick={() => handleRegisterClick(event.id)}
                  className="w-full rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Details & Register
                </button>
              </div>
            </div>
          </article>
        ))}
        {filteredEvents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No events found in this category.
          </div>
        )}
      </div>
    </div>
  );
}

