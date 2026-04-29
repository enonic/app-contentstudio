import {ContextMenu} from '@enonic/ui';
import {Globe} from 'lucide-react';
import {type MouseEvent as ReactMouseEvent, type ReactElement, useCallback} from 'react';
import {ComponentPath} from '../../../app/page/region/ComponentPath';
import {PageNavigationEvent} from '../../../app/wizard/PageNavigationEvent';
import {PageNavigationEventData} from '../../../app/wizard/PageNavigationEventData';
import {PageNavigationEventType} from '../../../app/wizard/PageNavigationEventType';
import {PageNavigationMediator} from '../../../app/wizard/PageNavigationMediator';
import {useI18n} from '../hooks/useI18n';
import {LegacyElement} from './LegacyElement';
import {PreviewLabel} from './PreviewLabel';

const PREVIEW_CONTEXT_MENU_NAME = 'PreviewContextMenu';

export type PreviewContextMenuProps = {
    pageName: string;
    pageType?: string;
    messages: string[];
    showIcon?: boolean;
};

export const PreviewContextMenu = ({pageName, pageType, messages, showIcon}: PreviewContextMenuProps): ReactElement => {
    const inspectLabel = useI18n('action.page.settings');

    // Re-route primary clicks as contextmenu events so the placeholder opens
    // the menu on click as well as on right-click, preserving the legacy UX.
    const handleClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
            button: 2,
            view: window,
        }));
    }, []);

    const handleInspect = useCallback(() => {
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(ComponentPath.root())),
        );
    }, []);

    return (
        <ContextMenu data-component={PREVIEW_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger
                className="flex h-full w-full items-center justify-center"
                onClick={handleClick}
            >
                <PreviewLabel messages={messages} showIcon={showIcon} className="text-xl" />
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-48">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-main">
                        <Globe className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{pageName || pageType}</span>
                    </div>
                    <ContextMenu.Item onSelect={handleInspect}>
                        {inspectLabel}
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

PreviewContextMenu.displayName = PREVIEW_CONTEXT_MENU_NAME;

//
// * Backward compatibility
//

export class PreviewContextMenuElement extends LegacyElement<typeof PreviewContextMenu> {

    constructor(props: PreviewContextMenuProps) {
        super(props, PreviewContextMenu);
        this.addClass('size-full');
    }
}
