//* Object Ids ==============================
// Core keys hits, hovers, visibility entries and portals by an id it keeps, so an object needs no `uuid`

const objectIds = new WeakMap<object, string>()
let lastObjectId = 0

/**
 * Returns the id core keeps for an object: the key of its hits and hovers, of its visibility entry and
 * of a portal into it.
 *
 * @param object - Any object
 * @returns The object's id, the same for its lifetime
 */
export function getObjectId(object: object): string {
  let id = objectIds.get(object)
  if (id === undefined) objectIds.set(object, (id = String(++lastObjectId)))
  return id
}
