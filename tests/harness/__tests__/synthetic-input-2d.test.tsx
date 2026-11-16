import type { TestScene } from '../scene-runner';
import { defineSyntheticInputTests } from '../synthetic-input-tests';

const modules = import.meta.glob<{ scene: TestScene }>('../../scenes/2d/**/*.scene.tsx', { eager: true });

defineSyntheticInputTests(
  Object.fromEntries(
    Object.entries(modules).map(([file, module]) => [
      file.slice('../../scenes/'.length).replace(/\.scene\.tsx$/, ''),
      module,
    ]),
  ),
);
