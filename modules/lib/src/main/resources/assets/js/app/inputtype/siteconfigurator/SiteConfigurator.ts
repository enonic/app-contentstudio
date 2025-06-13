import * as Q from 'q';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Application, ApplicationBuilder} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationEvent} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {SiteConfigProviderRegistry} from './SiteConfigProviderRegistry';
import {SiteConfiguratorComboBox} from './SiteConfiguratorComboBox';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentFormContext} from '../../ContentFormContext';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {GetApplicationsRequest} from '../../resource/GetApplicationsRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';

export class SiteConfigurator
    extends BaseInputTypeManagingAdd {

    private comboBox: SiteConfiguratorComboBox;

    private siteConfigProvider: ApplicationConfigProvider;

    private readOnlyPromise: Q.Promise<boolean>;

    constructor(context: ContentInputTypeViewContext) {
        super(context, 'application-configurator');

        this.readOnlyPromise = this.isReadOnly();
    }

    private isReadOnly(): Q.Promise<boolean> {
        if (AuthHelper.isContentAdmin()) {
            return Q(false);
        }

        return ProjectHelper.isUserProjectOwner().then((isOwner: boolean) => {
            return Q(!isOwner);
        });
    }

    getValueType(): ValueType {
        return ValueTypes.DATA;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            let deferred = Q.defer<void>();
            this.siteConfigProvider = new ApplicationConfigProvider(propertyArray);
            SiteConfigProviderRegistry.setConfigProvider(this.siteConfigProvider);
            // ignore changes made to property by siteConfigProvider
            this.siteConfigProvider.onBeforePropertyChanged(() => this.ignorePropertyChange(true));
            this.siteConfigProvider.onAfterPropertyChanged(() => this.ignorePropertyChange(false));

            this.comboBox = this.createComboBox(input, this.siteConfigProvider);

            this.readOnlyPromise.then((readonly: boolean) => {
                this.comboBox.setEnabled(!readonly);
            });

            this.layoutApps(propertyArray).catch(DefaultErrorHandler.handle);

            this.appendChild(this.comboBox);

            this.comboBox.render().then(() => {
                this.setLayoutInProgress(false);
                deferred.resolve(null);
            });
            return deferred.promise;
        });
    }

    private layoutApps(propertyArray: PropertyArray): Q.Promise<void> {
        const appKeys = this.getKeysFromPropertyArray(propertyArray);

        if (!appKeys?.length) {
            return Q();
        }

        return new GetApplicationsRequest(appKeys).sendAndParse().then((apps: Application[]) => {
            const result = appKeys.map((appKey: ApplicationKey) => {
               return apps.find((app: Application) => app.getApplicationKey().equals(appKey)) || this.makeMissingApp(appKey);
            });
            this.comboBox.select(result, true);
        });
    }

    private makeMissingApp(appKey: ApplicationKey): Application {
        const builder = new ApplicationBuilder();
        builder.applicationKey = appKey;
        builder.displayName = appKey.toString();

        return builder.build();
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        return super.update(propertyArray, unchangedOnly).then(() => {
            const optionsMissing = !!propertyArray && propertyArray.getSize() > 0 && this.comboBox.getListSize() === 0;
            return optionsMissing ? this.comboBox.getLoader().preLoad() : null;
        }).then(() => {
            const ignorePropertyChange = this.isPropertyChangeIgnored();
            this.ignorePropertyChange(true);

            this.siteConfigProvider.setPropertyArray(propertyArray);

            this.deselectOldViews(propertyArray);

            const selectedOptionViews = propertyArray.map(property =>
                this.selectOptionFromProperty(property)?.getOptionView() as SiteConfiguratorSelectedOptionView);

            const updatePromises = selectedOptionViews.filter(view => !!view).map((view, index) => {
                const configSet = propertyArray.get(index).getPropertySet().getProperty(ApplicationConfig.PROPERTY_CONFIG).getPropertySet();
                return view.getFormView().update(configSet, unchangedOnly);
            });

            return Q.all(updatePromises).then(() => {
                this.ignorePropertyChange(ignorePropertyChange);
            });
        });
    }

    reset() {
        //this.comboBox.resetBaseValues();
    }

    private static optionViewToKey(option: SiteConfiguratorSelectedOptionView): string {
        return option.getApplication().getApplicationKey().toString();
    }

    private deselectOldViews(newPropertyArray: PropertyArray) {

        this.comboBox.getSelectedOptionViews().forEach(oldView => {
            const haveToDeselect = !newPropertyArray.some(property => {
                const key = property.getPropertySet().getProperty(ApplicationConfig.PROPERTY_KEY).getValue().getString();
                return SiteConfigurator.optionViewToKey(oldView) === key;
            });

            if (haveToDeselect) {
                this.comboBox.deselect(oldView.getApplication(), true);
            }
        });
    }

    private selectOptionFromProperty(property: Property): SelectedOption<Application> {
        const key = property.getPropertySet().getProperty(ApplicationConfig.PROPERTY_KEY).getValue().getString();
        const selectedOptions: SiteConfiguratorSelectedOptionView[] = this.comboBox.getSelectedOptionViews();
        const alreadySelected = selectedOptions.some(option => SiteConfigurator.optionViewToKey(option) === key);
        if (!alreadySelected) {
            this.comboBox.selectByKey(key, true);
        }
        return this.comboBox.getSelectedOptionByKey(key);
    }

    private saveToSet(siteConfig: ApplicationConfig, index: number) {

        let propertySet = this.getPropertyArray().get(index).getPropertySet();
        if (!propertySet) {
            propertySet = this.getPropertyArray().addSet();
        }

        let config = siteConfig.getConfig();
        let appKey = siteConfig.getApplicationKey();

        propertySet.setStringByPath(ApplicationConfig.PROPERTY_KEY, appKey.toString());
        propertySet.setPropertySetByPath(ApplicationConfig.PROPERTY_CONFIG, config);
    }

    protected getValueFromPropertyArray(propertyArray: PropertyArray): string {
        return propertyArray.getProperties().map((property) => {
            if (property.hasNonNullValue()) {
                let siteConfig = ApplicationConfig.create().fromData(property.getPropertySet()).build();
                return siteConfig.getApplicationKey().toString();
            }
        }).join(';');
    }

    private getKeysFromPropertyArray(propertyArray: PropertyArray): ApplicationKey[] {
        return propertyArray.getProperties()
            .filter(p => p.hasNonNullValue())
            .map((property) => this.makeSiteConfigFromProperty(property).getApplicationKey());
    }

    private makeSiteConfigFromProperty(property: Property): ApplicationConfig {
        return ApplicationConfig.create().fromData(property.getPropertySet()).build();
    }

    private createComboBox(input: Input, siteConfigProvider: ApplicationConfigProvider): SiteConfiguratorComboBox {

        const value = this.getValueFromPropertyArray(this.getPropertyArray());
        const siteConfigFormsToDisplay = value.split(';');
        const maximum = input.getOccurrences().getMaximum() || 0;
        const comboBox = new SiteConfiguratorComboBox(maximum, siteConfigProvider, this.context.formContext as ContentFormContext, value);

        const forcedValidate = () => {
            this.ignorePropertyChange(false);
            this.validate(false);
        };
        const saveAndForceValidate = (selectedOption: SelectedOption<Application>) => {
            const view: SiteConfiguratorSelectedOptionView = selectedOption.getOptionView() as SiteConfiguratorSelectedOptionView;
            this.saveToSet(view.getSiteConfig(), selectedOption.getIndex());
            forcedValidate();
        };

        comboBox.onSelectionChanged((selectionChange: SelectionChange<Application>) => {
            if (selectionChange.selected?.length > 0) {
                this.ignorePropertyChange(true);

                selectionChange.selected.forEach((selected: Application) => {
                    const selectedOption: SelectedOption<Application> = comboBox.getSelectedOption(selected);
                    const view: SiteConfiguratorSelectedOptionView = selectedOption.getOptionView() as SiteConfiguratorSelectedOptionView;

                    const propertyArray: PropertyArray = this.getPropertyArray();
                    const configSet: PropertySet = propertyArray.get(selectedOption.getIndex()).getPropertySet().getProperty(
                        ApplicationConfig.PROPERTY_CONFIG).getPropertySet();

                    view.whenRendered(() => {
                        view.getFormView().update(configSet, false);
                    });

                    const key = selectedOption.getOption().getDisplayValue().getApplicationKey();
                    if (key) {
                        saveAndForceValidate(selectedOption);
                    }
                });
            }

            if (selectionChange.deselected?.length > 0) {
                this.ignorePropertyChange(true);

                selectionChange.deselected.forEach((deselected: Application) => {
                    const property = this.getPropertyArray().getProperties()
                        .filter(p => p.hasNonNullValue())
                        .find((property) => {
                        const config = this.makeSiteConfigFromProperty(property);
                        return deselected.getApplicationKey().equals(config.getApplicationKey());
                    });

                    if (property) {
                        this.getPropertyArray().remove(property.getIndex());
                    }
                });

                forcedValidate();
            }
        });

        comboBox.onOptionMoved((selectedOption: SelectedOption<Application>, fromIndex: number) => {
            this.ignorePropertyChange(true);

            this.getPropertyArray().move(fromIndex, selectedOption.getIndex());
            forcedValidate();
        });

        comboBox.onSiteConfigFormDisplayed((applicationKey: ApplicationKey, formView: FormView) => {
            let indexToRemove = siteConfigFormsToDisplay.indexOf(applicationKey.toString());
            if (indexToRemove !== -1) {
                siteConfigFormsToDisplay.splice(indexToRemove, 1);
            }

            formView.onValidityChanged(() => this.validate(false));

            this.validate(false);
        });

        const handleAppEvent = (event: ApplicationEvent) => {
            if (!event.isNeedToUpdateApplication()) {
                return;
            }
            const selectedOptionView: SiteConfiguratorSelectedOptionView = this.getMatchedOption(comboBox, event);
            selectedOptionView?.update();
            this.comboBox.setLoadWhenListShown();
        };

        ApplicationEvent.on((event: ApplicationEvent) => handleAppEvent(event));

        return comboBox;
    }

    private getMatchedOption(combobox: SiteConfiguratorComboBox, event: ApplicationEvent): SiteConfiguratorSelectedOptionView {
        let result: SiteConfiguratorSelectedOptionView;
        combobox.getSelectedOptionViews().some((view: SiteConfiguratorSelectedOptionView) => {
            if (view.getApplication() && view.getApplication().getApplicationKey().equals(event.getApplicationKey())) {
                result = view;
                return true;
            }
        });
        return result;
    }

    protected getNumberOfValids(): number {
        const anyInvalid: boolean = this.comboBox.getSelectedOptionViews().some((view: SiteConfiguratorSelectedOptionView) =>
            !view.getFormView().isValid()
        );

        return anyInvalid ? -1 : this.comboBox.countSelected();
    }

    validate(silent: boolean = true) {
        this.comboBox.getSelectedOptionViews().forEach((view: SiteConfiguratorSelectedOptionView) => {
             view.getFormView().validate(true);
        });

        super.validate(silent);
    }

    giveFocus(): boolean {
        if (this.comboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.comboBox.giveFocus();
    }

    isValidationErrorToBeRendered(): boolean {
        return false;
    }

}

InputTypeManager.register(new Class('SiteConfigurator', SiteConfigurator));
