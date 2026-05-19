import {cn} from '@enonic/ui';
import type {LucideIcon, LucideProps} from 'lucide-react';
import {forwardRef} from 'react';

export const JukeMonoIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
    ({size = 24, className, ...props}, ref) => (
        <svg
            ref={ref}
            xmlns='http://www.w3.org/2000/svg'
            width={size}
            height={size}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className={cn('lucide lucide-juke-mono', className)}
            aria-hidden='true'
            {...props}
        >
            <path d='M1.88 4.71c5.54 3.04 14.72 3.04 20.25 0' />
            <path d='M3.63 7.82c-1.01 7.9 3.65 13.1 8.37 13.1s9.38-5.2 8.37-13.1' />
            <circle cx='13.08' cy='13.49' r='2.36' fill='currentColor' stroke='none' />
        </svg>
    ),
);
JukeMonoIcon.displayName = 'JukeMonoIcon';
