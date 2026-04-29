/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cat, Dog, Rabbit, Bird, Smile } from 'lucide-react';
import { AnimalType } from '../constants';

export const AnimalIcon = ({ type, size = 32, className = "" }: { type: AnimalType | null, size?: number, className?: string }) => {
  if (!type) return null;
  
  const props = { size, className: `text-white drop-shadow-md ${className}` };
  
  switch (type) {
    case 'cat': return <Cat {...props} />;
    case 'dog': return <Dog {...props} />;
    case 'rabbit': return <Rabbit {...props} />;
    case 'panda': return <Smile {...props} />; // Panda uses smile for friendliness
    case 'chick': return <Bird {...props} />;
    default: return null;
  }
};
