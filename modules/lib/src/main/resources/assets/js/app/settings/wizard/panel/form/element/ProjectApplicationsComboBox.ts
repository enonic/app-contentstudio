import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {ProjectApplicationsLoader} from '../../../../resource/applications/ProjectApplicationsLoader';
import {ProjectApplicationsSelectedOptionsView} from './ProjectApplicationsSelectedOptionsView';
import {Application, ApplicationBuilder} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationViewer} from '@enonic/lib-admin-ui/application/ApplicationViewer';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import * as Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {GetApplicationsRequest} from '../../../../../resource/GetApplicationsRequest';
import {ProjectApplicationSelectedOptionView} from './ProjectApplicationSelectedOptionView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ProjectApplication} from './ProjectApplication';
import {ProjectApplicationsFormParams} from './ProjectApplicationsFormParams';
import {Project} from '../../../../data/project/Project';

export class ProjectApplicationsComboBox
    extends RichComboBox<Application> {

    private dataChangedListeners: (() => void)[] = [];

    private parentSiteConfigs: ApplicationConfig[] = [];

    private isLayoutInProgress: boolean = false;

    constructor(params?: ProjectApplicationsFormParams) {
        super(new ProjectApplicationsComboBoxBuilder(params));

        if (params.hasParentProjects()) {
            this.setParentProjects(params.getParentProjects());
        }

        this.initListeners();
    }

    setParentProjects(projects: Project[]): void {
        this.parentSiteConfigs = projects[0]?.getSiteConfigs() || [];
        this.layoutApplicationConfigs(this.getMergedConfigs());
    }

    private getMergedConfigs(): ApplicationConfig[] {
        const selectedConfigs = this.getSelectedApplicationConfigs();

        return [
            ...this.parentSiteConfigs || [],
            ...selectedConfigs.filter(sp => !this.parentSiteConfigs.some(pp => pp.getApplicationKey().equals(sp.getApplicationKey())))
        ];
    }

    hasDataChanged(): boolean {
        if (this.isLayoutInProgress) {
            return false;
        }
        const selectedDisplayValues: Application[] = this.getSelectedDisplayValues();
        return this.parentSiteConfigs.length !== selectedDisplayValues.length;
    }

    layoutApplicationConfigs(applicationConfigs: ApplicationConfig[]): Q.Promise<void> {
        this.isLayoutInProgress = true;
        this.clearCombobox();

        return this.layoutSelectedApps(applicationConfigs).then(() => {
            this.isLayoutInProgress = false;
        });
    }

    private initListeners(): void {
        this.onOptionSelected(this.handleOptionSelected.bind(this));
        this.onOptionDeselected(this.handleOptionDeselected.bind(this));
        this.onOptionMoved(this.notifyDataChanged.bind(this));
    }

    private handleOptionSelected(option: SelectedOptionEvent<Application>): void {
        const view: ProjectApplicationSelectedOptionView =
            (option.getSelectedOption().getOptionView() as ProjectApplicationSelectedOptionView);

        view.layoutForm().finally(() => {
            this.notifyDataChanged();
            view.setDataChangedHandler(this.notifyDataChanged.bind(this));
        }).catch(DefaultErrorHandler.handle);
    }

    private handleOptionDeselected(option: SelectedOptionEvent<Application>): void {
        this.notifyDataChanged();
    }

    private notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => listener());
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        const siteConfigs = item.getSiteConfigs();
        if (!item || siteConfigs.length === 0) {
            return Q(null);
        }

        return this.layoutSiteConfigs(siteConfigs);
    }

    private layoutSiteConfigs(configs: ApplicationConfig[]): Q.Promise<void> {
        this.deselectNonSelectedApps(configs);

        return this.layoutSelectedApps(configs).catch(DefaultErrorHandler.handle);
    }

    private deselectNonSelectedApps(configs: ApplicationConfig[]): void {
        this.getSelectedDisplayValues().forEach((app: Application) => {
            const appKey: ApplicationKey = app.getApplicationKey();

            if (!configs.some((config: ApplicationConfig) => config.getApplicationKey().equals(appKey))) {
                this.deselect(app, true);
            }
        });
    }

    private layoutSelectedApps(configs: ApplicationConfig[]): Q.Promise<void> {
        return this.fetchSelectedApps(configs).then((selectedApps: Application[]) => {
            const layoutPromises: Q.Promise<void>[] = [];
            const hasParentConfigs: boolean = this.parentSiteConfigs !== undefined && this.parentSiteConfigs?.length > 0;
            const parentAppKeys: ApplicationKey[] = hasParentConfigs ? this.parentSiteConfigs.map((config: ApplicationConfig) => config.getApplicationKey()) : [];

            configs.forEach((config: ApplicationConfig) => {
                const appToSelect: Application = this.getOrGenerateAppByKey(selectedApps, config.getApplicationKey());
                const isReadonly: boolean = hasParentConfigs ? !!parentAppKeys.find((appKey: ApplicationKey) => appKey.equals(config.getApplicationKey())) : false;

                this.select(appToSelect, isReadonly, true);

                layoutPromises.push(this.layoutSelectedApp(config));
            });

            return Q.all(layoutPromises).thenResolve(null);
        });
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
            .map((selected: ProjectApplicationSelectedOptionView) => selected.getCurrentConfig());
    }

    getSelectedApplicationConfigs(): ApplicationConfig[] {
        return this.getSelectedApplications().map((app: ProjectApplication) => app.getConfig().clone());
    }

    onDataChanged(listener: () => void) {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void) {
        this.dataChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    getSelectedOptionView(): ProjectApplicationsSelectedOptionsView {
        return super.getSelectedOptionView() as ProjectApplicationsSelectedOptionsView;
    }

}

export class ProjectApplicationsComboBoxBuilder extends RichComboBoxBuilder<Application> {

    identifierMethod: 'getApplicationKey';

    comboBoxName: 'projectApplicationsSelector';

    loader: ProjectApplicationsLoader = new ProjectApplicationsLoader();

    selectedOptionsView: ProjectApplicationsSelectedOptionsView;

    optionDisplayValueViewer: ApplicationViewer = new ApplicationViewer();

    delayedInputValueChangedHandling: number = 500;

    displayMissingSelectedOptions: boolean = true;

    constructor(params?: ProjectApplicationsFormParams) {
        super();

        this.selectedOptionsView = new ProjectApplicationsSelectedOptionsView(params);
    }
}
