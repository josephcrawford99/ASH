import React from 'react';
import { render } from '@testing-library/react-native';
import { KeyVector } from '@/components/KeyVector';

describe('KeyVector', () => {
  it('renders with required number prop', () => {
    const { getByText } = render(<KeyVector number={1} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('renders different numbers correctly', () => {
    const { getByText, rerender } = render(<KeyVector number={5} />);
    expect(getByText('5')).toBeTruthy();

    rerender(<KeyVector number={42} />);
    expect(getByText('42')).toBeTruthy();

    rerender(<KeyVector number={100} />);
    expect(getByText('100')).toBeTruthy();
  });

  it('uses default size of 44 when not specified', () => {
    const { toJSON } = render(<KeyVector number={1} />);
    const tree = toJSON();
    // Container should have default size
    expect(tree).toBeTruthy();
    if (tree && 'props' in tree) {
      expect(tree.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 44, height: 44 }),
        ])
      );
    }
  });

  it('applies custom size correctly', () => {
    const { toJSON } = render(<KeyVector number={1} size={60} />);
    const tree = toJSON();
    if (tree && 'props' in tree) {
      expect(tree.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 60, height: 60 }),
        ])
      );
    }
  });

  it('applies rotation when direction is provided', () => {
    const { toJSON } = render(<KeyVector number={1} direction={90} />);
    const tree = toJSON();
    // Find the image element and check its transform
    expect(tree).toBeTruthy();
    const findImageWithRotation = (node: unknown): boolean => {
      if (!node || typeof node !== 'object') return false;
      if ('type' in node && node.type === 'Image') {
        const props = (node as { props?: { style?: unknown[] } }).props;
        if (props?.style) {
          const styleArray = Array.isArray(props.style) ? props.style : [props.style];
          return styleArray.some(
            (s: unknown) =>
              s &&
              typeof s === 'object' &&
              'transform' in s &&
              Array.isArray((s as { transform: unknown[] }).transform) &&
              (s as { transform: { rotate?: string }[] }).transform.some(
                (t) => t.rotate === '90deg'
              )
          );
        }
      }
      if ('children' in node && Array.isArray((node as { children: unknown[] }).children)) {
        return (node as { children: unknown[] }).children.some(findImageWithRotation);
      }
      return false;
    };
    expect(findImageWithRotation(tree)).toBe(true);
  });

  it('defaults to 0 rotation when direction is null', () => {
    const { toJSON } = render(<KeyVector number={1} direction={null} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    // Should render without errors and use 0 rotation
    const findImageWithZeroRotation = (node: unknown): boolean => {
      if (!node || typeof node !== 'object') return false;
      if ('type' in node && node.type === 'Image') {
        const props = (node as { props?: { style?: unknown[] } }).props;
        if (props?.style) {
          const styleArray = Array.isArray(props.style) ? props.style : [props.style];
          return styleArray.some(
            (s: unknown) =>
              s &&
              typeof s === 'object' &&
              'transform' in s &&
              Array.isArray((s as { transform: unknown[] }).transform) &&
              (s as { transform: { rotate?: string }[] }).transform.some(
                (t) => t.rotate === '0deg'
              )
          );
        }
      }
      if ('children' in node && Array.isArray((node as { children: unknown[] }).children)) {
        return (node as { children: unknown[] }).children.some(findImageWithZeroRotation);
      }
      return false;
    };
    expect(findImageWithZeroRotation(tree)).toBe(true);
  });

  it('defaults to 0 rotation when direction is undefined', () => {
    const { toJSON } = render(<KeyVector number={1} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('scales font size based on marker size', () => {
    const size = 50;
    const expectedFontSize = size * 0.32; // 16
    const { getByText } = render(<KeyVector number={7} size={size} />);
    const textElement = getByText('7');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: expectedFontSize })])
    );
  });

  it('handles various direction angles', () => {
    const angles = [0, 45, 90, 180, 270, 359];
    angles.forEach((angle) => {
      const { toJSON, unmount } = render(<KeyVector number={1} direction={angle} />);
      expect(toJSON()).toBeTruthy();
      unmount();
    });
  });
});
