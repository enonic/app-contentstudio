import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Listbox} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useMemo, useRef} from 'react';
import {ConfirmationDialog} from './ConfirmationDialog';
import {Project} from '../../settings/data/project/Project';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import {ProjectContext} from '../../project/ProjectContext';
import {ProjectListRequest} from '../../settings/resource/ProjectListRequest';
import {ProjectItem} from '../list/ProjectItem';

type ProjectSelectionDialogProps = {
    open?: boolean;
    projects: Project[];
    currentProjectName?: string;
    onSelect: (project: Project) => void;
    onClose: () => void;
};

function ProjectSelectionDialogUI({
                                      open = false,
                                      projects,
                                      currentProjectName,
                                      onSelect,
                                      onClose,
                                  }: ProjectSelectionDialogProps): ReactElement {
    const title = i18n('text.selectContext');
    const noProjectsText = i18n('notify.settings.project.notInitialized');

    const listRef = useRef<HTMLDivElement>(null);

    const sortedProjects = useMemo(() => [...projects].sort(ProjectHelper.sortProjects), [projects]);

    return (
        <ConfirmationDialog.Root open={open} onOpenChange={(next) => {
            if (!next) {
                onClose();
            }
        }}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay/>
                <ConfirmationDialog.Content
                    className='max-w-9/10 w-220 h-fit max-h-200'
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        listRef.current?.focus();
                    }}
                >
                    <ConfirmationDialog.DefaultHeader title={title} withClose/>

                    {sortedProjects.length === 0 ? (
                        <ConfirmationDialog.Body>
                            <p className='text-subtle'>{noProjectsText}</p>
                        </ConfirmationDialog.Body>
                    ) : (
                         <ConfirmationDialog.Body className='p-0'>
                             <Listbox.Root
                                 selectionMode='single'
                                 selection={currentProjectName ? [currentProjectName] : []}
                                 defaultActive={currentProjectName}
                                 onSelectionChange={(sel) => {
                                     const name = sel[0] ?? currentProjectName;
                                     const proj = sortedProjects.find((p) => p.getName() === name);
                                     if (proj && ProjectHelper.isAvailable(proj)) {
                                         onSelect(proj);
                                     }
                                 }}
                             >
                                 <Listbox.Content ref={listRef} className='gap-2.5 max-h-full' aria-label={title}>
                                     {sortedProjects.map((project) => (
                                         <Listbox.Item
                                             key={project.getName()}
                                             value={project.getName()}
                                             className='group'
                                             data-tone={project.getName() === currentProjectName ? 'inverse' : undefined}
                                         >
                                             <ProjectItem
                                                 className='w-full px-0 py-0'
                                                 label={project.getDisplayName() || project.getName()}
                                                 projectName={project.getName()}
                                                 language={project.getLanguage()}
                                                 hasIcon={!!project.getIcon()}
                                             />
                                         </Listbox.Item>
                                     ))}
                                </Listbox.Content>
                            </Listbox.Root>
                         </ConfirmationDialog.Body>
                     )}
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
}

ProjectSelectionDialogUI.displayName = 'ProjectSelectionDialogUI';

export class ProjectSelectionDialog
    extends LegacyElement<typeof ProjectSelectionDialogUI, ProjectSelectionDialogProps> {

    private static INSTANCE: ProjectSelectionDialog;
    private updateOnOpen = false;

    private constructor() {
        super(
            {
                open: false,
                projects: [],
                currentProjectName: undefined,
                onSelect: (project) => {
                    ProjectContext.get().setProject(project);
                    this.setProps({open: false});
                },
                onClose: () => {
                    this.setProps({open: false});
                    this.handleCloseFallback();
                },
            },
            ProjectSelectionDialogUI,
        );
    }

    static get(): ProjectSelectionDialog {
        if (!ProjectSelectionDialog.INSTANCE) {
            ProjectSelectionDialog.INSTANCE = new ProjectSelectionDialog();
        }
        return ProjectSelectionDialog.INSTANCE;
    }

    setProjects(projects: Project[]): void {
        this.updateOnOpen = false;
        this.setProps({projects});
    }

    setUpdateOnOpen(value: boolean): void {
        this.updateOnOpen = value;
    }

    open(): void {
        const currentName = ProjectContext.get().isInitialized()
                            ? ProjectContext.get().getProject().getName()
                            : undefined;

        const doOpen = (projects: Project[]): void => {
            this.setProps({projects, currentProjectName: currentName, open: true});
            Body.get().appendChild(this);
        };

        if (this.updateOnOpen) {
            new ProjectListRequest(true)
                .sendAndParse()
                .then((projects: Project[]) => doOpen(projects))
                .catch(DefaultErrorHandler.handle);
        } else {
            doOpen(this.props.get().projects ?? []);
        }
    }

    close(): void {
        this.setProps({open: false});
        this.handleCloseFallback();
    }

    private handleCloseFallback(): void {
        if (!ProjectContext.get().isInitialized()) {
            const projects = this.props.get().projects ?? [];
            const defaultProject = projects.find(ProjectHelper.isAvailable);
            if (defaultProject) {
                ProjectContext.get().setProject(defaultProject);
            } else {
                Body.get().addClass('no-projects');
                const noProjectsBlock: DivEl = new DivEl('no-projects-text').setHtml(i18n('notify.settings.project.notInitialized'));
                Body.get().appendChild(noProjectsBlock);
            }
        }
    }
}
