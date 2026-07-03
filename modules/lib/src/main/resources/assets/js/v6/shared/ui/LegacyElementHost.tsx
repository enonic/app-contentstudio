import { Element } from '@enonic/lib-admin-ui/dom/Element';
import { cn } from '@enonic/ui';
import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactElement } from 'react';

export type LegacyElementHostProps = {
    // Owned by its legacy creator; detached (not destroyed) on unmount.
    element: Element;
} & ComponentPropsWithoutRef<'div'>;

const LEGACY_ELEMENT_HOST_NAME = 'LegacyElementHost';

export const LegacyElementHost = ({ element, className, ...props }: LegacyElementHostProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (container == null) return;

        // Legacy wrapper fires the onAdded lifecycle; raw appendChild would not.
        const wrapper = Element.fromHtmlElement(container);
        wrapper.appendChild(element);
        if (!element.isRendered() && !element.isRendering()) void element.render();

        return () => {
            // ! Silent detach: onRemoved teardown would not survive re-hosting.
            element.getHTMLElement().remove();
        };
    }, [element]);

    // Relative: legacy `.panel` children are absolute.
    return (
        <div
            ref={containerRef}
            data-component={LEGACY_ELEMENT_HOST_NAME}
            className={cn('relative', className)}
            {...props}
        />
    );
};

LegacyElementHost.displayName = LEGACY_ELEMENT_HOST_NAME;
