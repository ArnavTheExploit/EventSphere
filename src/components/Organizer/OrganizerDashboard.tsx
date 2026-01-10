import { useMemo, useState, useEffect } from "react";
import { mockEvents, mockParticipants } from "../../mockData";
import type { Event, EventCategory, Registration } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebaseConfig";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function OrganizerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-events" | "all-events">("my-events");
  const [events, setEvents] = useState<Event[]>(mockEvents);

  // Initialize with mock data for visual population, then merge with Firebase updates if any
  const [registrations, setRegistrations] = useState<Registration[]>(mockParticipants as Registration[]);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // File states for upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentUid = user?.uid ?? "organizer-demo-1";

  // Fetch registratios from Firebase
  useEffect(() => {
    if (!user) return;

    // In a real app, you might want to filter server-side
    const unsubscribe = onSnapshot(collection(db, "registrations"), (snapshot) => {
      const fetchedRegs: Registration[] = [];
      snapshot.forEach((doc) => {
        fetchedRegs.push({ id: doc.id, ...doc.data() } as Registration);
      });
      // Combine mock and real for demo purposes
      setRegistrations([...(mockParticipants as Registration[]), ...fetchedRegs]);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch real events from Firebase to merge/replace mock events
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const fetchedEvents: Event[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push(doc.data() as Event);
      });
      // Merge unique events
      setEvents((prev) => {
        const unique = [...prev];
        fetchedEvents.forEach(fe => {
          if (!unique.some(e => e.id === fe.id)) {
            unique.push(fe);
          } else {
            // Update existing if needed
            const idx = unique.findIndex(e => e.id === fe.id);
            unique[idx] = fe;
          }
        });
        return unique;
      });
    });
    return () => unsubscribe();
  }, []);

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
    resetFiles();
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    resetFiles();
  };

  const resetFiles = () => {
    setImageFile(null);
    setPosterFile(null);
    setBrochureFile(null);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!editingEvent) return;
    setIsUploading(true);

    try {
      let updatedEvent = { ...editingEvent };
      const eventId = updatedEvent.id;

      // Upload files if selected
      if (imageFile) {
        const url = await uploadFile(imageFile, `events/${eventId}/image_${imageFile.name}`);
        updatedEvent.imageUrl = url;
      }
      if (posterFile) {
        const url = await uploadFile(posterFile, `events/${eventId}/poster_${posterFile.name}`);
        updatedEvent.posterUrl = url;
      }
      if (brochureFile) {
        const url = await uploadFile(brochureFile, `events/${eventId}/brochure_${brochureFile.name}`);
        updatedEvent.brochureUrl = url;
      }

      // Save to Firebase
      await setDoc(doc(db, "events", eventId), updatedEvent);

      // Update local state immediately for responsiveness
      setEvents((prev) => {
        const exists = prev.some((e) => e.id === eventId);
        if (exists) {
          return prev.map((e) => (e.id === eventId ? updatedEvent : e));
        }
        return [...prev, updatedEvent];
      });

      setEditingEvent(null);
      resetFiles();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    // In real app, delete from Firestore too
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-slate-50">Organizer Dashboard</h1>
          <p className="mt-2 text-black dark:text-slate-400">
            Manage your events, view registrations, and explore events from other organizers.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Sync to Cloud button removed */}
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
            : "text-black hover:text-slate-900"
            }`}
          onClick={() => setActiveTab("my-events")}
        >
          My Events
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "all-events"
            ? "border-b-2 border-brand-blue text-brand-blue"
            : "text-black hover:text-slate-900"
            }`}
          onClick={() => setActiveTab("all-events")}
        >
          All Events
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)]">

        {/* Left Column: Events List */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-black dark:text-slate-100">
            {activeTab === "my-events" ? "Your Managed Events" : "All Scheduled Events"}
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
            {(activeTab === "my-events" ? myEvents : events).map((event) => (
              <article
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-brand-blue/20 to-brand-pink/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

                  <div className="absolute top-4 left-4">
                    <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-dark shadow-sm backdrop-blur-md">
                      {event.category}
                    </span>
                  </div>

                  {event.createdByUid === currentUid && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center rounded-full bg-brand-blue/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                        Owner
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-black line-clamp-2 dark:text-slate-400">
                      {event.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-black dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-brand-blue">📅</span>
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-brand-orange">⏰</span>
                        <span className="font-medium">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 w-full pt-1">
                        <span className="text-brand-pink">📍</span>
                        <span className="font-medium truncate">{event.location}</span>
                      </div>
                    </div>

                    {activeTab === "my-events" ? (
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                        <button
                          onClick={() => openEdit(event)}
                          className="flex items-center justify-center rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="flex items-center justify-center rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      event.createdByUid !== currentUid && (
                        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                          <p className="text-center text-xs font-medium text-slate-400">
                            Organized by <span className="text-black dark:text-slate-300">{event.organizerName}</span>
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </article>
            ))}
            {(activeTab === "my-events" ? myEvents : events).length === 0 && (
              <div className="col-span-full py-12 text-center text-black">
                <p>No events found.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Registrations */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black dark:text-slate-100">Live Registrations</h2>
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
              <span className="text-sm font-medium text-black">Total Participants</span>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <p className="text-sm">No registrations yet.</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white text-black">
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
                          <p className="text-black">{reg.collegeOrCompany}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-black">{event?.title}</p>
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
              <p className="mt-1 text-sm text-black">
                Provide comprehensive details to attract the best participants.
              </p>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-8 py-6">
              <div className="grid gap-6 text-sm sm:grid-cols-2">

                {/* Basic Info */}
                <div className="sm:col-span-2">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-black">Basic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-black">Event Title</label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => updateEditingField("title", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                        placeholder="e.g. CodeStorm 2026"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Category</label>
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
                      <label className="mb-1 block font-semibold text-black">Registration Fee</label>
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
                  <h3 className="mb-4 mt-2 text-xs font-bold uppercase tracking-wider text-black">Logistics</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-semibold text-black">Date</label>
                      <input
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) => updateEditingField("date", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Time</label>
                      <input
                        type="text"
                        value={editingEvent.time}
                        onChange={(e) => updateEditingField("time", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="10:00 AM - 4:00 PM"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-black">Location</label>
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
                  <h3 className="mb-4 mt-2 text-xs font-bold uppercase tracking-wider text-black">Content & Rules</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block font-semibold text-black">Short Description</label>
                      <input
                        type="text"
                        value={editingEvent.description}
                        onChange={(e) => updateEditingField("description", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Brief summary for list view"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Detailed About Event</label>
                      <textarea
                        value={editingEvent.aboutEvent || ""}
                        onChange={(e) => updateEditingField("aboutEvent", e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Full event details, agenda, etc."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Rules & Guidelines</label>
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
                  <h3 className="mb-4 mt-2 text-xs font-bold uppercase tracking-wider text-black">Prizes & Media</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-black">Prizes</label>
                      <input
                        type="text"
                        value={editingEvent.prizes || ""}
                        onChange={(e) => updateEditingField("prizes", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="e.g. 1st Place $1000"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Poster Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPosterFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                      {editingEvent.posterUrl && !posterFile && <span className="text-xs text-green-600">Current file exists</span>}
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Brochure (PDF/Image)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setBrochureFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                      {editingEvent.brochureUrl && !brochureFile && <span className="text-xs text-green-600">Current file exists</span>}
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Title Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                      {editingEvent.imageUrl && !imageFile && <span className="text-xs text-green-600">Current file exists</span>}
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-black">Team Size</label>
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
                disabled={isUploading}
                className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUploading}
                className="rounded-full bg-slate-900 px-8 py-2.5 font-bold text-white shadow-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Uploading...
                  </>
                ) : (
                  "Save Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
