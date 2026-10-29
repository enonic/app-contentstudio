import { cn, Skeleton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { ContextPanelExtensionElement } from '../../../../app/extension/ContextPanelExtensionElement';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { fetchContextWidgetHtml } from '../api/contextWidget.api';
import { $contextContent } from '../model/contextContent.store';
import type { ContextWidget } from '../model/contextWidget.types';

const EXTERNAL_CONTEXT_WIDGET_NAME = 'ExternalContextWidget';

type Status = 'loading' | 'ready' | 'error';

export type ExternalContextWidgetProps = {
    widget: ContextWidget;
    className?: string;
};

export const ExternalContextWidget = ({ widget, className }: ExternalContextWidgetProps): ReactElement => {
    const hostRef = useRef<HTMLDivElement>(null);
    const renderedWidthRef = useRef(0);
    const content = useStore($contextContent);
    const errorMessage = useI18n('widget.render.error');

    const [status, setStatus] = useState<Status>('loading');
    const [resizeNonce, setResizeNonce] = useState(0);

    const { url, renderOnResize } = widget;

    useEffect(() => {
        const host = hostRef.current;
        if (!renderOnResize || host == null) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = Math.round(entry.contentRect.width);
            if (width > 0 && renderedWidthRef.current > 0 && width !== renderedWidthRef.current) {
                setResizeNonce((nonce) => nonce + 1);
            }
        });
        observer.observe(host);

        return () => observer.disconnect();
    }, [renderOnResize]);

    useEffect(() => {
        const host = hostRef.current;
        if (host == null || url == null) return;

        const controller = new AbortController();
        const element = ContextPanelExtensionElement.create();

        const load = async (): Promise<void> => {
            setStatus('loading');

            const result = await fetchContextWidgetHtml({
                url,
                contentId: content?.getId(),
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;

            if (result.isErr()) {
                setStatus('error');
                return;
            }

            host.replaceChildren(element);

            try {
                await element.setHtml(result.value);
            } catch {
                if (!controller.signal.aborted) setStatus('error');
                return;
            }

            if (controller.signal.aborted) return;

            renderedWidthRef.current = Math.round(host.getBoundingClientRect().width);
            setStatus('ready');
        };

        void load();

        return () => {
            controller.abort();
            element.cleanup();
            element.remove();
        };
    }, [url, content, resizeNonce]);

    if (url == null) return null;

    return (
        <div
            data-component={EXTERNAL_CONTEXT_WIDGET_NAME}
            className={cn('relative h-full', className)}
            aria-busy={status === 'loading' || undefined}
        >
            <div ref={hostRef} className="h-full" />
            {status === 'loading' && (
                <Skeleton.Group className="absolute inset-0 flex flex-col gap-3 bg-surface-neutral">
                    <Skeleton shape="rectangle" className="h-6 w-2/3" />
                    <Skeleton shape="rectangle" className="h-4 w-full" />
                    <Skeleton shape="rectangle" className="h-4 w-5/6" />
                </Skeleton.Group>
            )}
            {status === 'error' && <div className="py-5 text-center text-subtle">{errorMessage}</div>}
        </div>
    );
};

ExternalContextWidget.displayName = EXTERNAL_CONTEXT_WIDGET_NAME;
