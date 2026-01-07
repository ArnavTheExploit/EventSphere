import { useMemo, useState, useEffect } from "react";
import { mockEvents } from "../../mockData";
import type { Event, EventCategory, Registration } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";

export function OrganizerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-events" | "all-events">("my-events");
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentUid = user?.uid ?? "organizer-demo-1";

  // Fetch registrations from Firebase
  useEffect(() => {
    if (!user) return;

    // In a real app, you might want to filter server-side
    const unsubscribe = onSnapshot(collection(db, "registrations"), (snapshot) => {
      const fetchedRegs: Registration[] = [];
      snapshot.forEach((doc) => {
        fetchedRegs.push({ id: doc.id, ...doc.data() } as Registration);
      });
      setRegistrations(fetchedRegs);
    });

    return () => unsubscribe();
  }, [user]);

  const myEvents = useMemo(
    () => events.filter((e) => e.createdByUid === currentUid),
    [events, currentUid]
  );

  const otherEvents = useMemo(
    () => events.filter((e) => e.createdByUid !== currentUid),
    [events, currentUid]
  );

  const myRegistrations = useMemo(() => {
    return registrations
      .map((reg) => ({
        reg,
        event: events.find((e) => e.id === reg.eventId)
      }))
      .filter((pair) => pair.event && pair.event.createdByUid === currentUid);
  }, [events, registrations, currentUid]);

  const blankEvent: Event = {
    id: `ev-${Date.now()}`,
    title: "",
    category: "Tech Events",
    date: "",
    time: "",
    location: "",
    organizerName: user?.displayName || "You",
    organizerContact: user?.email || "you@example.com",
    description: "",
    aboutEvent: "",
    rules: "",
    posterUrl: "",
    brochureUrl: "",
    prizes: "",
    registrationFee: "",
    teamSize: "Individual",
    createdByUid: currentUid
  };

  const openCreate = () => {
    setEditingEvent(blankEvent);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
  };

  const handleSave = () => {
    if (!editingEvent) return;
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === editingEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === editingEvent.id ? editingEvent : e));
      }
      return [...prev, editingEvent];
    });
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEditingField = (field: keyof Event, value: string | EventCategory) => {
    setEditingEvent((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const downloadParticipants = () => {
    if (myRegistrations.length === 0) {
      alert("No participants to download.");
      return;
    }

    const headers = ["Name", "Email", "Phone", "College/Company", "Year", "Event Title", "Team Members"];
    const rows = myRegistrations.map(({ reg, event }) => [
      reg.name,
      reg.email,
      reg.phone,
      reg.collegeOrCompany,
      reg.yearOfStudy,
      event?.title || "Unknown",
      reg.teamMembers || "N/A"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "participants_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadToFirebase = async () => {
    try {
      setUploading(true);
      const eventsCol = collection(db, "events");
      for (const event of events) {
        await setDoc(doc(eventsCol, event.id), event);
      }
      alert("Events uploaded to Firebase successfully!");
    } catch (error) {
      console.error("Error uploading events:", error);
      alert("Failed to upload events. See console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">Organizer Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your events, view registrations, and explore events from other organizers.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={uploadToFirebase}
            disabled={uploading}
            className="inline-flex items-center justify-center rounded-full border border-brand-blue/30 bg-brand-blue/5 px-4 py-2 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue/10 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Sync to Cloud"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-orange to-brand-pink px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-pink/40 transition hover:shadow-brand-blue/40"
          >
            + Create New Event
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "my-events"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-slate-500 hover:text-slate-700"
            }`}
          onClick={() => setActiveTab("my-events")}
        >
          My Events
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "all-events"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-slate-500 hover:text-slate-700"
            }`}
          onClick={() => setActiveTab("all-events")}
        >
          All Events
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)]">

        {/* Left Column: Events List */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {activeTab === "my-events" ? "Your Managed Events" : "All Scheduled Events"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {(activeTab === "my-events" ? myEvents : events).map((event) => (
              <article
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
              >
                {event.imageUrl ? (
                  <div className="h-40 w-full overflow-hidden bg-slate-100">
                    <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-gradient-to-br from-slate-100 to-slate-200" />
                )}

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-brand-pink/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-pink">
                      {event.category}
                    </span>
                    {event.createdByUid === currentUid && (
                      <span className="text-[10px] font-medium text-slate-400">Owner</span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{event.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{event.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="block font-semibold text-slate-900">Date</span>
                      {event.date}
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900">Time</span>
                      {event.time}
                    </div>
                  </div>

                  {activeTab === "my-events" && (
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => openEdit(event)}
                        className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {activeTab === "all-events" && event.createdByUid !== currentUid && (
                    <div className="mt-4 border-t border-slate-100 pt-3 text-center">
                      <span className="text-xs text-slate-400">Organized by {event.organizerName}</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {(activeTab === "my-events" ? myEvents : events).length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <p>No events found.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Registrations (Only relevant for My Events view mostly, but good to keep visible) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Live Registrations</h2>
            <button
              onClick={downloadParticipants}
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Download CSV
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <span className="text-sm font-bold">{myRegistrations.length}</span>
              </div>
              <span className="text-sm font-medium text-slate-600">Total Participants</span>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <p className="text-sm">No registrations yet.</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Participant</th>
                      <th className="pb-2 font-medium">Event</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRegistrations.map(({ reg, event }) => (
                      <tr key={reg.id}>
                        <td className="py-3">
                          <p className="font-semibold text-slate-900">{reg.name}</p>
                          <p className="text-slate-500">{reg.collegeOrCompany}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-slate-700">{event?.title}</p>
                        </td>
                        <td className="py-3">
                          <span className="inline-block rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-8 py-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {mockEvents.some((e) => e.id === editingEvent.id) ? "Edit Event Details" : "Create New Event"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Provide comprehensive details to attract the best participants.
              </p>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-8 py-6">
              <div className="grid gap-6 text-sm sm:grid-cols-2">

                {/* Basic Info */}
                <div className="sm:col-span-2">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Basic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-slate-700">Event Title</label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => updateEditingField("title", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                        placeholder="e.g. CodeStorm 2026"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Category</label>
                      <select
                        value={editingEvent.category}
                        onChange={(e) => updateEditingField("category", e.target.value as EventCategory)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option>Hackathons</option>
                        <option>Art Competitions</option>
                        <option>Dance &amp; Music</option>
                        <option>Cultural Events</option>
                        <option>Tech Events</option>
                        <option>Workshops</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Registration Fee</label>
                      <input
                        type="text"
                        value={editingEvent.registrationFee || ""}
                        onChange={(e) => updateEditingField("registrationFee", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="e.g. Free or $10"
                      />
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="sm:col-span-2">
                  <h3 className="mb-4 mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Logistics</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Date</label>
                      <input
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) => updateEditingField("date", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Time</label>
                      <input
                        type="text"
                        value={editingEvent.time}
                        onChange={(e) => updateEditingField("time", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="10:00 AM - 4:00 PM"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-slate-700">Location</label>
                      <input
                        type="text"
                        value={editingEvent.location}
                        onChange={(e) => updateEditingField("location", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Full address or venue name"
                      />
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="sm:col-span-2">
                  <h3 className="mb-4 mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Content & Rules</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Short Description</label>
                      <input
                        type="text"
                        value={editingEvent.description}
                        onChange={(e) => updateEditingField("description", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Brief summary for list view"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Detailed About Event</label>
                      <textarea
                        value={editingEvent.aboutEvent || ""}
                        onChange={(e) => updateEditingField("aboutEvent", e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Full event details, agenda, etc."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Rules & Guidelines</label>
                      <textarea
                        value={editingEvent.rules || ""}
                        onChange={(e) => updateEditingField("rules", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="List any rules, prerequisites, or code of conduct."
                      />
                    </div>
                  </div>
                </div>

                {/* Prizes & Media */}
                <div className="sm:col-span-2">
                  <h3 className="mb-4 mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Prizes & Media</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-slate-700">Prizes</label>
                      <input
                        type="text"
                        value={editingEvent.prizes || ""}
                        onChange={(e) => updateEditingField("prizes", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="e.g. 1st Place $1000"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Poster URL</label>
                      <input
                        type="text"
                        value={editingEvent.posterUrl || ""}
                        onChange={(e) => updateEditingField("posterUrl", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Brochure URL</label>
                      <input
                        type="text"
                        value={editingEvent.brochureUrl || ""}
                        onChange={(e) => updateEditingField("brochureUrl", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Title Image URL</label>
                      <input
                        type="text"
                        value={editingEvent.imageUrl || ""}
                        onChange={(e) => updateEditingField("imageUrl", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Team Size</label>
                      <input
                        type="text"
                        value={editingEvent.teamSize || ""}
                        onChange={(e) => updateEditingField("teamSize", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-8 py-6">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-slate-900 px-8 py-2.5 font-bold text-white shadow-xl hover:bg-slate-800"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
