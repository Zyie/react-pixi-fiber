const objectKeys = new WeakMap<object, string>()
let nextObjectKey = 0

/**
 * A key for an object, unique for its lifetime, which core keeps itself so it can key objects that
 * have no `uuid` (hover and capture entries, the visibility registry, a portal's container).
 */
export function objectKey(object: object): string {
  let key = objectKeys.get(object)
  if (key === undefined) objectKeys.set(object, (key = `${nextObjectKey++}`))
  return key
}
