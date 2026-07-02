import { Button, cn, Dialog, Listbox } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { useMemo, useRef } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { selectProject, $projects } from '../../store/projects.store';
import { flattenProjects } from '../../../shared/lib/cms/projects/flattenProjects';
import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { $dialogs, setProjectSelectionDialogOpen } from '../../store/dialogs.store';
import { ProjectLabel } from '../project/ProjectLabel';
import { openCreateProjectDialog } from '../../store/dialogs/projectDialog.store';

const PROJECT_SELECTION_DIALOG_NAME = 'ProjectSelectionDialog';

export const ProjectSelectionDialog = (): ReactElement => {
    const { projects, activeProjectId } = useStore($projects, { keys: ['projects', 'activeProjectId'] });
    const { projectSelectionDialogOpen } = useStore($dialogs, { keys: ['projectSelectionDialogOpen'] });

    const title = useI18n('text.selectContext');
    const createProject = useI18n('settings.field.project.create');
    const getAccess = useI18n('settings.field.project.access');
    const noProjectsText = useI18n('notify.settings.project.notInitialized');
    const noProjectsAvailableText = useI18n('notify.settings.project.notAvailable');
    const createProjectLabel = useI18n('dialog.project.wizard.noProjects.action');

    const listRef = useRef<HTMLDivElement>(null);
    const createProjectRef = useRef<HTMLButtonElement>(null);

    const flatProjects = useMemo(() => flattenProjects(projects), [projects]);
    const projectByName = useMemo(
        () => new Map(flatProjects.map(({ project }) => [project.getName(), project])),
        [flatProjects],
    );
    const firstAvailableProjectId = useMemo(
        () => flatProjects.find(({ project }) => ProjectHelper.isAvailable(project))?.project.getName(),
        [flatProjects],
    );
    const hasAvailableProjects = firstAvailableProjectId != null;
    const hasActiveProject = activeProjectId != null;

    // TODO: Enonic UI - Move auth data to store
    // It's currently okay, as authentication data is loaded from CONFIG and can be considered static
    const isAdmin = AuthHelper.isContentAdmin();

    return (
        <Dialog.Root open={projectSelectionDialogOpen} onOpenChange={setProjectSelectionDialogOpen}>
            <Dialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content
                    className={cn(
                        'w-full h-full max-w-full max-h-full sm:w-auto sm:h-fit gap-7.5',
                        hasAvailableProjects ? 'md:max-w-180 md:max-h-[85vh] lg:max-w-220' : 'max-w-160',
                    )}
                    data-component={PROJECT_SELECTION_DIALOG_NAME}
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        if (hasAvailableProjects) {
                            listRef.current?.focus();
                        } else {
                            createProjectRef.current?.focus();
                        }
                    }}
                    onEscapeKeyDown={hasActiveProject ? undefined : (e) => e.preventDefault()}
                    onPointerDownOutside={hasActiveProject ? undefined : (e) => e.preventDefault()}
                >
                    <ConfirmationDialog.DefaultHeader
                        title={hasAvailableProjects ? title : isAdmin ? createProject : getAccess}
                        withClose={hasActiveProject}
                    />

                    {!hasAvailableProjects ? (
                        <ConfirmationDialog.Body className="flex flex-col gap-10 p-2 -m-2">
                            <p className="text-subtle">{isAdmin ? noProjectsAvailableText : noProjectsText}</p>
                            {isAdmin && (
                                <Dialog.Close asChild>
                                    <Button
                                        ref={createProjectRef}
                                        variant="solid"
                                        onClick={() => openCreateProjectDialog([])}
                                        label={createProjectLabel}
                                    />
                                </Dialog.Close>
                            )}
                        </ConfirmationDialog.Body>
                    ) : (
                        <ConfirmationDialog.Body className="p-0">
                            <Listbox.Root
                                selectionMode="single"
                                selection={hasActiveProject ? [activeProjectId] : []}
                                defaultActive={activeProjectId ?? firstAvailableProjectId}
                                onSelectionChange={(selection) => {
                                    const name = selection[0] ?? activeProjectId;
                                    const project = name ? projectByName.get(name) : undefined;
                                    if (project && ProjectHelper.isAvailable(project)) {
                                        selectProject(project);
                                        setProjectSelectionDialogOpen(false);
                                    }
                                }}
                            >
                                <Listbox.Content
                                    ref={listRef}
                                    className="gap-2.5 max-h-full max-w-full pb-10 items-stretch"
                                    aria-label={title}
                                >
                                    {flatProjects.map(({ project, level }) => {
                                        const isUnavailable = !ProjectHelper.isAvailable(project);

                                        return (
                                            <Listbox.Item
                                                key={project.getName()}
                                                value={project.getName()}
                                                className="group flex self-stretch w-full min-w-full px-2.5"
                                                style={{ paddingInlineStart: level * 20 + 10 }}
                                                data-tone={
                                                    project.getName() === activeProjectId ? 'inverse' : undefined
                                                }
                                            >
                                                <ProjectLabel
                                                    project={project}
                                                    className={cn('w-full px-0 py-1.25', isUnavailable && 'opacity-50')}
                                                />
                                            </Listbox.Item>
                                        );
                                    })}
                                </Listbox.Content>
                            </Listbox.Root>
                        </ConfirmationDialog.Body>
                    )}
                </ConfirmationDialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

ProjectSelectionDialog.displayName = PROJECT_SELECTION_DIALOG_NAME;
