import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  /** Which gutter the note sits in, relative to its positioned parent. */
  side: "left" | "right";
  children: ReactNode;
  className?: string;
  delay?: number;
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 7c14 1 24 10 29 26" />
      <path d="M26 29l8 4 1-9" />
    </svg>
  );
}

/**
 * A handwritten aside placed in the empty gutter beside the content column,
 * with a little arrow pointing back in. Only shown when the gutters are wide
 * enough to fit it.
 */
export default function GutterNote({
  side,
  children,
  className,
  delay = 1.2,
}: Props) {
  const isLeft = side === "left";
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden items-start gap-1 font-hand text-lg leading-tight text-zinc-500 lg:flex ${
        isLeft
          ? "right-full mr-6 flex-row text-right"
          : "left-full ml-6 flex-row-reverse text-left"
      } ${className ?? ""}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.65, 0.3, 0.9] }}
    >
      <span className={`whitespace-pre ${isLeft ? "-rotate-3" : "rotate-2"}`}>
        {children}
      </span>
      <ArrowIcon
        className={`mt-1 size-8 shrink-0 ${isLeft ? "" : "-scale-x-100"}`}
      />
    </motion.div>
  );
}
