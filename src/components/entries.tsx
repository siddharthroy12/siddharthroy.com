import { AnimatePresence, motion } from "motion/react";
import { memo, type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ArrowUpRightIcon,
  ChevronsUpDownIcon,
  CodeIcon,
  GraduationCapIcon,
  LinkIcon,
  PencilIcon,
  RocketIcon,
  SolarSystemIcon,
} from "@/components/icons";
import {
  type EducationItem,
  ENTITY_LINKS,
  type Project,
  type ProjectIcon,
  type WorkItem,
} from "@/utils/constants";

const ENTRY_ANIMATION = {
  initial: { opacity: 0, y: 5, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1, ease: [0.2, 0.65, 0.3, 0.9] },
} as const;

type HoverHandler = (id: string, previewUrl: string, rect: DOMRect) => void;

const PROJECT_ICONS: Record<ProjectIcon, ReactNode> = {
  "solar-system": <SolarSystemIcon />,
  rocket: <RocketIcon />,
  // hiragana "a"; a real glyph reads better than hand-drawn strokes for kana
  kanji: <span className="text-base leading-none">あ</span>,
  pencil: <PencilIcon />,
};

function Badge({
  label,
  className,
  icon,
}: {
  label: string;
  className: string;
  icon?: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-md border border-border bg-white/[0.04] uppercase text-zinc-300 ${className}`}
    >
      {icon ?? label.charAt(0)}
    </span>
  );
}

const ENTITY_PATTERN = new RegExp(
  `(${Object.keys(ENTITY_LINKS)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
);

const INLINE_LINK_CLASS =
  "underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-zinc-200 hover:decoration-zinc-300";

/** Wraps any known entity name in the text with a link to its site. */
function linkify(text: string): ReactNode[] {
  return text.split(ENTITY_PATTERN).map((part, i) => {
    const href = ENTITY_LINKS[part];
    if (!href) return part;
    return (
      <a
        // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and static
        key={i}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={INLINE_LINK_CLASS}
      >
        {part}
      </a>
    );
  });
}

function TagList({
  tags,
  className,
}: {
  tags?: readonly string[];
  className?: string;
}) {
  if (!tags?.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {tags.map((tag) => {
        const href = ENTITY_LINKS[tag];
        return (
          <li
            key={tag}
            className="rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 text-[11px] leading-4 text-zinc-400"
          >
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-zinc-100"
              >
                {tag}
              </a>
            ) : (
              tag
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** "2y 6m" style span from a "YYYY-MM" start to now, or null if under a month. */
function formatDuration(since: string) {
  const [year, month] = since.split("-").map(Number);
  const now = new Date();
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (months < 1) return null;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years}y` : "", rest ? `${rest}m` : ""]
    .filter(Boolean)
    .join(" ");
}

type WorkEntryProps = {
  item: WorkItem;
  delay: number;
  previewUrl: string;
  onHover: HoverHandler;
};

export const WorkEntry = memo(function WorkEntry({
  item,
  delay,
  previewUrl,
  onHover,
}: WorkEntryProps) {
  const [duration, setDuration] = useState<string | null>(null);
  useEffect(() => {
    setDuration(item.since ? formatDuration(item.since) : null);
  }, [item.since]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      onHover(
        item.company,
        previewUrl,
        e.currentTarget.getBoundingClientRect(),
      );
    },
    [onHover, item.company, previewUrl],
  );

  return (
    <motion.article
      className="group border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.04]"
      initial={ENTRY_ANIMATION.initial}
      animate={ENTRY_ANIMATION.animate}
      transition={{ ...ENTRY_ANIMATION.transition, delay }}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-center justify-between gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2.5"
        >
          <Badge label={item.company} className="size-6 text-[11px]" />
          <h3 className="truncate text-xl font-medium tracking-tight">
            {item.company}
          </h3>
        </a>
        <ArrowUpRightIcon className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300" />
      </div>

      <div className="mt-3 grid grid-cols-[1.5rem_1fr] gap-x-3">
        <div className="relative">
          <span className="grid size-6 place-items-center rounded-md border border-border bg-white/[0.04] text-zinc-400">
            <CodeIcon />
          </span>
          {item.tags?.length ? (
            <span
              aria-hidden="true"
              className="absolute top-8 bottom-0 left-1/2 w-px bg-border"
            />
          ) : null}
        </div>
        <div>
          <h4 className="text-base leading-6 font-medium">{item.role}</h4>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            <span>{item.date}</span>
            {duration ? (
              <>
                <span aria-hidden="true" className="h-3 w-px bg-border" />
                <span>{duration}</span>
              </>
            ) : null}
          </p>
          {item.bullets?.length ? (
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-400">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.6em] size-1 shrink-0 rounded-full bg-zinc-600"
                  />
                  <span>{linkify(bullet)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {item.about}
            </p>
          )}
        </div>

        {item.tags?.length ? (
          <>
            {/* elbow: continues the rail down, then turns right into the first row of tags */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 h-[21px] w-[calc(50%+0.75rem)] rounded-bl-md border-b border-l border-border"
              />
            </div>
            <TagList tags={item.tags} className="pt-2.5" />
          </>
        ) : null}
      </div>
      <img src={previewUrl} alt="" className="hidden" fetchPriority="low" />
    </motion.article>
  );
});

type ProjectEntryProps = {
  project: Project;
  delay: number;
  previewUrl: string;
  defaultOpen?: boolean;
  onHover: HoverHandler;
};

export const ProjectEntry = memo(function ProjectEntry({
  project,
  delay,
  previewUrl,
  defaultOpen = false,
  onHover,
}: ProjectEntryProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      onHover(
        project.name,
        previewUrl,
        e.currentTarget.getBoundingClientRect(),
      );
    },
    [onHover, project.name, previewUrl],
  );

  return (
    <motion.div
      className="border-b border-line last:border-b-0"
      initial={ENTRY_ANIMATION.initial}
      animate={ENTRY_ANIMATION.animate}
      transition={{ ...ENTRY_ANIMATION.transition, delay }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover only positions the preview; every action inside is a real link or button */}
      <div
        className={`group flex items-stretch transition-colors hover:bg-white/[0.04] ${
          open ? "border-b border-line" : ""
        }`}
        onMouseEnter={handleMouseEnter}
      >
        <div className="grid w-14 shrink-0 place-items-center border-r border-line">
          <Badge
            label={project.name}
            className="size-8 text-xs"
            icon={project.icon ? PROJECT_ICONS[project.icon] : undefined}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center px-3 py-4">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-base leading-snug font-medium"
          >
            {project.name}
          </a>
        </div>
        <div className="flex items-center gap-0.5 pr-3 text-zinc-500">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`open ${project.name}`}
            className="grid size-7 place-items-center rounded-md transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <LinkIcon />
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "hide" : "show"} details for ${project.name}`}
            onClick={() => setOpen((value) => !value)}
            className="grid size-7 cursor-pointer place-items-center rounded-md transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <ChevronsUpDownIcon />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.65, 0.3, 0.9] }}
          >
            <div className="pt-3 pr-4 pb-3 pl-[4.75rem]">
              <p className="text-sm leading-relaxed text-zinc-400">
                {project.about}
              </p>
              <TagList tags={project.tags} className="mt-2.5" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <img src={previewUrl} alt="" className="hidden" fetchPriority="low" />
    </motion.div>
  );
});

type EducationEntryProps = {
  item: EducationItem;
  delay: number;
};

export const EducationEntry = memo(function EducationEntry({
  item,
  delay,
}: EducationEntryProps) {
  return (
    <motion.div
      className="border-b border-line last:border-b-0"
      initial={ENTRY_ANIMATION.initial}
      animate={ENTRY_ANIMATION.animate}
      transition={{ ...ENTRY_ANIMATION.transition, delay }}
    >
      <div className="flex items-stretch transition-colors hover:bg-white/[0.04]">
        <div className="grid w-14 shrink-0 place-items-center border-r border-line">
          <Badge
            label={item.school}
            className="size-8 text-xs"
            icon={<GraduationCapIcon />}
          />
        </div>
        <div className="min-w-0 flex-1 px-3 py-3">
          <h3 className="text-base leading-snug font-medium">{item.school}</h3>
          <p className="mt-0.5 text-sm text-zinc-400">{item.degree}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            <span>{item.date}</span>
            <span aria-hidden="true" className="h-3 w-px bg-border" />
            <span>{item.location}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
});
