// #region shown
import path from 'node:path';
// #endregion shown

export function joined(): string {
  // #region shown
  const name = path.join('a', 'b');

  // #region inner
  return name;
  // #endregion inner
  // #endregion shown
}
