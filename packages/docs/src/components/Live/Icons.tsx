import type { ReactNode, SVGProps } from 'react';

/**
 * A 16px stroked icon
 * @param props - The SVG's props and its paths
 */
function Icon(props: SVGProps<SVGSVGElement>): ReactNode {
  const { children, ...rest } = props;

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Run */
export const PlayIcon = (): ReactNode => (
  <Icon>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" fill="currentColor" />
  </Icon>
);

/** Stop */
export const StopIcon = (): ReactNode => (
  <Icon>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </Icon>
);

/** Copy */
export const CopyIcon = (): ReactNode => (
  <Icon>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
);

/** Done */
export const CheckIcon = (): ReactNode => (
  <Icon>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

/** Fill the window */
export const ExpandIcon = (): ReactNode => (
  <Icon>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </Icon>
);

/** Back into the page */
export const CollapseIcon = (): ReactNode => (
  <Icon>
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </Icon>
);

/** Open or close */
export const ChevronIcon = (): ReactNode => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

/** Clear */
export const ClearIcon = (): ReactNode => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.6 5.6 12.8 12.8" />
  </Icon>
);

/** Search or filter */
export const SearchIcon = (): ReactNode => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Icon>
);
