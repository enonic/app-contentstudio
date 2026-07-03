import { Element } from '@enonic/lib-admin-ui/dom/Element';
import { cn } from '@enonic/ui';
import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactElement } from 'react';

export type LegacyElementHostProps = {
    // The hosted element stays owned by its legacy creator: it is attached on mount
    // and detached (not destroyed) on unmount, so it can be re-hosted elsewhere.
    element: Element;
} & ComponentPropsWithoutRef<'div'>;

const LEGACY_ELEMENT_HOST_NAME = 'LegacyElementHost';

export const LegacyElementHost = ({ element, className, ...props }: LegacyElementHostProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (container == null) return;

        // Attach through a legacy wrapper so the element's onAdded lifecycle fires
        // (split panels distribute, preview tracks visibility) — a raw appendChild would not.
        const wrapper = Element.fromHtmlElement(container);
        wrapper.appendChild(element);
        if (!element.isRendered() && !element.isRendering()) void element.render();

        return () => {
            // ! Detach the DOM silently: element.remove()/removeChild would fire onRemoved,
            // which legacy components use for one-shot teardown and could not survive re-hosting.
            element.getHTMLElement().remove();
        };
    }, [element]);

    // Positioned: legacy `.panel` children are absolute and must anchor to this container.
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
