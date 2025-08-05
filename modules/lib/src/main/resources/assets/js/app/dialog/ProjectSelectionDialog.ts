import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ProjectList} from '../project/list/ProjectList';
import {ProjectListItem} from '../project/list/ProjectListItem';
import {ProjectContext} from '../project/ProjectContext';
import {Project} from '../settings/data/project/Project';
import {ProjectHelper} from '../settings/data/project/ProjectHelper';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';

export class ProjectSelectionDialog
    extends ModalDialog {

    private static INSTANCE: ProjectSelectionDialog;

    private projectsList: ProjectList;

    private noItemsInfoBlock: H6El;

    private updateOnOpen: boolean = false;

    private constructor() {
        super({
            title: i18n('text.selectContext'),
            class: 'project-selection-dialog'
        });
    }

    static get(): ProjectSelectionDialog {
        if (!ProjectSelectionDialog.INSTANCE) {
            ProjectSelectionDialog.INSTANCE = new ProjectSelectionDialog();
        }

        return ProjectSelectionDialog.INSTANCE;
    }

    setProjects(projects: Project[]) {
        this.updateOnOpen = false;
        this.projectsList.setItems(projects);

        this.projectsList.getItemViews().forEach((itemView: ProjectListItem) => {
            itemView.onClicked((event: MouseEvent) => {
                if (!event.ctrlKey && !event.shiftKey) {
                    if (itemView.isSelectable()) {
                        ProjectContext.get().setProject(itemView.getProject());
                        this.close();
                    }

                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        });

        this.setLastProjectCycleOnTabEvent();
    }

    setUpdateOnOpen(value: boolean) {
        this.updateOnOpen = value;
    }

    protected initElements() {
        super.initElements();

        this.projectsList = new ProjectList();
        this.noItemsInfoBlock = new H6El('notification-dialog-text').setHtml(i18n('notify.settings.project.notInitialized'));
        this.noItemsInfoBlock.hide();
    }

    close() {
        super.close();

        if (!ProjectContext.get().isInitialized()) {
            const project: Project = this.getDefaultProject();

            if (project) {
                ProjectContext.get().setProject(project);
            } else {
                Body.get().addClass('no-projects');
                const noProjectsBlock: DivEl = new DivEl('no-projects-text').setHtml(i18n('notify.settings.project.notInitialized'));
                Body.get().appendChild(noProjectsBlock);
            }
        }
    }

    private getDefaultProject(): Project {
        return this.projectsList.getItems().filter(ProjectHelper.isAvailable)[0];
    }

    open() {
        if (!this.updateOnOpen) {
            this.showItems();
        } else {
            this.loadProjects();
        }

        super.open();
    }

    private loadProjects(): Q.Promise<void> {
        this.mask();

        return new ProjectListRequest(true).sendAndParse().then((projects: Project[]) => {
            this.setProjects(projects);
            this.showItems();
        }).catch(DefaultErrorHandler.handle).finally(() => {
            this.unmask();
        });
    }

    private showItems() {
        this.selectCurrentProject();

        const hasItems: boolean = this.projectsList.getItemCount() > 0;
        this.projectsList.setVisible(hasItems);
        this.noItemsInfoBlock.setVisible(!hasItems);
    }

    private selectCurrentProject() {
        const currentProjectName: string = ProjectContext.get().isInitialized() ? ProjectContext.get().getProject().getName() : null;

        if (currentProjectName) {
            this.projectsList.getItemViews().forEach((itemView: ProjectListItem) => {
                const isCurrentProject = itemView.getProject().getName() === currentProjectName;
                itemView.toggleClass('selected', isCurrentProject);
                if (isCurrentProject) {
                    itemView.whenRendered(() => setTimeout(() => itemView.giveFocus(), 100));
                }
            });
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToContentPanel(this.projectsList);
            this.appendChildToContentPanel(this.noItemsInfoBlock);

            return rendered;
        });
    }

    // Cycle to the first project element when tabbing in the last element
    private setLastProjectCycleOnTabEvent(): void {
        if (this.projectsList.getItemViews().length === 0) {
            return;
        }

        const firstProject: ProjectListItem =
            this.projectsList.getItemViews()[0] as ProjectListItem;

        const lastProject: ProjectListItem =
            this.projectsList.getItemViews()[this.projectsList.getItemViews().length - 1] as ProjectListItem;

        lastProject.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isTabKey(event) && !KeyHelper.isShiftKeyPressed(event)) {
                setTimeout(() => {
                    firstProject.giveFocus();
                }, 1);
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }

}
