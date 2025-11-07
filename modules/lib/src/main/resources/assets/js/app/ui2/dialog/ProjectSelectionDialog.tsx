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

type FlatProject = {project: Project; level: number};

function flattenProjects(projects: Project[]): FlatProject[] {
    if (projects.length === 0) {
        return [];
    }

    const sortedProjects = [...projects].sort(ProjectHelper.sortProjects);
    const projectByName = new Map(sortedProjects.map((project) => [project.getName(), project]));
    const levelByName = new Map<string, number>();
    const parentNameByProject = new Map<string, string | undefined>();

    const resolveParentName = (project: Project): string | undefined => {
        const name = project.getName();
        if (parentNameByProject.has(name)) {
            return parentNameByProject.get(name);
        }

        const parents = project.getParents() ?? [];
        const parentName = parents.find((candidate) => project.hasMainParentByName(candidate) && projectByName.has(candidate));
        parentNameByProject.set(name, parentName);
        return parentName;
    };

    const calcLevel = (project: Project): number => {
        const name = project.getName();
        const cached = levelByName.get(name);
        if (cached !== undefined) {
            return cached;
        }

        const parentName = resolveParentName(project);
        const parent = parentName ? projectByName.get(parentName) : undefined;
        const level = parent ? calcLevel(parent) + 1 : 0;
        levelByName.set(name, level);
        return level;
    };

    const childrenByName = new Map<string, Project[]>();
    sortedProjects.forEach((project) => {
        const parentName = resolveParentName(project);
        if (!parentName) {
            return;
        }
        const siblings = childrenByName.get(parentName);
        if (siblings) {
            siblings.push(project);
        } else {
            childrenByName.set(parentName, [project]);
        }
    });

    const ordered: FlatProject[] = [];
    const visit = (project: Project): void => {
        ordered.push({project, level: calcLevel(project)});
        (childrenByName.get(project.getName()) ?? []).forEach(visit);
    };

    sortedProjects.filter((project) => calcLevel(project) === 0).forEach(visit);

    return ordered;
}

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

    const flatProjects = useMemo(() => flattenProjects(projects), [projects]);
    const projectByName = useMemo(() => new Map(flatProjects.map(({project}) => [project.getName(), project])), [flatProjects]);

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

                    {flatProjects.length === 0 ? (
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
                                     const project = name ? projectByName.get(name) : undefined;
                                     if (project && ProjectHelper.isAvailable(project)) {
                                         onSelect(project);
                                     }
                                 }}
                             >
                                 <Listbox.Content ref={listRef} className='gap-2.5 max-h-full max-w-full' aria-label={title}>
                                     {flatProjects.map(({project, level}) => (
                                         <Listbox.Item
                                             key={project.getName()}
                                             value={project.getName()}
                                             className="group max-w-full"
                                             style={{paddingInlineStart: level * 20}}
                                             data-tone={project.getName() === currentProjectName ? 'inverse' : undefined}
                                         >
                                             <ProjectItem
                                                 className='w-full px-0 py-0'
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
