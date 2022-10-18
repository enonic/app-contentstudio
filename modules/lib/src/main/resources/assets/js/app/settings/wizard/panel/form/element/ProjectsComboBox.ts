import {Project} from '../../../../data/project/Project';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import * as Q from 'q';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ProjectsChainBlock} from './ProjectsChainBlock';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectOptionDataHelper} from './ProjectOptionDataHelper';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionView';
import {ComboBoxConfig} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBox';
import {ProjectOptionDataLoader} from './ProjectOptionDataLoader';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';

export class ProjectsComboBox extends RichComboBox<Project> {

    private readonly helper: ProjectOptionDataHelper;

    constructor(builder: ProjectsDropdownBuilder = new ProjectsDropdownBuilder()) {
        super(builder);

        this.helper = builder.optionDataHelper;

        this.initListeners();
    }

    private initListeners(): void {
        const loader: ProjectOptionDataLoader = <ProjectOptionDataLoader>this.getLoader();

        loader.onLoadedData(() => {
            const isFlatList: boolean = this.isFlatList();
            this.helper.setProjects(this.getLoadedResults());
            this.toggleClass('flat', isFlatList);
            loader.notifyModeChange(!isFlatList);

            return Q.resolve();
        });

        this.onOptionSelected((option: SelectedOptionEvent<Project>) => {
            this.getAllProjects().then((projects: Project[]) => {
                const view: ProjectSelectedOptionView = <ProjectSelectedOptionView>option.getSelectedOption()?.getOptionView();
                const project: Project = option.getSelectedOption().getOption().getDisplayValue();
                const subName: string =
                    ProjectsChainBlock.buildProjectsChain(project.getName(), projects).map((p: Project) => p.getName()).join(' / ');
                view.getNamesAndIconView().setSubName(subName);
            }).catch(DefaultErrorHandler.handle);
        });
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
        const result: Project[] = this.isSearchStringSet() ? items : items.filter((item: Project) => !item.getParent());
        return super.createOptions(result);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('parent-project-selector');

            return rendered;
        });
    }

    selectProject(project: Project) {
        if (!project) {
            return;
        }

        const newOption: Option<Project> = this.createOption(project);
        const existingOption: Option<Project> = this.getOptionByValue(project.getName());

        if (existingOption) {
            this.updateOption(existingOption, project);
        }

        this.getSelectedOptions().forEach((selectedOption: SelectedOption<Project>) => {
            if (selectedOption.getOption().getValue() === project.getName()) {
                selectedOption.getOptionView().setOption(newOption);
            }
        });

        this.selectOption(newOption);
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
        this.appendRemoveButton();
    }

    setOption(option: Option<Project>) {
        this.option = option;
        this.setObject(option.getDisplayValue());
    }

    getOption(): Option<Project> {
        return this.option;
    }
}

export class ProjectSelectedOptionsView
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
