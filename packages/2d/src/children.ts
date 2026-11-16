import {
  THREE_IN_2D,
  addInElementOrder,
  clearCursorsUnder,
  indexByElementOrder,
  isLayer3D,
  isNode3D,
  warnOnce,
} from '@react-fiber/core/extension';
import type { Linked } from '@react-fiber/core/extension';
import { Container, Particle, ParticleContainer } from 'pixi.js';

/**
 * Adds a particle to a particle container where its element is among its siblings
 * @param container - The particle container
 * @param particle - The particle
 */
function addParticleInOrder(container: ParticleContainer, particle: Linked<Particle>): void {
  const particles = container.particleChildren;
  const current = particles.indexOf(particle);
  const index = indexByElementOrder(particles, particle);
  if (current !== -1) particles.splice(current, 1);
  if (index === -1) particles.push(particle);
  else particles.splice(index, 0, particle);
  container.update();
}

/**
 * Adds a child to a 2D container, or moves it, where its element is among its siblings: a particle to a
 * particle container, any other 2D object to any container. A screen layer's 3D layer stays where it
 * is, and a 3D object is left out with a warning.
 * @param parent - The container
 * @param child - The child's object
 * @internal
 */
export function add2D(parent: Container, child: Linked<object>): void {
  if (isLayer3D(child)) return;
  if (child instanceof Particle) {
    if (parent instanceof ParticleContainer) addParticleInOrder(parent, child);
    else warnOnce('react-fiber: a <particle2D> must be inside a <particleContainer2D>.');
  } else if (child instanceof Container) addInElementOrder(parent, child);
  else if (isNode3D(child)) warnOnce(THREE_IN_2D);
}

/**
 * Takes a child out of a 2D container, clearing the cursor it or anything under it set
 * @param parent - The container
 * @param child - The child's object
 * @internal
 */
export function remove2D(parent: Container, child: object): void {
  if (isLayer3D(child)) return;
  if (child instanceof Particle && parent instanceof ParticleContainer) parent.removeParticle(child);
  else if (child instanceof Container && child.parent === parent) {
    clearCursorsUnder(child);
    parent.removeChild(child);
  }
}
