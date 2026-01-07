import merge from 'merge-descriptors';

export function applyOps<T extends object>(target: T, ...ops: object[]): T {
  for (const op of ops) {
    merge(target, op);
  }
  return target;
}

