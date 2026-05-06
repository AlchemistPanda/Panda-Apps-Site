// ── Resume Builder Types ──────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  photoUrl: string; // base64 or URL
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export interface Skill {
  id: string;
  category: string;
  items: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string;
  startDate: string;
  endDate: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface Volunteer {
  id: string;
  organization: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Reference {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: { id: string; text: string }[];
}

// Which sections are active (shown in the resume)
export interface SectionVisibility {
  summary: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
  certifications: boolean;
  languages: boolean;
  awards: boolean;
  volunteer: boolean;
  interests: boolean;
  references: boolean;
  custom: boolean;
}

// Available templates
export type TemplateName = "modern" | "classic" | "minimal" | "creative";

export interface ResumeData {
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  awards: Award[];
  volunteer: Volunteer[];
  interests: string[];
  references: Reference[];
  referencesNote: string; // e.g. "Available upon request"
  customSections: CustomSection[];
  sections: SectionVisibility;
  template: TemplateName;
  accentColor: string;
}

// ── defaults ──────────────────────────────────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const EMPTY_RESUME: ResumeData = {
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    summary: "",
    photoUrl: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  volunteer: [],
  interests: [],
  references: [],
  referencesNote: "Available upon request",
  customSections: [],
  sections: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: false,
    languages: false,
    awards: false,
    volunteer: false,
    interests: false,
    references: false,
    custom: false,
  },
  template: "modern",
  accentColor: "#2563eb",
};

export const SAMPLE_RESUME: ResumeData = {
  personal: {
    fullName: "Alex Johnson",
    jobTitle: "Senior Software Engineer",
    email: "alex.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    website: "alexjohnson.dev",
    linkedin: "linkedin.com/in/alexjohnson",
    github: "github.com/alexjohnson",
    summary:
      "Results-driven software engineer with 6+ years of experience building scalable web applications. Passionate about clean architecture, developer experience, and shipping products that users love. Led teams of 5–12 engineers and delivered 3 products from concept to 100K+ users.",
    photoUrl: "",
  },
  experience: [
    {
      id: "exp1",
      company: "TechCorp Inc.",
      position: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description: "Lead engineer for the core platform team building next-gen SaaS infrastructure.",
      highlights: [
        "Architected micro-frontend system reducing deploy times by 70%",
        "Led migration from REST to GraphQL serving 2M+ daily requests",
        "Mentored 4 junior engineers, 2 promoted within 12 months",
      ],
    },
    {
      id: "exp2",
      company: "StartupXYZ",
      position: "Full Stack Developer",
      location: "Remote",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      description: "Core member of 8-person engineering team building a B2B analytics platform.",
      highlights: [
        "Built real-time dashboard handling 50K concurrent WebSocket connections",
        "Implemented CI/CD pipeline reducing release cycle from 2 weeks to 2 hours",
        "Designed and shipped OAuth 2.0 integration used by 500+ enterprise clients",
      ],
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2015-08",
      endDate: "2019-05",
      gpa: "3.8",
      description: "Dean's List 2017–2019. Teaching Assistant for Data Structures & Algorithms.",
    },
  ],
  skills: [
    { id: "sk1", category: "Languages", items: ["TypeScript", "Python", "Go", "Rust", "SQL"] },
    { id: "sk2", category: "Frontend", items: ["React", "Next.js", "Tailwind CSS", "Vue.js"] },
    { id: "sk3", category: "Backend & Cloud", items: ["Node.js", "PostgreSQL", "Redis", "AWS", "Docker", "Kubernetes"] },
  ],
  projects: [
    {
      id: "proj1",
      name: "OpenDash",
      description: "Open-source real-time analytics dashboard with plugin architecture. 2.5K GitHub stars.",
      technologies: ["React", "D3.js", "Node.js", "PostgreSQL"],
      url: "github.com/alexjohnson/opendash",
      startDate: "2023-01",
      endDate: "2023-06",
    },
  ],
  certifications: [
    { id: "cert1", name: "AWS Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2023-08", url: "" },
  ],
  languages: [
    { id: "lang1", name: "English", proficiency: "Native" },
    { id: "lang2", name: "Spanish", proficiency: "Intermediate" },
  ],
  awards: [
    { id: "aw1", title: "Hackathon Winner", issuer: "TechCorp Annual Hack Week", date: "2023-11", description: "Built an AI-powered code review bot in 48 hours" },
  ],
  volunteer: [
    { id: "vol1", organization: "Code for Good", role: "Mentor", location: "San Francisco, CA", startDate: "2021-01", endDate: "", current: true, description: "Teach web development to underrepresented communities." },
  ],
  interests: ["Open Source", "Rock Climbing", "Photography", "Chess", "Travel"],
  references: [],
  referencesNote: "Available upon request",
  customSections: [],
  sections: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    languages: true,
    awards: true,
    volunteer: true,
    interests: true,
    references: false,
    custom: false,
  },
  template: "modern",
  accentColor: "#2563eb",
};
