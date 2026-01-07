import { Event } from "./types";

// Default events.
export const mockEvents: Event[] = [
  {
    id: "ev1",
    title: "CodeStorm 2026 Hackathon",
    category: "Hackathons",
    date: "2026-02-10",
    time: "09:00 AM – 09:00 PM",
    location: "Auditorium A, Tech Campus",
    organizerName: "Dev Club",
    organizerContact: "devclub@example.com",
    description:
      "A 12-hour coding marathon where teams build innovative solutions.",
    posterUrl: "/events/hackathon_poster.png",
    brochureUrl: "#",
    prizes: "1st Place: $3000, 2nd Place: $1500, 3rd Place: $500",
    registrationFee: "Free",
    teamSize: "2-4 members",
    imageUrl: "/events/hackathon_poster.png",
    createdByUid: "organizer-demo-1"
  },
  {
    id: "ev2",
    title: "Canvas Chronicles – Art Competition",
    category: "Art Competitions",
    date: "2026-02-15",
    time: "11:00 AM – 02:00 PM",
    location: "Design Studio, Block C",
    organizerName: "Fine Arts Society",
    organizerContact: "arts@example.com",
    description:
      "Showcase your creativity across painting, sketching, and digital illustration.",
    aboutEvent: "Join us for a day of artistic expression. This year's theme is 'FutureScapes'. We provide the canvas, you provide the vision. Categories include Oil Painting, Watercolor, and Digital Art.",
    posterUrl: "/events/art_poster.png",
    brochureUrl: "#",
    prizes: "Best in Show: Art Supply Kit ($200 value)",
    registrationFee: "$10",
    teamSize: "Individual",
    imageUrl: "/events/art_poster.png",
    createdByUid: "organizer-demo-2"
  },
  {
    id: "ev3",
    title: "RhythmVerse – Dance & Music Night",
    category: "Dance & Music",
    date: "2026-02-18",
    time: "06:00 PM – 10:00 PM",
    location: "Open Air Theatre",
    organizerName: "Cultural Committee",
    organizerContact: "culture@example.com",
    description:
      "An evening packed with bands, solo performances, and group dance showcases.",
    aboutEvent: "RhythmVerse is the ultimate cultural extravaganza. From classical melodies to rock anthems, and folk dances to hip-hop face-offs, experience it all under the starry sky.",
    posterUrl: "/events/music_poster.png",
    brochureUrl: "#",
    prizes: "Best Band: Studio Recording Time",
    registrationFee: "$50 per team",
    teamSize: "Unlimited",
    imageUrl: "/events/music_poster.png",
    createdByUid: "organizer-demo-1"
  },
  {
    id: "ev4",
    title: "Fusion Fiesta – Cultural Carnival",
    category: "Cultural Events",
    date: "2026-02-21",
    time: "10:00 AM – 05:00 PM",
    location: "Central Lawn",
    organizerName: "Student Council",
    organizerContact: "council@example.com",
    description:
      "Experience a melting pot of cultures with food stalls, fashion walk, and games.",
    aboutEvent: "Fusion Fiesta celebrates diversity with a carnival atmosphere. Enjoy global cuisines, traditional games, and a vibrant fashion show showcasing ethnic wear.",
    posterUrl: "/events/culture_poster.png",
    brochureUrl: "#",
    prizes: "Trophies and Certificates",
    registrationFee: "Free entry",
    teamSize: "N/A",
    imageUrl: "/events/culture_poster.png",
    createdByUid: "organizer-demo-3"
  },
  {
    id: "ev5",
    title: "NextGen Tech Summit",
    category: "Tech Events",
    date: "2026-02-25",
    time: "10:00 AM – 04:00 PM",
    location: "Innovation Lab",
    organizerName: "IEEE Student Chapter",
    organizerContact: "ieee@example.com",
    description:
      "Talks and panel discussions on AI, Web3, and cloud-native systems.",
    aboutEvent: "A deep dive into the technologies shaping our future. Keynote speakers include industry leaders from Google, Microsoft, and innovative startups.",
    posterUrl: "/events/tech_poster.png",
    brochureUrl: "#",
    prizes: "Networking opportunities",
    registrationFee: "$25",
    teamSize: "Individual",
    imageUrl: "/events/tech_poster.png",
    createdByUid: "organizer-demo-2"
  },
  {
    id: "ev6",
    title: "Design Thinking Workshop",
    category: "Workshops",
    date: "2026-02-28",
    time: "02:00 PM – 06:00 PM",
    location: "Seminar Hall 2",
    organizerName: "Innovation Cell",
    organizerContact: "innovation@example.com",
    description:
      "Hands-on workshop covering empathy mapping, ideation, and rapid prototyping.",
    aboutEvent: "Learn the core principles of design thinking in this interactive workshop. Perfect for aspiring product managers and UX designers.",
    posterUrl: "/events/workshop_poster.png",
    brochureUrl: "#",
    rules: "Bring your own laptop.",
    prizes: "Certification of Completion",
    registrationFee: "$15",
    teamSize: "Individual",
    imageUrl: "/events/workshop_poster.png",
    createdByUid: "organizer-demo-1"
  },
  {
    id: "ev7",
    title: "Inter-College Debate",
    category: "Cultural Events",
    date: "2026-03-05",
    time: "10:00 AM – 01:00 PM",
    location: "Main Auditorium",
    organizerName: "Debating Society",
    organizerContact: "debate@example.com",
    description: "A battle of wits and words on trending global topics.",
    aboutEvent: "Debaters from across the region will compete in this high-stakes tournament. The topic will be released 24 hours prior.",
    posterUrl: "",
    brochureUrl: "#",
    rules: "Teams of 2. Standard Parliamentary Debate format.",
    prizes: "Best Team: $500",
    registrationFee: "Free",
    teamSize: "2 members",
    imageUrl: "",
    createdByUid: "organizer-demo-99" // Different organizer for "All Events" testing
  }
];

export const mockParticipants = [
  {
    id: "p1",
    eventId: "ev1",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "1234567890",
    collegeOrCompany: "Tech University",
    yearOfStudy: "3rd Year"
  },
  {
    id: "p2",
    eventId: "ev1",
    name: "Bob Smith",
    email: "bob@example.com",
    phone: "0987654321",
    collegeOrCompany: "Innovate Inc.",
    yearOfStudy: "Professional"
  },
  {
    id: "p3",
    eventId: "ev2",
    name: "Charlie Davis",
    email: "charlie@example.com",
    phone: "1122334455",
    collegeOrCompany: "Art School",
    yearOfStudy: "2nd Year"
  }
];


