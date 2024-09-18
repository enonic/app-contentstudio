import {Project} from '../../../../data/project/Project';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import * as Q from 'q';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ProjectsChainBlock} from './ProjectsChainBlock';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectOptionDataHelper} from './ProjectOptionDataHelper';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionView';
import {ProjectOptionDataLoader} from './ProjectOptionDataLoader';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ProjectsTreeRootList} from './ProjectsTreeRootList';

export interface ProjectsComboBoxOptions
    extends ListBoxInputOptions<Project> {
    loader: ProjectOptionDataLoader;
}

export class ProjectsSelector
    extends FilterableListBoxWrapperWithSelectedView<Project> {

    protected options: ProjectsComboBoxOptions;

    protected listBox: ProjectsTreeRootList;

    private readonly helper: ProjectOptionDataHelper;

    constructor(maximumOccurrences?: number) {
        const loader = new ProjectOptionDataLoader();
        const helper = new ProjectOptionDataHelper();
        const dropdownOptions: ProjectsComboBoxOptions = {
            loader: loader,
            maxSelected: maximumOccurrences,
            className: maximumOccurrences === 1 ? 'single-occurrence' : 'multiple-occurrence',
            selectedOptionsView: new ProjectSelectedOptionsView(),
        };

        const list = new ProjectsTreeRootList({helper: helper, loader: loader, className: 'projects-tree-list'});

        super(list, dropdownOptions);

        this.helper = helper;
    }

    protected initElements(): void {
        super.initElements();

        this.selectedOptionsView.setOccurrencesSortable(true);
        this.selectedOptionsView.setDraggable(true);
    }

    protected initListeners(): void {
        super.initListeners();

        this.onSelectionChanged((selectionChange: SelectionChange<Project>) => {
            if (selectionChange.selected?.length > 0) {
                this.getAllProjects().then((projects: Project[]) => {
                    const project: Project = selectionChange.selected[0];
                    const subName: string =
                        ProjectsChainBlock.buildProjectsChain(project.getName(), projects).map((p: Project) => p.getName()).join(' / ');

                    const view = this.selectedOptionsView.getSelectedOptions()[0].getOptionView() as ProjectSelectedOptionView;
                    view?.getNamesAndIconView().setSubName(subName);
                }).catch(DefaultErrorHandler.handle);
            }
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            this.listBox.search(event.getNewValue());
        });
    }

    private isSearchStringSet(): boolean {
        return !!this.options.loader.getSearchString();
    }

    updateAndSelectProjects(projects: Project[]) {
        if (!projects) {
            return;
        }

        this.deselectAll(true);
        this.select(projects);
    }

    getSelectedProjects(): Project[] {
        return this.getSelectedOptions().map((selectedOption) => selectedOption.getOption().getDisplayValue());
    }

    setDraggable(value: boolean): void {
        super.setDraggable(value);

        this.selectedOptionsView.setDraggable(value);
        this.selectedOptionsView.setOccurrencesSortable(value);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('projects-selector');

            return rendered;
        });
    }

    protected getDisplayValueId(value: Project): string {
        return value.getName();
    }

    private getAllProjects(): Q.Promise<Project[]> {
        if (this.options.loader.isLoaded()) {
            return Q(this.getLoadedResults());
        }

        return this.options.loader.load();
    }

    private getLoadedResults(): Project[] {
        return this.options.loader.getResults();
    }

    createSelectedOption(item: Project): Option<Project> {
        return Option.create<Project>()
            .setValue(item.getName())
            .setDisplayValue(item)
            .setExpandable(!this.isSearchStringSet() && this.helper.isExpandable(item))
            .setSelectable(this.helper.isSelectable(item))
            .build();
    }
}

class ProjectSelectedOptionView
    extends ProjectViewer
    implements SelectedOptionView<Project> {

    private option: Option<Project>;

    private dragControl: DivEl;

    constructor(option: Option<Project>) {
        super('selected-option');
        this.setOption(option);
        this.initElements();
    }

    setOption(option: Option<Project>) {
        this.option = option;
        this.setObject(option.getDisplayValue());
    }

    getOption(): Option<Project> {
        return this.option;
    }

    protected initElements(): void {
        this.dragControl = new DivEl('drag-control');
        this.appendChild(this.dragControl);

        this.setEditable(true);
        this.appendRemoveButton();
    }

    setDraggable(value: boolean): void {
        super.setDraggable(value);
        this.dragControl.setVisible(value);
    }
}

class ProjectSelectedOptionsView
    extends BaseSelectedOptionsView<Project> {

    createSelectedOption(option: Option<Project>): SelectedOption<Project> {
        const optionView: ProjectSelectedOptionView = new ProjectSelectedOptionView(option);

        if (!this.isDraggable()) {
            optionView.setDraggable(false);
        }

        return new SelectedOption<Project>(optionView, this.count());
    }
}

export class ParentProjectFormInputWrapper
    extends FormInputEl {

    private readonly projectSelector: ProjectsSelector;

    constructor(projectSelector: ProjectsSelector) {
        super('div', 'content-selector-wrapper');

        this.projectSelector = projectSelector;
        this.appendChild(projectSelector);
    }

    getSelector(): ProjectsSelector {
        return this.projectSelector;
    }

    getValue(): string {
        return this.projectSelector.getSelectedOptions()[0]?.getOption().getDisplayValue()?.getName() || '';
    }
}
