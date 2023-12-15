import * as Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Project} from '../../../../data/project/Project';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ProjectOptionDataHelper} from './ProjectOptionDataHelper';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ComboBoxConfig} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBox';
import {ProjectOptionDataLoader} from './ProjectOptionDataLoader';
import {SelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionView';

export class ProjectsSelector
    extends RichComboBox<Project> {

    private readonly helper: ProjectOptionDataHelper;

    constructor(builder = new ProjectsDropdownBuilder()) {
        super(builder);

        this.helper = builder.optionDataHelper;

        this.initListeners();

        this.addClass('projects-selector');
    }

    private initListeners(): void {
        const loader: ProjectOptionDataLoader = this.getLoader() as ProjectOptionDataLoader;

        loader.onLoadedData(() => {
            this.helper.setProjects(this.getLoadedResults());

            const isFlat = this.isFlatList();
            this.toggleClass('flat', isFlat);
            loader.notifyModeChange(!isFlat);

            this.updateSortable();

            return Q.resolve();
        });

        this.onOptionSelected(() => this.updateSortable());
        this.onOptionDeselected(() => this.updateSortable());
    }

    protected getSelectedOptionsView(): ProjectSelectedOptionsView {
        return this.getSelectedOptionView() as ProjectSelectedOptionsView;
    }

    private updateSortable(): void {
        const isSortable = this.countSelected() > 1;
        const wasSortable = this.getSelectedOptionsView().hasClass('sortable');

        if (wasSortable === isSortable) {
            return;
        }

        this.toggleClass('multiple-occurrence', isSortable);
        this.toggleClass('single-occurrence', !isSortable);

        this.getSelectedOptionsView().setOccurrencesSortable(isSortable);
    }

    private isFlatList(): boolean {
        return this.isSearchStringSet() || !this.getLoadedResults().some((p: Project) => this.helper.isExpandable(p));
    }

    protected createOption(project: Project): Option<Project> {
        return Option.create<Project>()
            .setValue(project.getName())
            .setDisplayValue(project)
            .setExpandable(!this.isSearchStringSet() && this.helper.isExpandable(project))
            .setSelectable(this.helper.isSelectable(project))
            .build();
    }

    private isSearchStringSet(): boolean {
        return !!this.getLoader().getSearchString();
    }

    protected createOptions(items: Project[]): Q.Promise<Option<Project>[]> {
        this.helper.setProjects(items);
        const result: Project[] = this.isSearchStringSet() ? items : items.filter((item: Project) => !item.hasParents());
        return super.createOptions(result);
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
        if (this.getLoader().isLoaded()) {
            return Q(this.getLoadedResults());
        }

        return this.getLoader().load();
    }

    private getLoadedResults(): Project[] {
        return this.getLoader().getResults();
    }

    protected createComboboxConfig(builder: RichComboBoxBuilder<Project>): ComboBoxConfig<Project> {
        const config: ComboBoxConfig<Project> = super.createComboboxConfig(builder);
        config.treegridDropdownAllowed = true;

        return config;
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

export class ProjectsDropdownBuilder extends RichComboBoxBuilder<Project> {

    comboBoxName: string = 'projectSelector';

    optionDisplayValueViewer: ProjectViewer =  new ProjectViewer();

    optionDataHelper: ProjectOptionDataHelper = new ProjectOptionDataHelper();

    loader: ProjectOptionDataLoader = new ProjectOptionDataLoader();

    selectedOptionsView: ProjectSelectedOptionsView = new ProjectSelectedOptionsView();

    maximumOccurrences: number = 1;
}
