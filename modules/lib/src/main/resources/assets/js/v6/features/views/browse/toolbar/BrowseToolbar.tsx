import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {IdProvider, Toolbar} from '@enonic/ui';
import {createRef, forwardRef, type ReactElement, useImperativeHandle, useMemo, useRef} from 'react';
import {render} from 'react-dom';
import {useI18n} from '../../../hooks/useI18n';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ContextToggle} from './ContextToggle';
import {OverflowActionRow, type OverflowActionRowItem} from './OverflowActionRow';
import {SearchToggle} from './SearchToggle';
import {SplitActionButton} from './SplitActionButton';

export type BrowseToolbarHandle = {
    focusSearchToggle: () => void;
};

export type BrowseToolbarProps = {
    toggleFilterPanelAction: Action;
    showNewDialogAction: Action;
    editAction: Action;
    archiveAction: Action;
    duplicateAction: Action;
    moveAction: Action;
    sortAction: Action;
    previewAction: Action;
    publishAction: Action;
    unpublishAction: Action;
    publishTreeAction: Action;
    markAsReadyAction: Action;
    requestPublishAction: Action;
    createIssueAction: Action;
};

export const BrowseToolbar = forwardRef<BrowseToolbarHandle, BrowseToolbarProps>(({
    toggleFilterPanelAction,
    showNewDialogAction,
    editAction,
    archiveAction,
    duplicateAction,
    moveAction,
    sortAction,
    previewAction,
    publishAction,
    unpublishAction,
    publishTreeAction,
    markAsReadyAction,
    requestPublishAction,
    createIssueAction,
}, ref): ReactElement => {
    const searchToggleRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
        focusSearchToggle: () => {
            const toggle = searchToggleRef.current;

            if (toggle?.isConnected && !toggle.disabled) {
                toggle.focus({preventScroll: true});
            }
        },
    }), []);

    const toolbarActions: OverflowActionRowItem[] = useMemo(() => [
        {id: 'new', action: showNewDialogAction},
        {id: 'edit', action: editAction},
        {id: 'archive', action: archiveAction},
        {id: 'duplicate', action: duplicateAction},
        {id: 'move', action: moveAction},
        {id: 'sort', action: sortAction},
        {id: 'preview', action: previewAction},
    ], [archiveAction, duplicateAction, editAction, moveAction, previewAction, showNewDialogAction, sortAction]);
    const publishSplitActions: Action[] = [
        markAsReadyAction,
        publishAction,
        publishTreeAction,
        unpublishAction,
        requestPublishAction,
        createIssueAction,
    ];
    const mobileSplitActions: Action[][] = [
        toolbarActions.map(({action}) => action),
        publishSplitActions,
    ];

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label={useI18n('aria.browser.toolbar.label')}
                className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2 border-b border-bdr-soft"
            >
                <div className="flex min-w-fit items-center gap-2 sm:min-w-0 sm:flex-1">
                    <SearchToggle ref={searchToggleRef} action={toggleFilterPanelAction} />
                    <div className="sm:hidden shrink-0 min-w-fit">
                        <SplitActionButton actions={mobileSplitActions} />
                    </div>
                    <OverflowActionRow actions={toolbarActions} className="hidden sm:flex min-w-0 flex-1" />
                </div>
                <div className="flex-1 sm:hidden" />
                <div className="hidden sm:flex shrink-0 min-w-fit">
                    <SplitActionButton actions={[publishSplitActions]} />
                </div>
                <ContextToggle className="shrink-0" />
            </Toolbar.Container>
        </Toolbar>
    );
});

BrowseToolbar.displayName = 'BrowseToolbar';

export class BrowseToolbarElement extends LegacyElement<typeof BrowseToolbar, BrowseToolbarProps> {
    private readonly toolbarRef = createRef<BrowseToolbarHandle>();

    constructor(props: BrowseToolbarProps) {
        super(props, BrowseToolbar);
    }

    protected renderJsx(): void {
        const Component = this.component;

        render(
            <IdProvider prefix={this.getPrefix()}>
                <Component {...this.props.get()} ref={this.toolbarRef} />
            </IdProvider>,
            this.getHTMLElement()
        );
    }

    focusSearchToggle(): void {
        this.toolbarRef.current?.focusSearchToggle();
    }
}
