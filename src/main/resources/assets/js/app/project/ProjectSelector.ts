import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {DropdownHandle} from 'lib-admin-ui/ui/button/DropdownHandle';
import {KeyBinding, KeyBindingAction} from 'lib-admin-ui/ui/KeyBinding';
import {Element} from 'lib-admin-ui/dom/Element';
import {ProjectContext} from './ProjectContext';
import {ProjectChangedEvent} from './ProjectChangedEvent';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {Body} from 'lib-admin-ui/dom/Body';
import {Project} from '../settings/data/project/Project';
import {SelectableProjectList} from './list/SelectableProjectList';
import {ProjectListItem} from './list/ProjectListItem';
import {SelectedProjectListItemViewer} from './list/SelectedProjectListItemViewer';
import {ProjectDeletedEvent} from '../settings/event/ProjectDeletedEvent';

export class ProjectSelector
    extends DivEl {

    private headerProjectViewer: SelectedProjectListItemViewer;

    private projectList: SelectableProjectList;

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

    setProjects(projects: Project[]) {
        const currentProjectName: string = ProjectContext.get().getProject();
        const currentProject: Project = projects.filter((project: Project) => project.getName() === currentProjectName)[0];

        this.headerProjectViewer.setObject(currentProject);

        this.projectList.setItems(projects);
        this.projectList.preSelectProject(currentProject);

        this.toggleDropdownHandleVisibility();
    }

    private toggleDropdownHandleVisibility() {
        const totalProjects: number = this.projectList.getItemCount();
        this.dropdownHandle.setVisible(totalProjects > 1);
        this.toggleClass('single-repo', totalProjects < 2);
        this.getEl().setTitle(totalProjects > 1 ? i18n('text.selectContext') : '');
    }

    setHeaderPrefix(value: string) {
        this.headerProjectViewer.setPrefix(value);
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const header: DivEl = new DivEl('selected-project-view');
            header.appendChild(this.headerProjectViewer);
            header.appendChild(this.dropdownHandle);
            this.appendChildren(
                header,
                this.projectList
            );

            this.dropdownHandle.up();
            this.dropdownHandle.hide();
            this.projectList.hide();

            return rendered;
        });
    }

    private initElements() {
        this.headerProjectViewer = new SelectedProjectListItemViewer();
        this.dropdownHandle = this.focusedElement = new DropdownHandle();
        this.projectList = new SelectableProjectList();
        this.clickOutsideListener = this.createClickOutsideListener();
    }

    private initListeners() {
        this.headerProjectViewer.onClicked((event: MouseEvent) => {
            this.toggleProjectsListShown();
        });

        this.dropdownHandle.onClicked((event: MouseEvent) => {
            this.toggleProjectsListShown();
        });

        ProjectChangedEvent.on(() => {
            this.headerProjectViewer.setObject(this.projectList.getItem(ProjectContext.get().getProject()));
        });

        this.dropdownHandle.onFocus(() => {
            this.focusedElement = this.dropdownHandle;
        });

        this.projectList.onFocusChanged((listItem: ProjectListItem) => {
            this.focusedElement = listItem;
        });

        this.projectList.onSelectionChanged((project: ProjectListItem) => {
            this.handleSelectedProjectChanged(project);
        });

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            const itemToRemove: Project = this.projectList.getItem(event.getProjectName());
            if (itemToRemove) {
                this.projectList.removeItem(itemToRemove);
                this.toggleDropdownHandleVisibility();
            }
        });
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

    private toggleProjectsListShown() {
        if (this.projectList.getItemCount() < 2) {
            return;
        }

        if (this.isProjectsListShown) {
            this.hideProjectsList();
        } else {
            this.showProjectsList();
        }
    }

    private focusNextItem() {
        if (this.focusedElement === this.dropdownHandle) {
            this.projectList.getFirstChild().giveFocus();
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
            this.projectList.getLastChild().giveFocus();
        } else {
            const previousElement: Element = this.focusedElement.getPreviousElement();
            if (previousElement) {
                previousElement.giveFocus();
            } else {
                this.dropdownHandle.giveFocus();
            }
        }
    }

    private handleShiftTabPressed() {
        if (this.focusedElement === this.dropdownHandle) {
            this.hideProjectsList();
        }
    }

    private handleTabPressed() {
        if (this.focusedElement === this.projectList.getLastChild()) {
            this.hideProjectsList();
        }
    }

    private handleEnterPressed() {
        if (ObjectHelper.iFrameSafeInstanceOf(this.focusedElement, ProjectListItem)) {
            this.projectList.selectListItem(<ProjectListItem>this.focusedElement);
        }
    }

    private handleSelectedProjectChanged(item: ProjectListItem) {
        if (item.getProject().getName() !== ProjectContext.get().getProject()) {
            ProjectContext.get().setProject(item.getProject().getName());
        }

        this.hideProjectsList();
        this.dropdownHandle.giveFocus();
    }

    private showProjectsList() {
        this.addClass('open');
        Body.get().onMouseDown(this.clickOutsideListener);
        this.getEl().setTitle('');
        this.isProjectsListShown = true;
        this.dropdownHandle.down();
        this.projectList.show();
        KeyBindings.get().shelveBindings();
        this.bindKeys();
    }

    private bindKeys() {
        KeyBindings.get().bindKeys(this.keyBindings);
    }

    private hideProjectsList() {
        this.removeClass('open');
        this.getEl().setTitle(i18n('text.selectContext'));
        Body.get().unMouseDown(this.clickOutsideListener);
        this.isProjectsListShown = false;
        this.dropdownHandle.up();
        this.projectList.hide();
        this.unBindKeys();
        KeyBindings.get().unshelveBindings();
    }

    private unBindKeys() {
        KeyBindings.get().unbindKeys(this.keyBindings);
    }
}
