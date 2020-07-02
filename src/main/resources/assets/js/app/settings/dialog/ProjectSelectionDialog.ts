import {ModalDialog} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Project} from '../data/project/Project';
import {ProjectList} from '../../project/list/ProjectList';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ProjectListItem} from '../../project/list/ProjectListItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ProjectListRequest} from '../resource/ProjectListRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import * as Q from 'q';

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
            itemView.onClicked(() => {
                ProjectContext.get().setProject(itemView.getProject().getName());
                this.close();
            });
        });
    }

    setUpdateOnOpen(value: boolean) {
        this.updateOnOpen = value;
    }

    protected initElements() {
        super.initElements();

        this.projectsList = new ProjectList();
        this.noItemsInfoBlock = new H6El('notification-dialog-text').setHtml(i18n('notify.settings.project.notInitialized'));
    }

    close() {
        super.close();

        if (!ProjectContext.get().isInitialized()) {
            this.setDefaultProject();
        }
    }

    private setDefaultProject() {
        const defaultProject: Project = this.projectsList.getItemCount() > 0 ? this.projectsList.getItems()[0] : null;

        if (defaultProject) {
            ProjectContext.get().setProject(defaultProject.getName());
        }
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

        return new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
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
        const currentProject: string = ProjectContext.get().isInitialized() ? ProjectContext.get().getProject() : null;

        if (currentProject) {
            this.projectsList.getItemViews().forEach((itemView: ProjectListItem) => {
                itemView.toggleClass('selected', itemView.getProject().getName() === currentProject);
            });
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
                this.appendChildToContentPanel(this.projectsList);
                this.appendChildToContentPanel(this.noItemsInfoBlock);
                this.noItemsInfoBlock.hide();

            return rendered;
        });
    }

}
