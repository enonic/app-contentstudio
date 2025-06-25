import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {Avatar, Button, cn, IconButton, Toolbar, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ArrowLeft, Layers, Link2} from 'lucide-react';
import {type ReactElement} from 'react';
import {useBreakpoints} from '../../../hooks/useBreakpoints';
import {useI18n} from '../../../hooks/useI18n';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ProjectIcon} from '../../../shared/icons/ProjectIcon';
import {$wizardToolbar} from '../../../store/wizardToolbar.store';
import {getInitials} from '../../../utils/format/initials';
import {ActionGroup} from './ActionGroup';
import {ContextToggle} from './ContextToggle';
import {SplitActionButton, type SplitActionButtonAction} from './SplitActionButton';
import {ToolbarActionButton} from './ToolbarActionButton';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {StatusIcon} from '../../../shared/icons/StatusIcon';

export type ContentWizardToolbarViewProps = {
    onProjectBack?: () => void;
    onLayersClick?: () => void;
    onContentPathClick?: () => void;
    saveAction: Action;
    resetAction: Action;
    localizeAction: Action;
    archiveAction: Action;
    duplicateAction: Action;
    moveAction: Action;
    markAsReadyAction: Action;
    publishAction: Action;
    unpublishAction: Action;
    requestPublishAction: Action;
    openRequestAction: Action;
    createIssueAction: Action;

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
                                             markAsReadyAction,
                                             publishAction,
                                             unpublishAction,
                                             requestPublishAction,
                                             openRequestAction,
                                             createIssueAction,
                                         }: ContentWizardToolbarViewProps): ReactElement => {
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
        workflowStatus,
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
            'workflowStatus',
            'isLayerProject'
        ]
    });


    const bp = useBreakpoints();
    const layersLabel = useI18n('widget.layers.displayName');
    const toolbarLabel = useI18n('wcag.contenteditor.toolbar.label');
    const projectRoot = useI18n('field.root');
    const fieldPathLabel = useI18n('field.path');
    const pathLabel = `<${fieldPathLabel}>`;
    const projectViewLabel = projectLabel || projectRoot;
    const contentPathLabel = contentPath || pathLabel;

    const publishSplitActions: SplitActionButtonAction[] = [
        {action: markAsReadyAction},
        {action: publishAction},
        {action: unpublishAction},
        {action: requestPublishAction},
        {action: openRequestAction},
        {action: createIssueAction},
    ];
    const toolbarSplitActions: SplitActionButtonAction[] = [
        {action: saveAction},
        {action: resetAction},
        {action: localizeAction},
        {action: archiveAction},
        {action: duplicateAction},
        {action: moveAction},
    ];

    const mobileSplitActions: SplitActionButtonAction[] = [
        {action: saveAction},
        {action: resetAction},
        {action: localizeAction},
        {action: archiveAction},
        {action: duplicateAction},
        {action: moveAction},
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
                className={'w-full h-15 px-1 md:pl-2 md:pr-5 py-1.75 flex items-center gap-0 sm:gap-0.5 md:gap-1 lg:gap-2.5 border-b border-bdr-soft bg-surface-neutral'}
            >
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
                            className='size-6 sm:size-8 shrink-0 flex lg:hidden'/>
                        <span className='hidden lg:flex'>{projectViewLabel}</span>
                    </Button>
                </Toolbar.Item>
                <ActionGroup className='hidden 2xl:flex'>
                    <ToolbarActionButton action={saveAction} disabled={!bp.xxl}/>
                    <ToolbarActionButton action={resetAction} disabled={!bp.xxl}/>
                    <ToolbarActionButton action={localizeAction} disabled={!bp.xxl}/>
                    <ToolbarActionButton action={archiveAction} disabled={!bp.xxl}/>
                    <ToolbarActionButton action={duplicateAction} disabled={!bp.xxl}/>
                    <ToolbarActionButton action={moveAction} disabled={!bp.xxl}/>
                </ActionGroup>
                <SplitActionButton
                    actions={toolbarSplitActions}
                    className='hidden sm:flex 2xl:hidden'
                    disabled={!bp.sm || bp.xxl}
                />
                <div className='flex-1 min-w-0 flex items-center justify-center sm:justify-center px-0 sm:px-2'>
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
                    {workflowStatus && (
                        <StatusIcon status={workflowStatus} className='size-3.5 my-auto mx-1.5 md:mx-2.75 shrink-0'/>
                    )}
                    <Toolbar.Item asChild disabled={!bp.sm}>
                        <Button
                            size='sm'
                            variant='text'
                            className={cn('hidden sm:inline-flex min-w-0 max-w-full px-1.5 md:px-2.75',
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
                    <Toolbar.Item asChild disabled={bp.sm}>
                        <IconButton
                            size='md'
                            icon={Link2}
                            aria-label={contentPathLabel}
                            title={contentPathLabel}
                            disabled={!canRenameContentPath}
                            onClick={onContentPathClick}
                            className={cn('sm:hidden shrink-0 size-8', !isPathAvailable && 'text-error')}
                        />
                    </Toolbar.Item>
                </div>
                {collaborators.length > 0 && (
                    <div className='-space-x-2 items-center px-3.5 hidden sm:flex'>
                        {collaborators[0] && (
                            <Tooltip key={collaborators[0].key} value={collaborators[0].label}>
                                <Avatar className={cn('ring-2 ring-surface-neutral', collaborators[0].isCurrent && 'ring-info')}>
                                    <Avatar.Fallback className='text-alt font-semibold'>
                                        <span>{getInitials(collaborators[0].label)}</span>
                                    </Avatar.Fallback>
                                </Avatar>
                            </Tooltip>
                        )}

                        {collaborators[1] && (
                            <Tooltip key={collaborators[1].key} value={collaborators[1].label}>
                                <Avatar className={cn('hidden xl:inline-flex ring-2 ring-surface-neutral z-10',
                         collaborators[1].isCurrent && 'ring-info')}>
                                    <Avatar.Fallback className='text-alt font-semibold'>
                                        <span>{getInitials(collaborators[1].label)}</span>
                                    </Avatar.Fallback>
                                </Avatar>
                            </Tooltip>
                        )}

                        {collaborators.length > 1 && (
                            <Avatar className='xl:hidden ring-2 ring-surface-neutral text-alt font-semibold'>
                                <Avatar.Fallback>
                                    <span>+{collaborators.length - 1}</span>
                                </Avatar.Fallback>
                            </Avatar>
                        )}

                        {collaborators.length > 2 && (
                            <Avatar className='hidden xl:inline-flex ring-2 ring-surface-neutral text-alt font-semibold'>
                                <Avatar.Fallback>
                                    <span>+{collaborators.length - 2}</span>
                                </Avatar.Fallback>
                            </Avatar>
                        )}
                    </div>
                )}
                <StatusBadge status={publishStatus} className='my-auto px-1.5 md:px-2.75'/>
                <SplitActionButton actions={publishSplitActions} className='hidden sm:flex' disabled={!bp.sm}/>
                <SplitActionButton actions={mobileSplitActions} className='sm:hidden' disabled={bp.sm}/>
                <ContextToggle className='shrink-0'/>
            </Toolbar.Container>
        </Toolbar>
    );
};

ContentWizardToolbar.displayName = CONTENT_WIZARD_TOOLBAR_NAME;

export class ContentWizardToolbarElement
    extends LegacyElement<typeof ContentWizardToolbar, ContentWizardToolbarViewProps> {
    constructor(props: ContentWizardToolbarViewProps) {
        super(props, ContentWizardToolbar);
    }
}
