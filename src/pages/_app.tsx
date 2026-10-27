import AnimatedText from "@/components/animated-text";
import FishField from "@/components/fish-field";
import GutterNote from "@/components/gutter-note";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons";
import SoundToggle from "@/components/sound-toggle";
import StatusLine from "@/components/status-line";
import { EDUCATION, PROJECTS, SOCIALS, WORK_ITEMS } from "@/utils/constants";
import "@/globals.css";
import "@fontsource/mononoki/latin-400.css";
import "@fontsource/mononoki/latin-700.css";
import { Analytics } from "@vercel/analytics/next";
import {
  LayoutGroup,
  type MotionNodeAnimationOptions,
  motion,
  type Transition,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "motion/react";
import type { AppProps } from "next/app";
import { Caveat } from "next/font/google";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-caveat",
  display: "swap",
});

const NAME_WRAPPER_SPRING_CONFIG = {
  type: "spring",
  stiffness: 80,
  damping: 20,
} as const satisfies Transition;

const NAME_SPRING_CONFIG = {
  stiffness: 30,
  damping: 15,
  mass: 3,
} as const satisfies Transition;

const ANIMATION_STEPS = [
  { font: "Redaction 100", weight: 700, size: 16 },
  { font: "Redaction 10", weight: 400, size: 13 },
  { font: "Redaction 70", weight: 700, size: 10 },
  { font: "Redaction", weight: 400, size: 8 },
  { font: "Redaction 35", weight: 700, size: 6.5 },
  { font: "Redaction 100", weight: 400, size: 5.2 },
  { font: "Redaction 20", weight: 400, size: 4.2 },
  { font: "Redaction 50", weight: 700, size: 3.75 },
] as const satisfies Array<{
  font: string;
  weight: number;
  size: number;
}>;

const LAST_STEP = ANIMATION_STEPS.length - 1;
const STEP_INDICES = ANIMATION_STEPS.map((_, i) => i);
const STEP_SIZES = ANIMATION_STEPS.map((s) => s.size);

const SITE_URL = "https://siddharthroy.com";
const SITE_TITLE = "siddharth";
const SITE_DESCRIPTION =
  "software engineer building web apps, automation, games, and AI-powered tools.";

const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Siddharth Roy",
  url: SITE_URL,
  jobTitle: "Software Engineer",
  sameAs: [
    "https://github.com/siddharthroy12",
    "https://www.linkedin.com/in/reactoverflow/",
  ],
});

const SOCIAL_ANIMATION = {
  initial: {
    opacity: 0,
    y: 5,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  transition: {
    duration: 1,
    ease: [0.2, 0.65, 0.3, 0.9],
  },
} as const satisfies MotionNodeAnimationOptions;

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  GitHub: <GitHubIcon />,
  LinkedIn: <LinkedInIcon />,
  X: <XIcon />,
  Instagram: <InstagramIcon />,
};

