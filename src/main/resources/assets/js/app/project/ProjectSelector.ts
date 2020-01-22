import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {DropdownHandle} from 'lib-admin-ui/ui/button/DropdownHandle';
import {KeyBinding, KeyBindingAction} from 'lib-admin-ui/ui/KeyBinding';
import {ProjectItemViewer} from '../settings/data/viewer/ProjectItemViewer';
import {Element} from 'lib-admin-ui/dom/Element';
import {ProjectItem} from '../settings/data/ProjectItem';
import {ProjectContext} from './ProjectContext';
import {ProjectChangedEvent} from './ProjectChangedEvent';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {Body} from 'lib-admin-ui/dom/Body';
import {ProjectsList, ProjectsListItem} from './ProjectsList';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ProjectSelector
    extends DivEl {

    private headerProjectViewer: ProjectItemViewer;

    private projectsList: SelectableProjectsList;

    private dropdownHandle: DropdownHandle;

    private isProjectsListShown: boolean = false;

    private clickOutsideListener: (event: MouseEvent) => void;

    private keyBindings: KeyBinding[];

    private focusedElement: Element;

    constructor() {
        super('project-selector');

        this.initElements();
        this.initListeners();
        this.initKeyBindings();
    }

    private initElements() {
        this.headerProjectViewer = new ProjectItemViewer();
        this.dropdownHandle = this.focusedElement = new DropdownHandle();
        this.projectsList = new SelectableProjectsList();
        this.clickOutsideListener = this.createClickOutsideListener();
    }

    private createClickOutsideListener() {
        return (event: MouseEvent) => {
            if (this.isVisible()) {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.getHTMLElement()) {
                        return;
                    }
                }

                if (this.isProjectsListShown) {
                    this.hideProjectsList();
                    this.dropdownHandle.giveFocus();
                }
            }
        };
    }

    setProjects(projects: ProjectItem[]) {
        const currentProjectName: string = ProjectContext.get().getProject();
        const currentProject: ProjectItem = projects.filter((project: ProjectItem) => project.getName() === currentProjectName)[0];
        this.headerProjectViewer.setObject(currentProject);

        this.projectsList.setItems(projects);
        this.projectsList.preSelectProject(currentProject);

        this.projectsList.onSelectionChanged((project: ProjectItem) => {
            this.handleSelectedProjectChanged(project);
        });

        this.dropdownHandle.setVisible(projects.length > 1);
        this.toggleClass('single-repo', projects.length < 2);
    }

    private initListeners() {
        this.headerProjectViewer.onClicked((event: MouseEvent) => {
            this.toggleProjectsListShown();
        });

        this.dropdownHandle.onClicked((event: MouseEvent) => {
            this.toggleProjectsListShown();
        });

        ProjectChangedEvent.on(() => {
            this.headerProjectViewer.setObject(this.projectsList.getItem(ProjectContext.get().getProject()));
        });

        this.dropdownHandle.onFocus(() => {
            this.focusedElement = this.dropdownHandle;
        });

        this.projectsList.onFocusChanged((listItem: ProjectsListItem) => {
            this.focusedElement = listItem;
        });
    }

    private toggleProjectsListShown() {
        if (this.projectsList.getItemCount() < 2) {
            return;
        }

        if (this.isProjectsListShown) {
            this.hideProjectsList();
        } else {
            this.showProjectsList();
        }
    }

    private initKeyBindings() {
        this.keyBindings = [
            new KeyBinding('esc', () => {
                this.hideProjectsList();
                this.dropdownHandle.giveFocus();
            }).setGlobal(true),
            new KeyBinding('up', () => {
                this.focusPreviousItem();
            }).setGlobal(true),
            new KeyBinding('down', () => {
                this.focusNextItem();
            }).setGlobal(true),
            new KeyBinding('tab', () => {
                this.handleTabPressed();
            }).setGlobal(true),
            new KeyBinding('shift+tab', () => {
                this.handleShiftTabPressed();
            }).setGlobal(true),
            new KeyBinding('enter', () => {
                this.handleEnterPressed();
            }, KeyBindingAction.KEYUP).setGlobal(true)
        ];
    }

    private focusNextItem() {
        if (this.focusedElement === this.dropdownHandle) {
            this.projectsList.getFirstChild().giveFocus();
        } else {
            const nextElement: Element = this.focusedElement.getNextElement();
            if (nextElement) {
                nextElement.giveFocus();
            } else {
                this.dropdownHandle.giveFocus();
            }
        }
    }

    private focusPreviousItem() {
        if (this.focusedElement === this.dropdownHandle) {
            this.projectsList.getLastChild().giveFocus();
        } else {
            const previousElement: Element = this.focusedElement.getPreviousElement();
            if (previousElement) {
                previousElement.giveFocus();
            } else {
                this.dropdownHandle.giveFocus();
            }
        }
    }

    private handleTabPressed() {
        if (this.focusedElement === this.projectsList.getLastChild()) {
            this.hideProjectsList();
        }
    }

    private handleShiftTabPressed() {
        if (this.focusedElement === this.dropdownHandle) {
            this.hideProjectsList();
        }
    }

    private handleEnterPressed() {
        if (ObjectHelper.iFrameSafeInstanceOf(this.focusedElement, ProjectsListItem)) {
            this.projectsList.selectListItem(<ProjectsListItem>this.focusedElement);
        }
    }

    private handleSelectedProjectChanged(project: ProjectItem) {
        if (project.getName() !== ProjectContext.get().getProject()) {
            ProjectContext.get().setProject(project.getName());
        }

        this.hideProjectsList();
        this.dropdownHandle.giveFocus();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const header: DivEl = new DivEl('selected-project-view');
            header.appendChild(new SpanEl('label').setHtml(i18n('settings.items.type.project')));
            header.appendChild(this.headerProjectViewer);
            header.appendChild(this.dropdownHandle);
            this.appendChildren(
                header,
                this.projectsList
            );

            this.dropdownHandle.up();
            this.projectsList.hide();

            return rendered;
        });
    }

    private showProjectsList() {
        this.addClass('open');
        KeyBindings.get().shelveBindings();
        Body.get().onMouseDown(this.clickOutsideListener);
        this.isProjectsListShown = true;
        this.dropdownHandle.down();
        this.projectsList.show();
        this.bindKeys();
    }

    private bindKeys() {
        KeyBindings.get().bindKeys(this.keyBindings);
    }

    private hideProjectsList() {
        this.removeClass('open');
        KeyBindings.get().unshelveBindings();
        Body.get().unMouseDown(this.clickOutsideListener);
        this.isProjectsListShown = false;
        this.dropdownHandle.up();
        this.projectsList.hide();
        this.unBindKeys();
    }

    private unBindKeys() {
        KeyBindings.get().unbindKeys(this.keyBindings);
    }
}

