/**
 * Card – generic white surface container.
 *
 * Props:
 *   padding   – 'none' | 'sm' | 'md' | 'lg'   (default: 'md')
 *   overflow  – 'hidden' | 'auto' | 'visible'  (default: undefined — no override)
 *   as        – HTML element tag                 (default: 'div')
 *   className – extra Tailwind classes
 *   children
 */

import clsx from 'clsx';

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

const OVERFLOW = {
  hidden:  'overflow-hidden',
  auto:    'overflow-auto',
  visible: 'overflow-visible',
};

export function Card({ children, className, padding = 'md', overflow, as: Tag = 'div' }) {
  return (
    <Tag
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        PADDING[padding],
        overflow && OVERFLOW[overflow],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
