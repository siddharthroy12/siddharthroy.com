export type WorkItem = {
  company: string;
  slug: string;
  role: string;
  date: string;
  /** Start month as "YYYY-MM"; when set, a live duration is shown. */
  since?: string;
  /** Bullet points shown under the role; falls back to `about` when absent. */
  bullets?: readonly string[];
  tags?: readonly string[];
  about: string;
  url: string;
  image?: string;
  noPreview?: boolean;
};

export type ProjectIcon = "solar-system" | "rocket" | "kanji" | "pencil";

export type Project = {
  name: string;
  slug: string;
  role: string;
  /** Glyph shown in the project's badge; falls back to the name's first letter. */
  icon?: ProjectIcon;
  tags?: readonly string[];
  about: string;
  url: string;
  image?: string;
  noPreview?: boolean;
};

export type Social = {
  label: string;
  href: string;
};

export const SOCIALS: readonly Social[] = [
  { label: "GitHub", href: "https://github.com/siddharthroy12" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/reactoverflow/" },
  { label: "X", href: "https://x.com/cybrchad" },
];

export const WORK_ITEMS: readonly WorkItem[] = [
  {
    company: "Algo One",
    slug: "algo-one",
    role: "frontend & full-stack engineer",
    date: "apr 2024 — present",
    since: "2024-04",
    bullets: [
      "bootstrapped Xquizit, a proctored test taking platform",
      "built frontend for FinXray",
      "built LLM based features",
      "worked on frontends for financial platforms",
    ],
    tags: ["Xquizit", "FinXray"],
    about: "frontend + backend development for Xquizit and FinXray.",
    url: "https://algo-one.com",
  },
  {
    company: "Everlytics",
    slug: "everlytics",
    role: "frontend developer intern",
    date: "oct 2022 — 2024",
    bullets: [
      "built dashboards for internal and client projects",
      "end-to-end automated testing",
    ],
    tags: ["dashboards", "e2e testing"],
    about:
      "built dashboards for internal and client projects with end-to-end automated testing.",
    url: "https://everlytics.io",
  },
];

export const PROJECTS: readonly Project[] = [
  {
    name: "Gravity sandbox",
    slug: "gravity-sandbox",
    role: "creator",
    icon: "solar-system",
    tags: ["C++", "CMake", "Raylib"],
    about: "a 2D Newtonian gravity simulator",
    url: "https://github.com/siddharthroy12/gravitysandbox",
  },
  {
    name: "Rockets",
    slug: "rockets",
    role: "creator",
    icon: "rocket",
    tags: ["Lua", "PICO-8"],
    about: "dodge rockets in a retro style",
    url: "https://www.lexaloffle.com/bbs/?pid=111184",
  },
  {
    name: "Nihongo Buddy",
    slug: "nihongo-buddy",
    role: "creator",
    icon: "kanji",
    tags: ["Electron", "TypeScript", "React"],
    about: "a Japanese reading assistant that translates and summarizes text",
    url: "https://github.com/siddharthroy12/nihongobuddy",
  },
  {
    name: "Graphite",
    slug: "graphite",
    role: "creator",
    icon: "pencil",
    tags: ["Electron", "TypeScript", "React"],
    about: "a local-only, Notion-style workspace for the desktop",
    url: "https://github.com/siddharthroy12/graphite",
  },
];

/** Where the local-time readout in the header points to. */
export const LOCATION = {
  label: "india",
  timeZone: "Asia/Kolkata",
} as const;

/** Short status shown next to the clock. */
export const STATUS = "building at Algo One";

/**
 * Names that become links wherever they appear in work bullets or tag chips.
 * Matching is exact and case-sensitive.
 */
export const ENTITY_LINKS: Readonly<Record<string, string>> = {
  Xquizit: "https://xquizit.in/",
  FinXray: "https://gquants.com/",
};
