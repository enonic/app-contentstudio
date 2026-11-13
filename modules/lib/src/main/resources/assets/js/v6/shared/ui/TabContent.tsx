import { cn, Tab, useTab } from '@enonic/ui';
import { type ComponentPropsWithoutRef, forwardRef, type ReactElement } from 'react';

type TabContentProps = Omit<ComponentPropsWithoutRef<typeof Tab.Content>, 'forceMount' | 'hidden'>;

/** Keep aria-controls targets mounted without mounting inactive forms or editors. */
export const TabContent = forwardRef<HTMLDivElement, TabContentProps>(
    ({ value, children, className, ...props }, ref): ReactElement => {
        const { value: activeValue } = useTab();
        const isActive = activeValue === value;

        return (
            <Tab.Content {...props} ref={ref} value={value} forceMount className={cn(className, !isActive && 'hidden')}>
                {isActive ? children : null}
            </Tab.Content>
        );
    },
);

TabContent.displayName = 'TabContent';
