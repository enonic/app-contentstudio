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
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {SiteConfiguratorComboBox} from './SiteConfiguratorComboBox';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentFormContext} from '../../ContentFormContext';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';

export class SiteConfigurator
    extends BaseInputTypeManagingAdd {

    private comboBox: SiteConfiguratorComboBox;

    private siteConfigProvider: ApplicationConfigProvider;

    private formContext: ContentFormContext;

    private readOnlyPromise: Q.Promise<boolean>;

    constructor(config: ContentInputTypeViewContext) {
        super('application-configurator');
        this.formContext = config.formContext;

        this.readOnlyPromise = this.isReadOnly();
    }

    private isReadOnly(): Q.Promise<boolean> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            if (loginResult.isContentAdmin()) {
                return Q(false);
            }

            return ProjectHelper.isUserProjectOwner(loginResult).then((isOwner: boolean) => {
                return Q(!isOwner);
            });
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
            // ignore changes made to property by siteConfigProvider
            this.siteConfigProvider.onBeforePropertyChanged(() => this.ignorePropertyChange(true));
            this.siteConfigProvider.onAfterPropertyChanged(() => this.ignorePropertyChange(false));

            this.comboBox = this.createComboBox(input, this.siteConfigProvider);

            this.readOnlyPromise.then((readonly: boolean) => {
                this.comboBox.setEnabled(!readonly);
            });

            this.appendChild(this.comboBox);

            this.comboBox.render().then(() => {
                this.setLayoutInProgress(false);
                deferred.resolve(null);
            });
            return deferred.promise;
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        return super.update(propertyArray, unchangedOnly).then(() => {
            const optionsMissing = !!propertyArray && propertyArray.getSize() > 0 && this.comboBox.getOptions().length === 0;
            return optionsMissing ? this.comboBox.getLoader().preLoad() : null;
        }).then(() => {
            const ignorePropertyChange = this.isPropertyChangeIgnored();
            this.ignorePropertyChange(true);

            this.siteConfigProvider.setPropertyArray(propertyArray);

            this.deselectOldViews(propertyArray);

            const selectedOptionViews = propertyArray.map(property =>
                <SiteConfiguratorSelectedOptionView>this.selectOptionFromProperty(property)?.getOptionView());

            const updatePromises = selectedOptionViews.filter(view => !!view).map((view, index) => {
                const configSet = propertyArray.get(index).getPropertySet().getProperty('config').getPropertySet();
                return view.getFormView().update(configSet, unchangedOnly);
            });

            return Q.all(updatePromises).then(() => {
                this.ignorePropertyChange(ignorePropertyChange);
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

    protected getValueFromPropertyArray(propertyArray: PropertyArray): string {
        return propertyArray.getProperties().map((property) => {
            if (property.hasNonNullValue()) {
                let siteConfig = ApplicationConfig.create().fromData(property.getPropertySet()).build();
                return siteConfig.getApplicationKey().toString();
            }
        }).join(';');
    }

    private createComboBox(input: Input, siteConfigProvider: ApplicationConfigProvider): SiteConfiguratorComboBox {

        const value = this.getValueFromPropertyArray(this.getPropertyArray());
        const siteConfigFormsToDisplay = value.split(';');
        const maximum = input.getOccurrences().getMaximum() || 0;
        const comboBox = new SiteConfiguratorComboBox(maximum, siteConfigProvider, this.formContext, value);

        const forcedValidate = () => {
            this.ignorePropertyChange(false);
            this.validate(false);
        };
        const saveAndForceValidate = (selectedOption: SelectedOption<Application>) => {
            const view: SiteConfiguratorSelectedOptionView = <SiteConfiguratorSelectedOptionView>selectedOption.getOptionView();
            this.saveToSet(view.getSiteConfig(), selectedOption.getIndex());
            forcedValidate();
        };

        comboBox.onOptionDeselected((event: SelectedOptionEvent<Application>) => {
            this.ignorePropertyChange(true);

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            forcedValidate();
        });

        comboBox.onOptionSelected((event: SelectedOptionEvent<Application>) => {
            this.fireFocusSwitchEvent(event);
            this.ignorePropertyChange(true);

            const selectedOption: SelectedOption<Application> = event.getSelectedOption();
            const view: SiteConfiguratorSelectedOptionView = <SiteConfiguratorSelectedOptionView>selectedOption.getOptionView();

            const propertyArray: PropertyArray = this.getPropertyArray();
            const configSet: PropertySet =
                propertyArray.get(selectedOption.getIndex()).getPropertySet().getProperty('config').getPropertySet();

            view.whenRendered(() => {
                view.getFormView().update(configSet, false);
            });

            const key = selectedOption.getOption().getDisplayValue().getApplicationKey();
            if (key) {
                saveAndForceValidate(selectedOption);
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
            if (!selectedOptionView) {
                return;
            }
            selectedOptionView.toggleClass('stopped', ApplicationEventType.STOPPED === event.getEventType());
            selectedOptionView.toggleClass('uninstalled', ApplicationEventType.UNINSTALLED === event.getEventType());
            selectedOptionView.update();
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