class SelectableProjectsList
    extends ProjectsList {

    private selectedListItem: ProjectsListItem;

    private selectionChangedListeners: { (project: ProjectItem): void } [] = [];

    private focusChangedListeners: { (listItem: ProjectsListItem): void } [] = [];

    protected createItemView(item: ProjectItem, readOnly: boolean): ProjectsListItem {
        const projectsListItem: ProjectsListItem = super.createItemView(item, readOnly);

        projectsListItem.onClicked(() => {
            this.selectListItem(projectsListItem);
        });

        projectsListItem.onFocus(() => {
            this.notifyFocusChanged(projectsListItem);
        });

        projectsListItem.getEl().setTabIndex(0);

        return projectsListItem;
    }

    selectListItem(projectsListItem: ProjectsListItem) {
        if (projectsListItem === this.selectedListItem) {
            return;
        }

        this.selectedListItem.removeClass('selected');
        projectsListItem.addClass('selected');
        this.selectedListItem = projectsListItem;

        this.notifySelectionChanged();
    }

    preSelectProject(project: ProjectItem) {
        this.getItemViews().some((view: ProjectsListItem) => {
            if (view.getProject().equals(project)) {
                view.addClass('selected');
                this.selectedListItem = view;
                return true;
            }

            return false;
        });
    }

    onSelectionChanged(listener: (project: ProjectItem) => void) {
        this.selectionChangedListeners.push(listener);
    }

    private notifySelectionChanged() {
        this.selectionChangedListeners.forEach((listener) => {
            listener(this.selectedListItem.getProject());
        });
    }

    onFocusChanged(listener: (listItem: ProjectsListItem) => void) {
        this.focusChangedListeners.push(listener);
    }

    private notifyFocusChanged(listItem: ProjectsListItem) {
        this.focusChangedListeners.forEach((listener) => {
            listener(listItem);
        });
    }

}
