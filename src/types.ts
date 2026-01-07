export type UserRole = "participant" | "organizer";

export type EventCategory =
  | "Hackathons"
  | "Art Competitions"
  | "Dance & Music"
  | "Cultural Events"
  | "Tech Events"
  | "Workshops";

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  organizerName: string;
  organizerContact: string;
  description: string;
  imageUrl?: string; // URL to the event image
  posterUrl?: string; // URL to the detailed event poster
  brochureUrl?: string; // URL to the downloadable brochure
  aboutEvent?: string; // Detailed description
  rules?: string; // Event rules and guidelines
  prizes?: string; // Prize pool details
  registrationFee?: string; // "Free" or amount
  teamSize?: string; // e.g. "1-4 members"
  createdByUid: string; // used for organizer dashboard
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  collegeOrCompany: string;
  yearOfStudy: string;
  teamMembers?: string;
}


