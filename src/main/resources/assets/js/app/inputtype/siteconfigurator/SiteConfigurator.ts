import Property = api.data.Property;
import PropertyArray = api.data.PropertyArray;
import FormView = api.form.FormView;
import Value = api.data.Value;
import ValueType = api.data.ValueType;
import ValueTypes = api.data.ValueTypes;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import Application = api.application.Application;
import ApplicationConfig = api.application.ApplicationConfig;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import ApplicationKey = api.application.ApplicationKey;
import ApplicationEvent = api.application.ApplicationEvent;
import ApplicationEventType = api.application.ApplicationEventType;
import ApplicationConfigProvider = api.form.inputtype.appconfig.ApplicationConfigProvider;
import {SiteConfiguratorComboBox} from './SiteConfiguratorComboBox';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentFormContext} from '../../ContentFormContext';

export class SiteConfigurator
    extends api.form.inputtype.support.BaseInputTypeManagingAdd {

    private readOnly: boolean;

    private comboBox: SiteConfiguratorComboBox;

    private siteConfigProvider: ApplicationConfigProvider;

    private formContext: ContentFormContext;

    private readOnlyPromise: wemQ.Promise<void>;

    constructor(config: ContentInputTypeViewContext) {
        super('application-configurator');
        this.formContext = config.formContext;

        this.readOnlyPromise =
            new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {
                this.readOnly = !loginResult.isContentAdmin();
            });
    }

    getValueType(): ValueType {
        return ValueTypes.DATA;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {

        super.layout(input, propertyArray);

        let deferred = wemQ.defer<void>();

        this.siteConfigProvider = new ApplicationConfigProvider(propertyArray);
        // ignore changes made to property by siteConfigProvider
        this.siteConfigProvider.onBeforePropertyChanged(() => this.ignorePropertyChange = true);
        this.siteConfigProvider.onAfterPropertyChanged(() => this.ignorePropertyChange = false);

        this.comboBox = this.createComboBox(input, this.siteConfigProvider);
        if (this.readOnlyPromise.isFulfilled()) {
            this.comboBox.setReadOnly(this.readOnly);
        } else {
            this.readOnlyPromise.then(() => {
                this.comboBox.setReadOnly(this.readOnly);
            });
        }

        this.appendChild(this.comboBox);

        this.comboBox.render().then(() => {
            this.setLayoutInProgress(false);
            deferred.resolve(null);
        });
        return deferred.promise;
    }

    update(propertyArray: api.data.PropertyArray, unchangedOnly?: boolean): wemQ.Promise<void> {
        return super.update(propertyArray, unchangedOnly).then(() => {
            const optionsMissing = !!propertyArray && propertyArray.getSize() > 0 && this.comboBox.getOptions().length === 0;
            return optionsMissing ? this.comboBox.getLoader().preLoad() : null;
        }).then(() => {
            const ignorePropertyChange = this.ignorePropertyChange;
            this.ignorePropertyChange = true;

            this.siteConfigProvider.setPropertyArray(propertyArray);

            this.deselectOldViews(propertyArray);

            const selectedOptionViews = propertyArray.map(property =>
                <SiteConfiguratorSelectedOptionView>this.selectOptionFromProperty(property).getOptionView());

            const updatePromises = selectedOptionViews.map((view, index) => {
                const configSet = propertyArray.get(index).getPropertySet().getProperty('config').getPropertySet();
                return view.getFormView().update(configSet, unchangedOnly);
            });

            return wemQ.all(updatePromises).then(() => {
                this.ignorePropertyChange = ignorePropertyChange;
                if (!unchangedOnly || !this.comboBox.isDirty()) {
                    this.comboBox.setValue(this.getValueFromPropertyArray(propertyArray));
                } else if (this.comboBox.isDirty()) {
                    this.comboBox.forceChangedEvent();
                }
            });
        });
    }

    reset() {
        this.comboBox.resetBaseValues();
    }

    private static optionViewToKey(option: SiteConfiguratorSelectedOptionView): string {
        return option.getApplication().getApplicationKey().toString();
    }

    private deselectOldViews(newPropertyArray: PropertyArray) {

        this.comboBox.getSelectedOptionViews().forEach(oldView => {
            const haveToDeselect = !newPropertyArray.some(property => {
                const key = property.getPropertySet().getProperty('applicationKey').getValue().getString();
                return SiteConfigurator.optionViewToKey(oldView) === key;

            });

            if (haveToDeselect) {
                this.comboBox.deselect(oldView.getApplication(), true);
            }
        });
    }

    private selectOptionFromProperty(property: Property): SelectedOption<Application> {
        const key = property.getPropertySet().getProperty('applicationKey').getValue().getString();
        const selectedOptions: SiteConfiguratorSelectedOptionView[] = this.comboBox.getSelectedOptionViews();
        const alreadySelected = selectedOptions.some(option => SiteConfigurator.optionViewToKey(option) === key);
        if (!alreadySelected) {
            this.comboBox.selectOptionByValue(key);
        }
        return this.comboBox.getSelectedOptionByValue(key);
    }

    private saveToSet(siteConfig: ApplicationConfig, index: number) {

        let propertySet = this.getPropertyArray().get(index).getPropertySet();
        if (!propertySet) {
            propertySet = this.getPropertyArray().addSet();
        }

        let config = siteConfig.getConfig();
        let appKey = siteConfig.getApplicationKey();

        propertySet.setStringByPath('applicationKey', appKey.toString());
        propertySet.setPropertySetByPath('config', config);
    }

    protected getValueFromPropertyArray(propertyArray: api.data.PropertyArray): string {
        return propertyArray.getProperties().map((property) => {
            if (property.hasNonNullValue()) {
                let siteConfig = ApplicationConfig.create().fromData(property.getPropertySet()).build();
                return siteConfig.getApplicationKey().toString();
            }
        }).join(';');
    }

    private createComboBox(input: api.form.Input, siteConfigProvider: ApplicationConfigProvider): SiteConfiguratorComboBox {

        const value = this.getValueFromPropertyArray(this.getPropertyArray());
        const siteConfigFormsToDisplay = value.split(';');
        const maximum = input.getOccurrences().getMaximum() || 0;
        const comboBox = new SiteConfiguratorComboBox(maximum, siteConfigProvider, this.formContext, value);

        const forcedValidate = () => {
            this.ignorePropertyChange = false;
            this.validate(false);
        };
        const saveAndForceValidate = (selectedOption: SelectedOption<Application>) => {
            const view: SiteConfiguratorSelectedOptionView = <SiteConfiguratorSelectedOptionView>selectedOption.getOptionView();
            this.saveToSet(view.getSiteConfig(), selectedOption.getIndex());
            forcedValidate();
        };

        comboBox.onOptionDeselected((event: SelectedOptionEvent<Application>) => {
            this.ignorePropertyChange = true;

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            forcedValidate();
        });

        comboBox.onOptionSelected((event: SelectedOptionEvent<Application>) => {
            this.fireFocusSwitchEvent(event);

            this.ignorePropertyChange = true;

            const selectedOption = event.getSelectedOption();
            const view: SiteConfiguratorSelectedOptionView = <SiteConfiguratorSelectedOptionView>selectedOption.getOptionView();

            const propertyArray = this.getPropertyArray();
            const configSet = propertyArray.get(selectedOption.getIndex()).getPropertySet().getProperty('config').getPropertySet();

            view.getFormView().update(configSet, false);

            const key = selectedOption.getOption().displayValue.getApplicationKey();
            if (key) {
                saveAndForceValidate(selectedOption);
            }
        });

        comboBox.onOptionMoved((selectedOption: SelectedOption<Application>, fromIndex: number) => {
            this.ignorePropertyChange = true;

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

        let handleAppEvent = (view: SiteConfiguratorSelectedOptionView, hasUninstalledClass: boolean, hasStoppedClass) => {
            if (view) {
                view.toggleClass('stopped', hasStoppedClass);
                view.toggleClass('uninstalled', hasUninstalledClass);
            }
        };

        ApplicationEvent.on((event: ApplicationEvent) => {
            if (ApplicationEventType.STOPPED === event.getEventType()) {
                handleAppEvent(this.getMatchedOption(comboBox, event), false, true);
            } else if (ApplicationEventType.STARTED === event.getEventType()) {
                const view: SiteConfiguratorSelectedOptionView = this.getMatchedOption(comboBox, event);
                handleAppEvent(view, false, false);
                if (view) {
                    view.update();

                    if (view.getOption().empty) {
                        view.removeClass('empty');
                    }
                }
            } else if (ApplicationEventType.UNINSTALLED === event.getEventType()) {
                handleAppEvent(this.getMatchedOption(comboBox, event), true, false);
            } else if (ApplicationEventType.INSTALLED === event.getEventType()) {
                const view: SiteConfiguratorSelectedOptionView = this.getMatchedOption(comboBox, event);
                if (view) {
                    view.update();
                }
            }
        });

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

    displayValidationErrors(value: boolean) {
        this.comboBox.getSelectedOptionViews().forEach((view: SiteConfiguratorSelectedOptionView) => {
            view.getFormView().displayValidationErrors(value);
        });
    }

    protected getNumberOfValids(): number {
        return this.comboBox.countSelected();
    }

    validate(silent: boolean = true): api.form.inputtype.InputValidationRecording {
        let recording = new api.form.inputtype.InputValidationRecording();

        this.comboBox.getSelectedOptionViews().forEach((view: SiteConfiguratorSelectedOptionView) => {

            let validationRecording = view.getFormView().validate(true);
            if (!validationRecording.isMinimumOccurrencesValid()) {
                recording.setBreaksMinimumOccurrences(true);
            }
            if (!validationRecording.isMaximumOccurrencesValid()) {
                recording.setBreaksMaximumOccurrences(true);
            }
        });

        return super.validate(silent, recording);
    }

    giveFocus(): boolean {
        if (this.comboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.comboBox.giveFocus();
    }

}

api.form.inputtype.InputTypeManager.register(new api.Class('SiteConfigurator', SiteConfigurator));
