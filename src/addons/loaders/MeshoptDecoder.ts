/**
 * What {@link MeshoptDecoder} offers: the fields three's `GLTFLoader` checks
 * @category catalog
 * @advanced
 */
export interface MeshoptDecoderApi {
  /** Always `true` */
  readonly supported: boolean;
  /** Settled at once */
  readonly ready: Promise<void>;
}

/**
 * A stand-in for three's `MeshoptDecoder`, so `loader.setMeshoptDecoder(MeshoptDecoder)` runs
 * unchanged
 *
 * pixi-3d decodes meshopt-compressed glTF files itself, loading the `meshoptimizer` decoder the first
 * time a file needs it, so `GLTFLoader` doesn't use what it is given.
 * @example
 * ```ts
 * const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 * ```
 * @category catalog
 * @advanced
 */
export const MeshoptDecoder: MeshoptDecoderApi = {
  supported: true,
  ready: Promise.resolve(),
};
