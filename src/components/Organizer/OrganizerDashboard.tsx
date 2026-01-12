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

      const hasFiles = imageFile || posterFile || brochureFile;

      // If no files, save immediately for instant feedback
      if (!hasFiles) {
        await setDoc(doc(db, "events", eventId), updatedEvent);
      } else {
        // Upload all files in parallel for faster performance
        const uploadPromises: Promise<{ type: string; url: string }>[] = [];

        if (imageFile) {
          uploadPromises.push(
            uploadFile(imageFile, `events/${eventId}/image_${imageFile.name}`)
              .then(url => ({ type: 'image', url }))
          );
        }
        if (posterFile) {
          uploadPromises.push(
            uploadFile(posterFile, `events/${eventId}/poster_${posterFile.name}`)
              .then(url => ({ type: 'poster', url }))
          );
        }
        if (brochureFile) {
          uploadPromises.push(
            uploadFile(brochureFile, `events/${eventId}/brochure_${brochureFile.name}`)
              .then(url => ({ type: 'brochure', url }))
          );
        }

        // Wait for all uploads to complete in parallel
        const uploadResults = await Promise.all(uploadPromises);

        // Apply the URLs to the event
        uploadResults.forEach(result => {
          if (result.type === 'image') updatedEvent.imageUrl = result.url;
          if (result.type === 'poster') updatedEvent.posterUrl = result.url;
          if (result.type === 'brochure') updatedEvent.brochureUrl = result.url;
        });

        // Save to Firebase with file URLs
        await setDoc(doc(db, "events", eventId), updatedEvent);
      }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md overflow-y-auto">
          <div className="my-8 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-8 py-8">
              <button
                onClick={() => setEditingEvent(null)}
                disabled={isUploading}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {mockEvents.some((e) => e.id === editingEvent.id) ? "Edit Event" : "Create New Event"}
                  </h2>
                  <p className="mt-1 text-white/80">
                    Fill in the details to create an amazing event
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto px-8 py-8">
              <div className="space-y-8">

                {/* Section 1: Event Details */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Event Details</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Event Title *</label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => updateEditingField("title", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="e.g. CodeStorm 2026"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Category *</label>
                      <select
                        value={editingEvent.category}
                        onChange={(e) => updateEditingField("category", e.target.value as EventCategory)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Registration Fee</label>
                      <input
                        type="text"
                        value={editingEvent.registrationFee || ""}
                        onChange={(e) => updateEditingField("registrationFee", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="Free or ₹500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Team Size</label>
                      <input
                        type="text"
                        value={editingEvent.teamSize || ""}
                        onChange={(e) => updateEditingField("teamSize", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="Individual or 2-4 members"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Prizes</label>
                      <input
                        type="text"
                        value={editingEvent.prizes || ""}
                        onChange={(e) => updateEditingField("prizes", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="1st: ₹10,000, 2nd: ₹5,000"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Date, Time & Location */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Date, Time & Location</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Date *</label>
                      <input
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) => updateEditingField("date", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 transition focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Time *</label>
                      <input
                        type="text"
                        value={editingEvent.time}
                        onChange={(e) => updateEditingField("time", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
                        placeholder="10:00 AM - 6:00 PM"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Location *</label>
                      <input
                        type="text"
                        value={editingEvent.location}
                        onChange={(e) => updateEditingField("location", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
                        placeholder="Main Auditorium, Building A"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Description & Rules */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                      <svg className="h-5 w-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Description & Rules</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Short Description *</label>
                      <input
                        type="text"
                        value={editingEvent.description}
                        onChange={(e) => updateEditingField("description", e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10"
                        placeholder="A one-line summary of your event"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">About Event</label>
                      <textarea
                        value={editingEvent.aboutEvent || ""}
                        onChange={(e) => updateEditingField("aboutEvent", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10"
                        placeholder="Detailed description, agenda, what participants will learn..."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Rules & Guidelines</label>
                      <textarea
                        value={editingEvent.rules || ""}
                        onChange={(e) => updateEditingField("rules", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10"
                        placeholder="Any specific rules, eligibility criteria, or code of conduct..."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Media Uploads */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Media & Attachments</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    {/* Event Image */}
                    <div className="group relative">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Event Image</label>
                      <div className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-indigo-100">
                            <svg className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {imageFile ? (
                            <span className="text-xs font-medium text-indigo-600">{imageFile.name}</span>
                          ) : editingEvent.imageUrl ? (
                            <span className="text-xs font-medium text-green-600">✓ Image uploaded</span>
                          ) : (
                            <span className="text-xs text-slate-500">Click to upload</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Poster */}
                    <div className="group relative">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Poster</label>
                      <div className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-purple-400 hover:bg-purple-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPosterFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-purple-100">
                            <svg className="h-5 w-5 text-slate-400 group-hover:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          {posterFile ? (
                            <span className="text-xs font-medium text-purple-600">{posterFile.name}</span>
                          ) : editingEvent.posterUrl ? (
                            <span className="text-xs font-medium text-green-600">✓ Poster uploaded</span>
                          ) : (
                            <span className="text-xs text-slate-500">Click to upload</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Brochure */}
                    <div className="group relative">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Brochure</label>
                      <div className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-pink-400 hover:bg-pink-50/50">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setBrochureFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-pink-100">
                            <svg className="h-5 w-5 text-slate-400 group-hover:text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {brochureFile ? (
                            <span className="text-xs font-medium text-pink-600">{brochureFile.name}</span>
                          ) : editingEvent.brochureUrl ? (
                            <span className="text-xs font-medium text-green-600">✓ Brochure uploaded</span>
                          ) : (
                            <span className="text-xs text-slate-500">PDF or Image</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-8 py-5">
              <p className="text-sm text-slate-500">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  disabled={isUploading}
                  className="rounded-xl border-2 border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
