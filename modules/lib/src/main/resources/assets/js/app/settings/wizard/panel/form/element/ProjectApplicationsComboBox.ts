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

export class ProjectApplicationsComboBox
    extends RichComboBox<Application> {

    private dataChangedListeners: { (): void }[] = [];

    constructor(params?: ProjectApplicationsFormParams) {
        super(new ProjectApplicationsComboBoxBuilder(params));

        this.initListeners();
    }

    private initListeners(): void {
        this.onOptionSelected(this.handleOptionSelected.bind(this));
        this.onOptionDeselected(this.handleOptionDeselected.bind(this));
    }

    private handleOptionSelected(option: SelectedOptionEvent<Application>): void {
        const view: ProjectApplicationSelectedOptionView =
            (<ProjectApplicationSelectedOptionView>option.getSelectedOption().getOptionView());

        view.layoutForm().finally(() => {
            this.notifyDataChanged();
            view.setDataChangedHandler(this.notifyDataChanged.bind(this));
        }).catch(DefaultErrorHandler.handle);
    }

    private handleOptionDeselected(option: SelectedOptionEvent<Application>): void {
        this.notifyDataChanged();
    }

    private notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item || item.getSiteConfigs().length === 0) {
            return Q(null);
        }

        this.deselectNonSelectedApps(item.getSiteConfigs());

        return this.layoutSelectedApps(item.getSiteConfigs()).catch(DefaultErrorHandler.handle);
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

            configs.forEach((config: ApplicationConfig) => {
                const appToSelect: Application = this.getOrGenerateAppByKey(selectedApps, config.getApplicationKey());
                this.select(appToSelect, false, true);

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
        return <ProjectApplicationSelectedOptionView>this.getSelectedOptions().find(
            (option: SelectedOption<Application>) => option.getOption().getDisplayValue().getApplicationKey().equals(key))?.getOptionView();
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
        return this.getSelectedOptions().slice().sort(this.sortByName)
            .map((o: SelectedOption<Application>) => <ProjectApplicationSelectedOptionView>o.getOptionView())
            .map((selected: ProjectApplicationSelectedOptionView) => selected.getCurrentConfig());
    }

    private sortByName(a1: SelectedOption<Application>, a2: SelectedOption<Application>): number {
        return a1.getOption().getDisplayValue().getDisplayName().localeCompare(a2.getOption().getDisplayValue().getDisplayName());
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
