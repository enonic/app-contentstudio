import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {TextLine} from '@enonic/lib-admin-ui/form/inputtype/text/TextLine';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectApplicationsLoader} from '../../../../resource/applications/ProjectApplicationsLoader';
import {ProjectApplicationsSelectedOptionsView} from './ProjectApplicationsSelectedOptionsView';
import {Application, ApplicationBuilder} from '@enonic/lib-admin-ui/application/Application';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {GetApplicationsRequest} from '../../../../../resource/GetApplicationsRequest';
import {ProjectApplicationSelectedOptionView} from './ProjectApplicationSelectedOptionView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ProjectApplication} from './ProjectApplication';
import {ProjectApplicationsFormParams} from './ProjectApplicationsFormParams';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {ProjectApplicationsListBox} from './ProjectApplicationsListBox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {Project} from '../../../../data/project/Project';
import {DataChangedEvent} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';

export class ProjectApplicationsComboBox
    extends FilterableListBoxWrapperWithSelectedView<Application> {

    private loader: ProjectApplicationsLoader;

    private dataChangedListeners: ((event: DataChangedEvent<Application>) => void)[];

    private parentSiteConfigs: ApplicationConfig[] = [];

    private inheritedParentSiteConfigs: ApplicationConfig[] = [];

    declare protected selectedOptionsView: ProjectApplicationsSelectedOptionsView;

    constructor(params?: ProjectApplicationsFormParams) {
        super(new ProjectApplicationsListBox(), {
            selectedOptionsView: new ProjectApplicationsSelectedOptionsView(params),
            className: 'project-applications-combobox',
            filter: ProjectApplicationsComboBox.filter,
            maxSelected: 0
        });

        if (params.hasParentProjects()) {
            this.setParentProjects(params.getParentProjects());
        }
    }

    protected initElements(): void {
        super.initElements();

        this.loader = new ProjectApplicationsLoader();
        this.dataChangedListeners = [];
    }

    protected initListeners(): void {
        super.initListeners();

        this.loader.onLoadedData((event: LoadedDataEvent<Application>) => {
            this.listBox.setItems(event.getData());

            if (this.optionFilterInput.getValue()) { // triggering filtering if search string is present
                this.optionFilterInput.forceChangedEvent();
            }

            this.getSelectedOptions().forEach((option: SelectedOption<Application>) => {
                this.select(option.getOption().getDisplayValue(), true);
            });

            return null;
        });

        this.onSelectionChanged((selectionChange: SelectionChange<Application>) => {
            selectionChange.selected?.forEach((item: Application) => {
                setTimeout(() => { // to let layout finish, remove when layout is done in the parent class
                    this.handleItemSelected(item);
                }, 50);
            });

            if (selectionChange.deselected?.length > 0) {
                this.handleItemDeselected();
            }
        });

        this.selectedOptionsView.onOptionMoved(this.notifyDataChanged.bind(this));
    }

    protected loadListOnShown(): void {
        this.loader.load().catch(DefaultErrorHandler.handle);
    }

    setParentProjects(projects: Project[]): Q.Promise<void> {
        this.parentSiteConfigs = projects[0]?.getSiteConfigs() || [];
        this.inheritedParentSiteConfigs = this.getParentConfigsNotSelected();
        return this.layoutApplicationConfigs(this.getMergedConfigs());
    }

    layoutApplicationConfigs(applicationConfigs: ApplicationConfig[]): Q.Promise<void> {
        this.resetSelection();

        return this.layoutSelectedApps(applicationConfigs);
    }

    addAndUpdatePortalApp(baseUrl: string): void {
        if (!this.isSelected(ApplicationKey.PORTAL.getName())) {
            this.select(this.createPortalApp());
        }

        this.whenPortalFormLayoutFinished(() => {
            this.getPortalConfig()?.getConfig().setString('baseUrl', 0, baseUrl);
            this.notifyDataChanged();
        });
    }

    removePortalApp(): void {
        const selectedPortalApp = this.getSelectedItems().find(app => app.getName() === ApplicationKey.PORTAL.getName());

        if (selectedPortalApp) {
            this.deselect(selectedPortalApp);
        }
    }

    private handleItemSelected(item: Application): void {
        const view = this.selectedOptionsView.getById(item.getId()).getOptionView() as ProjectApplicationSelectedOptionView;

        view?.layoutForm().finally(() => {
            this.notifyDataChanged();
            view.setDataChangedHandler(this.notifyDataChanged.bind(this));
        }).catch(DefaultErrorHandler.handle);
    }

    private handleItemDeselected(): void {
        this.notifyDataChanged();
    }

    private notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => listener());
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        const siteConfigs = item.getSiteConfigs();
        if (!item || siteConfigs.length === 0) {
            return Q();
        }

        return this.layoutSiteConfigs(siteConfigs);
    }

    private layoutSiteConfigs(configs: ApplicationConfig[]): Q.Promise<void> {
        this.deselectNonSelectedApps(configs);

        return this.layoutSelectedApps(configs).catch(DefaultErrorHandler.handle);
    }

    private deselectNonSelectedApps(configs: ApplicationConfig[]): void {
        this.getSelectedOptions().map(o => o.getOption().getDisplayValue()).forEach((app: Application) => {
            const appKey: ApplicationKey = app.getApplicationKey();

            if (!configs.some((config: ApplicationConfig) => config.getApplicationKey().equals(appKey))) {
                this.deselect(app, true);
            }
        });
    }

    private layoutSelectedApps(configs: ApplicationConfig[]): Q.Promise<void> {
        return this.fetchSelectedApps(configs).then((selectedApps: Application[]) => {
            const layoutPromises: Q.Promise<void>[] = [];

            if (configs.some(c => c.getApplicationKey().equals(ApplicationKey.PORTAL))) {
                selectedApps.splice(0, 0, this.createPortalApp());
            }

            configs.forEach((config: ApplicationConfig) => {
                const appToSelect: Application = this.getOrGenerateAppByKey(selectedApps, config.getApplicationKey());
                this.deselect(appToSelect, true);
                this.select(appToSelect, true);
                layoutPromises.push(this.layoutSelectedApp(config));
            });

            return Q.all(layoutPromises).thenResolve(null);
        });
    }

    private createPortalApp(): Application {
        const key = ApplicationKey.fromString(ApplicationKey.PORTAL.getName());
        const appBuilder = new ApplicationBuilder();
        appBuilder.applicationKey = key;
        appBuilder.id = key.toString();
        appBuilder.displayName = key.toString();
        appBuilder.config = this.createPortalAppForm();
        return new Application(appBuilder);
    }

    private createPortalAppForm(): Form {
        const formBuilder = new FormBuilder();
        formBuilder.addFormItem(
            new InputBuilder().setName('baseUrl').setInputType(TextLine.getName()).setLabel(i18n('field.baseUrl')).setOccurrences(
                new OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).build())
        return new Form(formBuilder);
    }

    private getPortalConfig(): ApplicationConfig {
        const portalProjectApp = this.getSelectedApplications().find(
            app => app.getApplication().getName() === ApplicationKey.PORTAL.getName());
        return portalProjectApp?.getConfig();
    }

    private whenPortalFormLayoutFinished(callback: () => void): void {
        const view = this.getSelectedOptions().find(
            option => option.getOption().getId() ===
                      ApplicationKey.PORTAL.getName())?.getOptionView() as ProjectApplicationSelectedOptionView;
        view?.whenFormLayoutFinished(callback);
    }

    private layoutSelectedApp(appConfig: ApplicationConfig): Q.Promise<void> {
        return this.getSelectedOptionViewByKey(appConfig.getApplicationKey())
            ?.setDataChangedHandler(this.notifyDataChanged.bind(this))
            .setConfig(appConfig.getConfig())
            .layoutForm();
    }

    private getSelectedOptionViewByKey(key: ApplicationKey): ProjectApplicationSelectedOptionView {
        return this.getSelectedOptions().find(
            (option: SelectedOption<Application>) => option.getOption().getDisplayValue().getApplicationKey().equals(key))?.getOptionView() as ProjectApplicationSelectedOptionView;
    }

    private getOrGenerateAppByKey(apps: Application[], key: ApplicationKey): Application {
        return apps.find((app: Application) => app.getName() === key.getName()) || this.generateNotAvailableApp(key);
    }

    private fetchSelectedApps(configs: ApplicationConfig[]): Q.Promise<Application[]> {
        return new GetApplicationsRequest(configs.map((config: ApplicationConfig) => config.getApplicationKey())).sendAndParse();
    }

    private generateNotAvailableApp(key: ApplicationKey): Application {
        const builder: ApplicationBuilder = new ApplicationBuilder();

        builder.applicationKey = key;
        builder.displayName = key.toString();

        return builder.build();
    }

    getSelectedApplications(): ProjectApplication[] {
        return this.getSelectedOptions().slice()
            .map((o: SelectedOption<Application>) => o.getOptionView() as ProjectApplicationSelectedOptionView)
            .map((selected: ProjectApplicationSelectedOptionView) => selected.getCurrentConfig()).sort(this.sortProjectApplications);
    }

    private sortProjectApplications(app1: ProjectApplication, app2: ProjectApplication): number {
        if (app1.getApplication().getApplicationKey().equals(ApplicationKey.PORTAL)) {
            return -1; // Portal app should always be first
        }

        if (app2.getApplication().getApplicationKey().equals(ApplicationKey.PORTAL)) {
            return 1; // Portal app should always be first
        }

        return 0;
    }

    getSelectedApplicationConfigs(): ApplicationConfig[] {
        return this.getSelectedApplications().map((app: ProjectApplication) => app.getConfig().clone());
    }

    getNonInheritedApplicationConfigs(): ApplicationConfig[] {
        if (this.inheritedParentSiteConfigs.length === 0) {
            return this.getSelectedApplicationConfigs();
        }
        return this.getSelectedApplicationConfigs().filter((config: ApplicationConfig) =>
            this.inheritedParentSiteConfigs.findIndex((parentConfig: ApplicationConfig) => parentConfig.getApplicationKey().equals(config.getApplicationKey())) === - 1
        );
    }

    onDataChanged(listener: (event: DataChangedEvent<Application>) => void) {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void) {
        this.dataChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    private static filter(item: Application, searchString: string): boolean {
        const str: string = searchString.toLowerCase().trim();

        return item.getDisplayName()?.toLowerCase().indexOf(str) > -1 ||
               item.getDescription()?.toLowerCase().indexOf(str) > -1 ||
               item.getName()?.toLowerCase().indexOf(str) > -1;
    }

    createSelectedOption(item: Application): Option<Application> {
        return Option.create<Application>()
            .setValue(item.getId())
            .setDisplayValue(item)
            .setReadOnly(this.isReadonly(item.getApplicationKey()))
            .build();
    }

    private isReadonly(key: ApplicationKey): boolean {
        const hasParentConfigs: boolean = this.parentSiteConfigs !== undefined && this.parentSiteConfigs?.length > 0;
        const parentAppKeys: ApplicationKey[] = hasParentConfigs ? this.parentSiteConfigs.map(
            (config: ApplicationConfig) => config.getApplicationKey()) : [];
        return hasParentConfigs ? !!parentAppKeys.find((appKey: ApplicationKey) => appKey.equals(key)) : false;
    }

    private getParentConfigsNotSelected(): ApplicationConfig[] {
        const selectedConfigs = this.getSelectedApplicationConfigs();

        return this.parentSiteConfigs.filter((config: ApplicationConfig) =>
            selectedConfigs.findIndex((selected: ApplicationConfig) => selected.getApplicationKey().equals(config.getApplicationKey())) === -1);
    }

    private getMergedConfigs(): ApplicationConfig[] {
        const selectedConfigs = this.getSelectedApplicationConfigs();

        return [
            ...selectedConfigs,
            ...this.parentSiteConfigs.filter((pc) => selectedConfigs.findIndex(sc => pc.getApplicationKey().equals(sc.getApplicationKey())) === -1),
        ];
    }

}

export class ProjectApplicationsComboBoxWrapper extends FormInputEl {

    private readonly selector: ProjectApplicationsComboBox;

    constructor(selector: ProjectApplicationsComboBox) {
        super('div', 'locale-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }

    getComboBox(): ProjectApplicationsComboBox {
        return this.selector;
    }

    getValue(): string {
        return this.selector.getSelectedOptions().length > 0 ? 'mock' : '';
    }
}
