import type {HTMLAttributes} from 'react';
import {forwardRef} from 'react';

/**
 * Custom Virtuoso Scroller and List components that add consistent spacing
 * to virtualized tree lists (row gap and scroll area padding).
 */
export const virtuosoComponents = {
    Scroller: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className="*:px-5 *:py-2.5">
            {children}
        </div>
    )),
    List: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className="flex flex-col gap-y-1.5">
            {children}
        </div>
    )),
};
