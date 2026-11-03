import { ApplicationEvent, ApplicationEventType } from '@enonic/lib-admin-ui/application/ApplicationEvent';
import { type ApplicationKey } from '../../../shared/lib/cms/application/applicationKey';

export type ApplicationEventKind =
    | 'installed'
    | 'uninstalled'
    | 'resolved'
    | 'starting'
    | 'started'
    | 'updated'
    | 'stopping'
    | 'stopped'
    | 'unresolved'
    | 'progress';

export type ApplicationChange = {
    readonly applicationKey: ApplicationKey;
    readonly kind: ApplicationEventKind;
};

const KINDS: Record<ApplicationEventType, ApplicationEventKind> = {
    [ApplicationEventType.INSTALLED]: 'installed',
    [ApplicationEventType.UNINSTALLED]: 'uninstalled',
    [ApplicationEventType.RESOLVED]: 'resolved',
    [ApplicationEventType.STARTING]: 'starting',
    [ApplicationEventType.STARTED]: 'started',
    [ApplicationEventType.UPDATED]: 'updated',
    [ApplicationEventType.STOPPING]: 'stopping',
    [ApplicationEventType.STOPPED]: 'stopped',
    [ApplicationEventType.UNRESOLVED]: 'unresolved',
    [ApplicationEventType.PROGRESS]: 'progress',
};

const TRANSIENT_KINDS = new Set<ApplicationEventKind>(['resolved', 'starting', 'unresolved', 'stopping']);

export const isSettledApplicationChange = ({ kind }: ApplicationChange): boolean => !TRANSIENT_KINDS.has(kind);

export function onApplicationEvent(handler: (change: ApplicationChange) => void): () => void {
    const listener = (event: ApplicationEvent): void => {
        handler({ applicationKey: event.getApplicationKey()?.toString() ?? '', kind: KINDS[event.getEventType()] });
    };

    ApplicationEvent.on(listener);

    return () => ApplicationEvent.un(listener);
}