export default function App({ Component, pageProps, router }: AppProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const progress = useMotionValue(0);
  const spring = useSpring(progress, NAME_SPRING_CONFIG);
  const [expanded, setExpanded] = useState(true);

  const fontSize = useTransform(spring, STEP_INDICES, STEP_SIZES);
  const fontSizeRem = useTransform(
    fontSize,
    (v) =>
      `clamp(${(v * 0.3).toFixed(2)}rem, ${(v * 3.5).toFixed(2)}vw, ${v}rem)`,
  );

  useMotionValueEvent(spring, "change", (v) => {
    if (!ref.current) {
      return;
    }

    const i = Math.max(0, Math.min(Math.round(v), LAST_STEP));
    ref.current.style.setProperty(
      "font-family",
      `"${ANIMATION_STEPS[i].font}"`,
      "important",
    );
    ref.current.style.setProperty(
      "font-weight",
      String(ANIMATION_STEPS[i].weight),
      "important",
    );

    if (v > LAST_STEP) {
      setExpanded(true);
    }
  });

  useEffect(() => {
    progress.set(LAST_STEP);
  }, [progress]);

  // Hovering the settled name flickers it through a few other cuts of the
  // typeface before landing back on the final one.
  const glitchTimers = useRef<number[]>([]);
  const glitchName = useCallback(() => {
    const heading = ref.current;
    if (!heading || !expanded) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (glitchTimers.current.length > 0) return;

    const applyStep = (i: number) => {
      heading.style.setProperty(
        "font-family",
        `"${ANIMATION_STEPS[i].font}"`,
        "important",
      );
      heading.style.setProperty(
        "font-weight",
        String(ANIMATION_STEPS[i].weight),
        "important",
      );
    };

    const sequence: number[] = [];
    while (sequence.length < 4) {
      const i = Math.floor(Math.random() * LAST_STEP);
      if (sequence[sequence.length - 1] !== i) sequence.push(i);
    }
    sequence.push(LAST_STEP);

    sequence.forEach((step, n) => {
      const id = window.setTimeout(() => {
        applyStep(step);
        if (n === sequence.length - 1) glitchTimers.current = [];
      }, n * 70);
      glitchTimers.current.push(id);
    });
  }, [expanded]);

  useEffect(
    () => () => {
      for (const id of glitchTimers.current) window.clearTimeout(id);
    },
    [],
  );

  if (router.pathname === "/404") {
    return (
      <>
        <Analytics />
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <main
      className={`${caveat.variable} relative flex min-h-dvh w-full overflow-hidden bg-background text-stone-100`}
    >
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <link rel="canonical" href={SITE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og.png`} />
        <meta property="og:image:width" content="1248" />
        <meta property="og:image:height" content="702" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON_LD }}
        />
      </Head>

      {/* full-height column rules, aligned with the content column below */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 px-2"
      >
        <div className="mx-auto h-full w-full max-w-[40rem] border-x border-border" />
      </div>
      <motion.div className="relative z-10 flex flex-1">
        <div className="relative flex-1 flex justify-center py-[10vh] overflow-x-hidden overflow-y-auto">
          <FishField />
          {/* The full-width rules extend 100vw past the column. Clipping them
              here (overflow-y stays visible, so this really is a clip) keeps
              them from counting as scrollable overflow. */}
          <div className="flex w-full justify-center overflow-x-clip px-2">
            <LayoutGroup>
              <motion.div
                layout
                data-fish-avoid
                className={
                  expanded
                    ? "relative isolate flex w-full max-w-[40rem] flex-col items-stretch"
                    : "relative isolate flex flex-col items-start"
                }
                transition={NAME_WRAPPER_SPRING_CONFIG}
              >
                {expanded ? (
                  <div
                    data-fish-clear
                    className="screen-line-top relative h-24 sm:h-32"
                  ></div>
                ) : null}
                <div
                  className={
                    expanded
                      ? "screen-line-top screen-line-top-border screen-line-bottom px-4 pt-6 pb-5"
                      : "px-4"
                  }
                >
                  <motion.h1
                    layout
                    ref={ref}
                    className="font-bold whitespace-nowrap will-change-transform"
                    style={{
                      fontSize: fontSizeRem,
                      // first step of the intro, so there is no flash of the
                      // heading font before the animation takes over
                      fontFamily: `"${ANIMATION_STEPS[0].font}"`,
                    }}
                    onPointerEnter={glitchName}
                  >
                    siddharth
                  </motion.h1>

                  {expanded ? (
                    <>
                      <AnimatedText
                        className="text-zinc-300"
                        text="software engineer and gamer"
                        element="p"
                      />

                      <div className="relative flex items-center gap-2 mt-1">
                        <GutterNote side="left" className="-top-4" delay={1}>
                          follow me
                        </GutterNote>
                        {SOCIALS.map((social, i) => (
                          <motion.a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={social.label}
                            className="text-zinc-400 hover:text-violet-100 transition-colors"
                            initial={SOCIAL_ANIMATION.initial}
                            animate={SOCIAL_ANIMATION.animate}
                            transition={{
                              ...SOCIAL_ANIMATION.transition,
                              delay: 0.3 + i * 0.1,
                            }}
                          >
                            {SOCIAL_ICONS[social.label]}
                          </motion.a>
                        ))}
                        <motion.span
                          className="flex"
                          initial={SOCIAL_ANIMATION.initial}
                          animate={SOCIAL_ANIMATION.animate}
                          transition={{
                            ...SOCIAL_ANIMATION.transition,
                            delay: 0.3 + SOCIALS.length * 0.1,
                          }}
                        >
                          <SoundToggle className="text-zinc-400 hover:text-violet-100 transition-colors cursor-pointer" />
                        </motion.span>
                      </div>

                      <motion.div
                        initial={SOCIAL_ANIMATION.initial}
                        animate={SOCIAL_ANIMATION.animate}
                        transition={{
                          ...SOCIAL_ANIMATION.transition,
                          delay: 0.3 + (SOCIALS.length + 1) * 0.1,
                        }}
                      >
                        <StatusLine className="mt-3 text-xs text-zinc-400" />
                      </motion.div>
                    </>
                  ) : null}
                </div>

                {expanded ? (
                  <>
                    <div className="stripe-divider" />
                    <Component {...pageProps} />
                    <div className="stripe-divider screen-line-bottom" />
                    <div
                      data-fish-clear
                      className="screen-line-bottom relative h-24 sm:h-32"
                    ></div>
                  </>
                ) : null}

                <noscript>
                  <p>software engineer and gamer</p>
                  <nav>
                    {SOCIALS.map((social) => (
                      <a key={social.label} href={social.href}>
                        {social.label}
                      </a>
                    ))}
                  </nav>
                  <p>
                    <a href="https://looskie.com/">design by looskie</a>
                  </p>

                  <h2>work</h2>
                  {WORK_ITEMS.map((item) => (
                    <div key={item.slug}>
                      <a href={item.url}>
                        <strong>{item.company}</strong> — {item.role}
                      </a>
                      <p>{item.about}</p>
                      <span>{item.date}</span>
                    </div>
                  ))}

                  <h2>education</h2>
                  {EDUCATION.map((item) => (
                    <div key={item.slug}>
                      <strong>{item.school}</strong> — {item.degree}
                      <p>
                        {item.date}, {item.location}
                      </p>
                    </div>
                  ))}

                  <h2>projects</h2>
                  {PROJECTS.map((project) => (
                    <div key={project.slug}>
                      <a href={project.url}>
                        <strong>{project.name}</strong> — {project.role}
                      </a>
                      <p>{project.about}</p>
                    </div>
                  ))}
                </noscript>
              </motion.div>
            </LayoutGroup>
          </div>
        </div>
      </motion.div>
      <Analytics />
    </main>
  );
}
