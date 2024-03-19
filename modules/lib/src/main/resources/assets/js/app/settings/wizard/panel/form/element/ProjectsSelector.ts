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
import {ProjectsTreeList} from './ProjectsTreeList';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export interface ProjectsComboBoxOptions
    extends ListBoxInputOptions<Project> {
    loader: ProjectOptionDataLoader;
}

export class ProjectsSelector
    extends FilterableListBoxWrapperWithSelectedView<Project> {

    protected options: ProjectsComboBoxOptions;

    protected listBox: ProjectsTreeList;

    private readonly helper: ProjectOptionDataHelper;

    private readonly loader: ProjectOptionDataLoader;

    constructor(maximumOccurrences?: number) {
        const loader = new ProjectOptionDataLoader();
        const helper = new ProjectOptionDataHelper();
        const dropdownOptions: ProjectsComboBoxOptions = {
            loader: loader,
            maxSelected: maximumOccurrences,
            className: maximumOccurrences === 1 ? 'single-occurrence' : 'multiple-occurrence',
            selectedOptionsView: new ProjectSelectedOptionsView(),
        };

        const list = new ProjectsTreeList({helper: helper, loader: loader, className: 'projects-tree-list'});

        super(list, dropdownOptions);

        this.helper = helper;
        this.loader = loader;
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('parent-project-selector');

            return rendered;
        });
    }

    private updateProject(project: Project) {
        if (!project) {
            return;
        }

        const newOption: Option<Project> = this.createOption(project);
        const existingOption: Option<Project> = this.getOptionByValue(project.getName());

        const wasChanged = !project.equals(existingOption?.getDisplayValue());
        if (!wasChanged) {
            return;
        }

        if (existingOption) {
            this.updateOption(existingOption, project);
        } else {
            this.addOption(newOption);
        }

        this.getSelectedOptions().forEach((selectedOption: SelectedOption<Project>) => {
            if (selectedOption.getOption().getValue() === project.getName()) {
                selectedOption.getOptionView().setOption(newOption);
            }
        });
    }

    updateAndSelectProjects(projects: Project[]) {
        if (!projects) {
            return;
        }

        const projectValues = projects.map(p => p.getName());

        projects.forEach(p => this.updateProject(p));

        this.getOptions().forEach(option => {
            const value = option.getValue();

            const mustSelect = projectValues.indexOf(value) >= 0 && !this.isSelected(option.getDisplayValue());
            if (mustSelect) {
                this.selectOption(option);
                return;
            }

            const mustDeselect = projectValues.indexOf(value) < 0 && this.isSelected(option.getDisplayValue());
            if (mustDeselect) {
                this.deselect(option.getDisplayValue());
            }
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
        const dragControl = new DivEl('drag-control');
        this.appendChild(dragControl);

        this.setEditable(true);
        this.appendRemoveButton();
    }
}

class ProjectSelectedOptionsView
    extends BaseSelectedOptionsView<Project> {

    createSelectedOption(option: Option<Project>): SelectedOption<Project> {
        const optionView: ProjectSelectedOptionView = new ProjectSelectedOptionView(option);
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
