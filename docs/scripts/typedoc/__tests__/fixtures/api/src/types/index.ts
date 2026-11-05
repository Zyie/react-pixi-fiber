/** The state of a root */
export interface RootState {
  /** The size of the canvas */
  size: { width: number; height: number };
  missing: boolean;
}

/** Steps a root */
export interface Advance {
  /** Steps a root at a time */
  (timestamp: number): void;
}
