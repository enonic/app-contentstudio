import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Button, Dialog, Listbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {useMemo, useRef} from 'react';
import {ConfirmationDialog} from './ConfirmationDialog';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import {ProjectItem} from '../list/ProjectItem';
import {useI18n} from '../hooks/useI18n';
import {setActiveProject, $projects} from '../../../v6/features/store/projects.store';
import {flattenProjects} from '../../../v6/features/utils/projects';
import {ProjectWizardDialog} from '../../settings/dialog/project/create/ProjectWizardDialog';
import {ProjectSteps} from '../../settings/dialog/project/create/ProjectSteps';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {$dialogs, setProjectSelectionDialogOpen} from '../../../v6/features/store/dialogs.store';

export const ProjectSelectionDialog = (): ReactElement => {
    const {projects, activeProjectId} = useStore($projects);
    const {projectSelectionDialogOpen} = useStore($dialogs);

    const title = useI18n('text.selectContext');
    const noProjectsText = useI18n('notify.settings.project.notInitialized');
    const noProjectsAvailableText = useI18n('notify.settings.project.notAvailable');
    const createProjectLabel = useI18n('dialog.project.wizard.noProjects.action');

    const listRef = useRef<HTMLDivElement>(null);

    const flatProjects = useMemo(() => flattenProjects(projects), [projects]);
    const projectByName = useMemo(() => new Map(flatProjects.map(({project}) => [project.getName(), project])), [flatProjects]);

    // TODO: Enonic UI - Move auth data to store
    // It's currently okay, as authentication data is loaded from CONFIG and can be considered static
    const isAdmin = AuthHelper.isContentAdmin();
    const hasProjects = flatProjects.length > 0;

    return (
        <Dialog.Root open={projectSelectionDialogOpen} onOpenChange={setProjectSelectionDialogOpen}>
            <Dialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content
                    className="max-w-9/10 w-220 h-fit max-h-200"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        listRef.current?.focus();
                    }}
                >
                    <ConfirmationDialog.DefaultHeader title={title} withClose />

                    {!hasProjects ? (
                        <ConfirmationDialog.Body className="flex flex-col gap-4">
                            <p className="text-subtle">{isAdmin ? noProjectsText : noProjectsAvailableText}</p>
                            {isAdmin && (
                                <Dialog.Close asChild>
                                    <Button
                                        variant="solid"
                                        onClick={() => {
                                            new ProjectWizardDialog({
                                                steps: ProjectSteps.create(),
                                                title: i18n('dialog.project.wizard.title'),
                                            }).open();
                                        }}
                                    >
                                        {createProjectLabel}
                                    </Button>
                                </Dialog.Close>
                            )}
                        </ConfirmationDialog.Body>
                    ) : (
                        <ConfirmationDialog.Body className="p-0">
                            <Listbox.Root
                                selectionMode="single"
                                selection={activeProjectId ? [activeProjectId] : []}
                                defaultActive={activeProjectId}
                                onSelectionChange={selection => {
                                    const name = selection[0] ?? activeProjectId;
                                    const project = name ? projectByName.get(name) : undefined;
                                    if (project && ProjectHelper.isAvailable(project)) {
                                        setActiveProject(project);
                                        setProjectSelectionDialogOpen(false);
                                    }
                                }}
                            >
                                <Listbox.Content ref={listRef} className="gap-2.5 max-h-full max-w-full" aria-label={title}>
                                    {flatProjects.map(({project, level}) => (
                                        <Listbox.Item
                                            key={project.getName()}
                                            value={project.getName()}
                                            className="group max-w-full"
                                            style={{paddingInlineStart: level * 20}}
                                            data-tone={project.getName() === activeProjectId ? 'inverse' : undefined}
                                        >
                                            <ProjectItem
                                                className="w-full px-0 py-0"
                                                label={project.getDisplayName() || project.getName()}
                                                projectName={project.getName()}
                                                language={project.getLanguage()}
                                                hasIcon={!!project.getIcon()}
                                                isLayer={project.hasParents()}
                                            />
                                        </Listbox.Item>
                                    ))}
                                </Listbox.Content>
                            </Listbox.Root>
                        </ConfirmationDialog.Body>
                    )}
                </ConfirmationDialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

ProjectSelectionDialog.displayName = 'ProjectSelectionDialog';
