// #region result
import { Canvas, extend } from '@react-fiber/core';
import type { ThreeElement } from '@react-fiber/core';
import { Container, Graphics, Text } from 'pixi.js';

/** A rounded button with a label, built from pixi.js's own classes */
class Button extends Container {
  private readonly _background = new Graphics();
  private readonly _label = new Text({ text: '', style: { fill: 'white', fontSize: 20 } });

  constructor(label = 'Button') {
    super();
    this.addChild(this._background, this._label);
    this.label = label;
  }

  public set label(value: string) {
    this._label.text = value;
    this._label.position.set(16, 10);
    this._background
      .clear()
      .roundRect(0, 0, this._label.width + 32, 44, 12)
      .fill('royalblue');
  }

  public get label(): string {
    return this._label.text;
  }
}

extend({ Button2D: Button });

declare module '@react-fiber/core' {
  interface ThreeElements {
    button2D: ThreeElement<typeof Button>;
  }
}
// #endregion result

import type { Example } from '../example';

// #region result
function Toolbar() {
  return (
    <>
      <button2D args={['Play']} x={40} y={40} />
      <button2D label="Settings" x={40} y={100} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Toolbar />
    </Canvas>
  );
}
// #endregion result

/** Two buttons of an app's own 2D class, made an element with `extend` */
export const example: Example = {
  title: 'Your own 2D class as an element',
  render: () => <Toolbar />,
};
