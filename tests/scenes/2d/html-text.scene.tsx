import type { TestScene } from '@test-scene';

/**
 * `<htmlText2D>`, which pixi draws through an SVG image, so its picture arrives a few frames late: a
 * line of white text with a bold orange word and an italic blue one.
 */
export const scene: TestScene = {
  frames: 10,
  delay: 200,
  render: () => (
    <htmlText2D
      x={20}
      y={120}
      text="Some <b>bold</b> and <i>italic</i> text"
      style={{
        fill: 'white',
        fontSize: 28,
        fontFamily: 'Arial',
        tagStyles: { b: { fill: '#f58231', fontWeight: 'bold' }, i: { fill: '#3cb4e8', fontStyle: 'italic' } },
      }}
    />
  ),
};
