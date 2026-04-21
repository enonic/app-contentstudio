import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {Avatar, Button, cn, IconButton, Toolbar, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ArrowLeft, Layers, Link2} from 'lucide-react';
import {type ReactElement, useEffect, useMemo} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ProjectIcon} from '../../../shared/icons/ProjectIcon';
import {StatusIcon} from '../../../shared/icons/StatusIcon';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {setInspectSaveAction} from '../../../store/inspect-panel.store';
import {$wizardToolbar} from '../../../store/wizardToolbar.store';
import {getInitials} from '../../../utils/format/initials';
import {useElementVisibility} from '../../../utils/hooks/useElementVisibility';
import {ContextToggle} from './ContextToggle';
import {OverflowActionRow, type OverflowActionRowItem} from './OverflowActionRow';
import {SplitActionButton, type SplitActionButtonAction} from './SplitActionButton';

export type ContentWizardToolbarProps = {
    onProjectBack?: () => void;
    onLayersClick?: () => void;
    onContentPathClick?: () => void;
    saveAction: Action;
    resetAction: Action;
    localizeAction: Action;
    archiveAction: Action;
    duplicateAction: Action;
    moveAction: Action;
    previewAction: Action;
    markAsReadyAction: Action;
    publishAction: Action;
    unpublishAction: Action;
    requestPublishAction: Action;
    openRequestAction: Action;
    createIssueAction: Action;
    className?: string;
};

const CONTENT_WIZARD_TOOLBAR_NAME = 'ContentWizardToolbar';

