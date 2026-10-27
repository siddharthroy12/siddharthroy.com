import { useCallback, useState } from "react";
import AnimatedText from "@/components/animated-text";
import { EducationEntry, ProjectEntry, WorkEntry } from "@/components/entries";
import GutterNote from "@/components/gutter-note";
import HoverPreview from "@/components/hover-preview";
import { EDUCATION, PROJECTS, WORK_ITEMS } from "@/utils/constants";
import getPreviewUrl from "@/utils/get-preview-url";

type HoverState = {
  id: string;
  rect: DOMRect;
  previewUrl: string;
} | null;

// precompute preview urls since items are static
const WORK_PREVIEW_URLS = new Map(
  WORK_ITEMS.map((item) => [item.slug, getPreviewUrl(item) ?? ""]),
);
const PROJECT_PREVIEW_URLS = new Map(
  PROJECTS.map((item) => [item.slug, getPreviewUrl(item) ?? ""]),
);

export default function Home() {
  const [hoveredWork, setHoveredWork] = useState<HoverState>(null);
  const [hoveredProject, setHoveredProject] = useState<HoverState>(null);

  const handleWorkHover = useCallback(
    (id: string, previewUrl: string, rect: DOMRect) => {
      setHoveredWork({ id, rect, previewUrl });
    },
    [],
  );

  const handleProjectHover = useCallback(
    (id: string, previewUrl: string, rect: DOMRect) => {
      setHoveredProject({ id, rect, previewUrl });
    },
    [],
  );

  const clearWorkHover = useCallback(() => setHoveredWork(null), []);
  const clearProjectHover = useCallback(() => setHoveredProject(null), []);

  return (
    <>
      <section className="screen-line-top screen-line-bottom">
        <header className="screen-line-bottom px-4 py-2">
          <AnimatedText
            className="text-2xl font-medium tracking-tight"
            element="h2"
            text="work"
            artificialDelay={0.3}
          />
        </header>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: hover only drives the preview image; entries contain their own links */}
        <div onMouseLeave={clearWorkHover}>
          {WORK_ITEMS.map((item, i) => (
            <WorkEntry
              key={item.slug}
              item={item}
              delay={0.5 + i * 0.15}
              previewUrl={WORK_PREVIEW_URLS.get(item.slug) ?? ""}
              onHover={handleWorkHover}
            />
          ))}
        </div>
      </section>

      <div className="stripe-divider" />

      <section className="screen-line-top screen-line-bottom">
        <header className="screen-line-bottom px-4 py-2">
          <AnimatedText
            className="text-2xl font-medium tracking-tight"
            element="h2"
            text="education"
            artificialDelay={0.3}
          />
        </header>

        <div>
          {EDUCATION.map((item, i) => (
            <EducationEntry
              key={item.slug}
              item={item}
              delay={0.5 + i * 0.15}
            />
          ))}
        </div>
      </section>

      <div className="stripe-divider" />

      <section className="screen-line-top screen-line-bottom screen-line-bottom-border">
        <header className="screen-line-bottom flex items-baseline gap-1.5 px-4 py-2">
          <AnimatedText
            className="text-2xl font-medium tracking-tight"
            element="h2"
            text="projects"
            artificialDelay={0.3}
          />
          <span className="text-xs text-zinc-500">({PROJECTS.length})</span>
        </header>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: hover only drives the preview image; entries contain their own links and buttons */}
        <div className="relative" onMouseLeave={clearProjectHover}>
          <GutterNote side="right" className="top-3" delay={1.6}>
            {"hover for a peek"}
          </GutterNote>
          {PROJECTS.map((project, i) => (
            <ProjectEntry
              key={project.slug}
              project={project}
              delay={0.5 + i * 0.15}
              previewUrl={PROJECT_PREVIEW_URLS.get(project.slug) ?? ""}
              onHover={handleProjectHover}
            />
          ))}
        </div>
      </section>

      <div className="hidden md:block">
        <HoverPreview
          previewUrl={
            hoveredWork?.previewUrl || hoveredProject?.previewUrl || null
          }
          anchorRect={hoveredWork?.rect || hoveredProject?.rect || null}
        />
      </div>
    </>
  );
}
