export type WorkItem = {
  company: string;
  slug: string;
  role: string;
  date: string;
  about: string;
  url: string;
  image?: string;
  noPreview?: boolean;
};

export type Project = {
  name: string;
  slug: string;
  role: string;
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
    about: "frontend + backend development for Xquizit and FinXray.",
    url: "https://algo-one.com",
  },
  {
    company: "Everlytics",
    slug: "everlytics",
    role: "frontend developer intern",
    date: "oct 2022 — 2024",
    about:
      "built dashboards for internal and client projects with end-to-end automated testing.",
    url: "https://everlytics.io",
  },
];

export const PROJECTS: readonly Project[] = [
  {
    name: "Noa",
    slug: "noa",
    role: "creator",
    about: "a lightweight scripting language written in Rust",
    url: "https://github.com/siddharthroy12/noa",
  },
  {
    name: "Gravity sandbox",
    slug: "gravity-sandbox",
    role: "creator",
    about: "a 2D Newtonian gravity simulator",
    url: "https://github.com/siddharthroy12/gravitysandbox",
  },
  {
    name: "Rockets",
    slug: "rockets",
    role: "creator",
    about: "dodge rockets in a retro style",
    url: "https://www.lexaloffle.com/bbs/?pid=111184",
  },
  {
    name: "Nihongo Buddy",
    slug: "nihongo-buddy",
    role: "creator",
    about: "a Japanese reading assistant that translates and summarizes text",
    url: "https://github.com/siddharthroy12/nihongobuddy",
  },
  {
    name: "Graphite",
    slug: "graphite",
    role: "creator",
    about: "a local-only, Notion-style workspace for the desktop",
    url: "https://github.com/siddharthroy12/graphite",
  },
];
