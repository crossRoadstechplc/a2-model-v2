/** Small inline status/label badge. */

import clsx from 'clsx';

const VARIANTS = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red:    'bg-red-50 text-red-600 ring-red-200',
  blue:   'bg-blue-50 text-blue-700 ring-blue-200',
  amber:  'bg-amber-50 text-amber-700 ring-amber-200',
  slate:  'bg-slate-100 text-slate-600 ring-slate-200',
};

export function Badge({ children, variant = 'slate', size = 'sm' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        VARIANTS[variant] ?? VARIANTS.slate,
      )}
    >
      {children}
    </span>
  );
}
