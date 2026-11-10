import type { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { cn } from '@enonic/ui';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { fetchSidebarWidgetHtml } from '../../api/sidebarWidget.api';
import { createSidebarWidgetElement } from '../../lib/sidebarWidgetHtml';

const EXTERNAL_SIDEBAR_WIDGET_NAME = 'ExternalSidebarWidget';

type Status = 'loading' | 'ready' | 'error';

export type ExternalSidebarWidgetProps = {
    widget: Readonly<Extension>;
    active: boolean;
    className?: string;
};

export const ExternalSidebarWidget = ({ widget, active, className }: ExternalSidebarWidgetProps): ReactElement => {
    const hostRef = useRef<HTMLDivElement>(null);
    const assetsRef = useRef<HTMLElement[]>([]);
    const errorMessage = useI18n('widget.render.error');

    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        const host = hostRef.current;
        if (host == null) return;

        const controller = new AbortController();

        const load = async (): Promise<void> => {
            setStatus('loading');

            const result = await fetchSidebarWidgetHtml(widget.getFullUrl(), controller.signal);
            if (controller.signal.aborted) return;

            if (result.isErr()) {
                throw result.error;
            }

            const { element, assets } = createSidebarWidgetElement(result.value);
            host.replaceChildren(element);
            assetsRef.current = assets;
            setStatus('ready');
        };

        load().catch((error: unknown) => {
            if (controller.signal.aborted) return;
            console.error(error);
            setStatus('error');
        });

        return () => {
            controller.abort();
            assetsRef.current.forEach((asset) => asset.remove());
            assetsRef.current = [];
            host.replaceChildren();
        };
    }, [widget]);

    // ! The widget stays mounted while another one is shown, but its stylesheets
    // ! must leave the document so they cannot restyle the active widget.
    useEffect(() => {
        if (status !== 'ready') return;

        const assets = assetsRef.current;
        if (active) {
            assets.forEach((asset) => document.head.appendChild(asset));
        } else {
            assets.forEach((asset) => asset.remove());
        }
    }, [active, status]);

    return (
        <div
            data-component={EXTERNAL_SIDEBAR_WIDGET_NAME}
            className={cn('relative size-full', className)}
            aria-busy={status === 'loading' || undefined}
        >
            <div ref={hostRef} className="size-full" />
            {status === 'error' && <div className="py-5 text-center text-subtle">{errorMessage}</div>}
        </div>
    );
};

ExternalSidebarWidget.displayName = EXTERNAL_SIDEBAR_WIDGET_NAME;
