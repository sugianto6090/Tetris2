/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GRID_WIDTH = 7;
export const GRID_HEIGHT = 10;
export const INITIAL_TICK_SPEED = 1000; // 1 second - very slow for kids
export const FAST_TICK_SPEED = 100;

export type AnimalType = 'cat' | 'dog' | 'rabbit' | 'panda' | 'chick';

export const ANIMALS: AnimalType[] = ['cat', 'dog', 'rabbit', 'panda', 'chick'];

export const ANIMAL_COLORS: Record<AnimalType, string> = {
  cat: 'bg-orange-400',
  dog: 'bg-amber-600',
  rabbit: 'bg-pink-300',
  panda: 'bg-slate-200',
  chick: 'bg-yellow-400',
};

// Simplified shapes for toddlers: mostly single blocks and 1x2 or 2x1
export const SHAPES = [
  [[1]], // Dot
  [[1, 1]], // Horizontal line
  [[1], [1]], // Vertical line
  [[1, 1], [1, 0]], // L shape
  [[1, 1], [0, 1]], // Reverse L
];
