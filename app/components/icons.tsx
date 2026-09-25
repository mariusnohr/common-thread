import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        fill="currentColor"
        d="M12 21.2 10.6 20C5.4 15.3 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.8-8.6 11.5L12 21.2Z"
      />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        fill="currentColor"
        d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.6Z"
      />
    </svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        fill="currentColor"
        d="M12 2c1.2 3.6-1.4 5.6-3 7.6C7.6 11.3 6 13 6 15.6a6 6 0 0 0 12 0c0-2.8-1.6-4.9-3-6.3.1 1.9-.5 3.3-1.7 4C13.9 9.6 13.7 5.1 12 2Z"
      />
    </svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5" />
      <path d="M12 18.2h.01" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/**
 * The brand mark: four knots in the group colours, tied together by one red
 * thread that draws itself on load.
 */
export function LogoMark(props: IconProps) {
  return (
    <svg {...base(props)} viewBox="0 0 40 40" className={`logo-mark ${props.className ?? ""}`}>
      <path
        className="logo-thread"
        pathLength={1}
        d="M9 10c8-6 16 6 22 0M31 10c6 8-6 14 0 20M31 30c-8 6-16-6-22 0M9 30c-6-8 6-14 0-20"
        fill="none"
        stroke="var(--thread)"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="4.4" fill="var(--g1)" />
      <circle cx="31" cy="10" r="4.4" fill="var(--g2)" />
      <circle cx="31" cy="30" r="4.4" fill="var(--g3)" />
      <circle cx="9" cy="30" r="4.4" fill="var(--g4)" />
    </svg>
  );
}