export const ContentWizardToolbar = ({
    onProjectBack,
    onLayersClick,
    onContentPathClick,
    saveAction,
    resetAction,
    localizeAction,
    archiveAction,
    duplicateAction,
    moveAction,
    previewAction,
    markAsReadyAction,
    publishAction,
    unpublishAction,
    requestPublishAction,
    openRequestAction,
    createIssueAction,
    className,
}: ContentWizardToolbarProps): ReactElement => {
    const {
        projectLabel,
        projectName,
        projectLanguage,
        projectHasIcon,
        collaborators,
        publishStatus,
        contentPath,
        canRenameContentPath,
        isPathAvailable,
        contentState,
        isLayerProject
    } = useStore($wizardToolbar, {
        keys: [
            'projectLabel',
            'projectName',
            'projectLanguage',
            'projectHasIcon',
            'collaborators',
            'publishStatus',
            'contentPath',
            'canRenameContentPath',
            'isPathAvailable',
            'contentState',
            'isLayerProject'
        ]
    });

    const layersLabel = useI18n('widget.layers.displayName');
    const toolbarLabel = useI18n('wcag.contenteditor.toolbar.label');
    const projectRoot = useI18n('field.root');
    const fieldPathLabel = useI18n('field.path');
    const pathLabel = `<${fieldPathLabel}>`;
    const projectViewLabel = projectLabel || projectRoot;
    const contentPathLabel = contentPath || pathLabel;

    useEffect(() => {
        setInspectSaveAction(saveAction);
        return () => setInspectSaveAction(null);
    }, [saveAction]);

    const toolbarActions: OverflowActionRowItem[] = useMemo(() => [
        {id: 'save', action: saveAction},
        {id: 'reset', action: resetAction},
        {id: 'localize', action: localizeAction},
        {id: 'archive', action: archiveAction},
        {id: 'duplicate', action: duplicateAction},
        {id: 'move', action: moveAction},
        {id: 'preview', action: previewAction},
    ], [archiveAction, duplicateAction, localizeAction, moveAction, previewAction, resetAction, saveAction]);
    const [desktopPathRef, isDesktopPathVisible] = useElementVisibility<HTMLDivElement>();
    const [mobilePathRef, isMobilePathVisible] = useElementVisibility<HTMLDivElement>();
    const [desktopPublishSplitRef, isDesktopPublishSplitVisible] = useElementVisibility<HTMLDivElement>();
    const [mobileActionsSplitRef, isMobileActionsSplitVisible] = useElementVisibility<HTMLDivElement>();

    const publishSplitActions: SplitActionButtonAction[] = [
        {action: markAsReadyAction},
        {action: publishAction},
        {action: unpublishAction},
        {action: requestPublishAction},
        {action: openRequestAction},
        {action: createIssueAction},
    ];
    const mobileSplitActions: SplitActionButtonAction[] = [
        ...toolbarActions.map(({action}) => ({action})),
        {action: markAsReadyAction},
        {action: publishAction},
        {action: unpublishAction},
        {action: requestPublishAction},
        {action: openRequestAction},
        {action: createIssueAction},
    ];

    return (
        <Toolbar data-component={CONTENT_WIZARD_TOOLBAR_NAME}>
            <Toolbar.Container
                aria-label={toolbarLabel}
                className={cn(
                    'content-wizard-toolbar w-full h-15 px-2 md:pl-2 md:pr-5 py-1.75 flex items-center border-b border-bdr-soft bg-surface-neutral',
                    className
                )}
            >
                <div className='flex min-w-fit max-w-fit items-center gap-2.5 sm:min-w-0 sm:max-w-none sm:flex-1 sm:basis-0'>
                    <Toolbar.Item asChild>
                        <Button
                            size='sm'
                            variant='text'
                            startIcon={ArrowLeft}
                            onClick={onProjectBack}
                            className='min-w-fit pr-2.75 sm:pr-3.5'
                        >
                            <ProjectIcon
                                projectName={projectName ?? projectViewLabel}
                                language={projectLanguage || undefined}
                                hasIcon={projectHasIcon}
                                isLayer={isLayerProject}
                                className='w-6 sm:w-8 shrink-0 flex lg:hidden' />
                            <span className='hidden lg:flex'>{projectViewLabel}</span>
                        </Button>
                    </Toolbar.Item>
                    <div ref={mobileActionsSplitRef} className='sm:hidden shrink-0 min-w-fit'>
                        <SplitActionButton
                            actions={mobileSplitActions}
                            disabled={!isMobileActionsSplitVisible}
                        />
                    </div>
                    <OverflowActionRow actions={toolbarActions} className='hidden sm:flex min-w-0 flex-1' />
                </div>
                <div className='flex min-w-0 flex-1 items-center justify-center px-0 sm:flex-none sm:shrink sm:px-2'>
                    {isLayerProject && (
                        <Toolbar.Item asChild>
                            <IconButton
                                size='sm'
                                icon={Layers}
                                aria-label={layersLabel}
                                onClick={onLayersClick}
                                className='shrink-0 size-8'
                            />
                        </Toolbar.Item>
                    )}
                    {contentState && (
                        <StatusIcon status={contentState} className='size-3.5 my-auto mx-1.5 md:mx-2.75 shrink-0' />
                    )}
                    <div ref={desktopPathRef} className='hidden md:flex min-w-0'>
                        <Toolbar.Item asChild disabled={!isDesktopPathVisible}>
                            <Button
                                size='sm'
                                variant='text'
                                className={cn('min-w-0 max-w-full px-1.5 md:px-2.75',
                                    !isPathAvailable && 'text-error')}
                                title={contentPathLabel}
                                disabled={!canRenameContentPath}
                                onClick={onContentPathClick}
                            >
                                <span className='min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap'>
                                    {contentPathLabel}
                                </span>
                            </Button>
                        </Toolbar.Item>
                    </div>
                    <div ref={mobilePathRef} className='md:hidden shrink-0'>
                        <Toolbar.Item asChild disabled={!isMobilePathVisible}>
                            <IconButton
                                size='md'
                                icon={Link2}
                                aria-label={contentPathLabel}
                                title={contentPathLabel}
                                disabled={!canRenameContentPath}
                                onClick={onContentPathClick}
                                className={cn('shrink-0 size-8', !isPathAvailable && 'text-error')}
                            />
                        </Toolbar.Item>
                    </div>
                </div>
                <div className='flex min-w-fit max-w-fit items-center justify-end gap-0 sm:min-w-fit sm:max-w-none sm:flex-1 sm:basis-0 sm:gap-0.5 md:gap-1 lg:gap-2.5'>
                    {collaborators.length > 0 && (
                        <div className='-space-x-2 items-center px-3.5 hidden md:flex shrink-0'>
                            {collaborators[0] && (
                                <Tooltip key={collaborators[0].key} value={collaborators[0].label}>
                                    <Avatar className={cn('ring-2 ring-surface-neutral size-7', collaborators[0].isCurrent && 'ring-info')}>
                                        <Avatar.Fallback className='text-alt font-semibold'>
                                            <span>{getInitials(collaborators[0].label)}</span>
                                        </Avatar.Fallback>
                                    </Avatar>
                                </Tooltip>
                            )}

                            {collaborators[1] && (
                                <Tooltip key={collaborators[1].key} value={collaborators[1].label}>
                                    <Avatar className={cn('hidden xl:inline-flex ring-2 ring-surface-neutral size-7 z-10',
                         collaborators[1].isCurrent && 'ring-info')}>
                                        <Avatar.Fallback className='text-alt font-semibold'>
                                            <span>{getInitials(collaborators[1].label)}</span>
                                        </Avatar.Fallback>
                                    </Avatar>
                                </Tooltip>
                            )}

                            {collaborators.length > 1 && (
                                <Avatar className='xl:hidden ring-2 ring-surface-neutral size-7 text-alt font-semibold'>
                                    <Avatar.Fallback>
                                        <span>+{collaborators.length - 1}</span>
                                    </Avatar.Fallback>
                                </Avatar>
                            )}

                            {collaborators.length > 2 && (
                                <Avatar className='hidden xl:inline-flex ring-2 ring-surface-neutral size-7 text-alt font-semibold'>
                                    <Avatar.Fallback>
                                        <span>+{collaborators.length - 2}</span>
                                    </Avatar.Fallback>
                                </Avatar>
                            )}
                        </div>
                    )}
                    <StatusBadge status={publishStatus} className='my-auto px-1.5 md:px-2.75 shrink-0 relative z-0' />
                    <div ref={desktopPublishSplitRef} className='hidden sm:flex shrink-0 min-w-fit relative z-1'>
                        <SplitActionButton
                            actions={publishSplitActions}
                            disabled={!isDesktopPublishSplitVisible}
                        />
                    </div>
                    <ContextToggle className='shrink-0' />
                </div>
            </Toolbar.Container>
        </Toolbar>
    );
};

ContentWizardToolbar.displayName = CONTENT_WIZARD_TOOLBAR_NAME;

export class ContentWizardToolbarElement
    extends LegacyElement<typeof ContentWizardToolbar, ContentWizardToolbarProps> {
    constructor(props: ContentWizardToolbarProps) {
        super({className: '', ...props}, ContentWizardToolbar);
    }
}
