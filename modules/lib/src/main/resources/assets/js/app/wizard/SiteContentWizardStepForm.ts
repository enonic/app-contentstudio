import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PropertyEvent} from '@enonic/lib-admin-ui/data/PropertyEvent';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PropertyValueChangedEvent} from '@enonic/lib-admin-ui/data/PropertyValueChangedEvent';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {Input, InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {TextLine} from '@enonic/lib-admin-ui/form/inputtype/text/TextLine';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {ContentFormContext} from '../ContentFormContext';
import {SiteConfigProviderRegistry} from '../inputtype/siteconfigurator/SiteConfigProviderRegistry';
import {ContentWizardStepForm} from './ContentWizardStepForm';

export class SiteContentWizardStepForm
    extends ContentWizardStepForm {

    private static BASE_URL_INPUT_PROP = 'portalBaseUrl';

    private readonly dataChangeListener: () => void;

    private readonly debouncedBaseUrlChangeHandler: (event: PropertyValueChangedEvent) => void;

    constructor() {
        super();

        this.dataChangeListener = this.handleDataChange.bind(this);
        this.debouncedBaseUrlChangeHandler =
            AppHelper.debounce((event: PropertyValueChangedEvent) => this.doHandleBaseUrlChange(event), 500);
    }

    layout(formContext: ContentFormContext, data: PropertyTree, form: Form): Q.Promise<void> {
        return super.layout(formContext, data, this.createFormWithBaseUrl(form)).then(() => {
            const baseUrl = this.getBaseUrlValue();

            if (!StringHelper.isBlank(baseUrl)) { // Setting baseUrl input value from the site config
                const prop = data.getProperty(`.${SiteContentWizardStepForm.BASE_URL_INPUT_PROP}`);
                prop?.setValue(new Value(baseUrl, ValueTypes.STRING));
            }

            this.initBaseUrlListeners();
        });
    }

    update(data: PropertyTree, unchangedOnly: boolean = true): Q.Promise<void> {
        this.removeBaseUrlListeners();

        return super.update(data, unchangedOnly).then(() => {
            const baseUrl = this.getBaseUrlValue();

            if (!StringHelper.isBlank(baseUrl)) { // Setting baseUrl input value from the site config
                const prop = data.getProperty(`.${SiteContentWizardStepForm.BASE_URL_INPUT_PROP}`);
                prop?.setValue(new Value(baseUrl, ValueTypes.STRING));
            }

            this.initBaseUrlListeners();
        });
    }

    getData(): PropertyTree {
        const data = super.getData();
        const clonedData: PropertyTree = new PropertyTree(data.getRoot()); // copy
        clonedData.removeProperty(SiteContentWizardStepForm.BASE_URL_INPUT_PROP, 0); // Ensure the property is removed from the data tree
        this.movePortalSiteConfigFirst(clonedData);
        return clonedData;
    }

    private movePortalSiteConfigFirst(data: PropertyTree): void {
        const siteConfigs = data.getPropertyArray('siteConfig');

        const portalProp = siteConfigs?.getProperties().find((prop) => {
            return prop.getPropertySet().getString('applicationKey') === ApplicationKey.PORTAL.toString();
        });

        if (portalProp && portalProp.getIndex() !== 0) {
            siteConfigs.move(portalProp.getIndex(), 0); // Move portal config to the top
        }
    }

    private removeBaseUrlListeners(): void {
        this.data?.unChanged(this.dataChangeListener);
    }

    private initBaseUrlListeners(): void {
        this.data?.onChanged(this.dataChangeListener);
    }

    private handleDataChange(event: PropertyEvent): void {
        if (this.isBaseUrlInputPath(event.getPath()) && event instanceof PropertyValueChangedEvent) {
            this.debouncedBaseUrlChangeHandler(event);
        }
    }

    private doHandleBaseUrlChange(event: PropertyValueChangedEvent): void {
        const newValue = event.getNewValue();

        if (newValue.isNull()) {
            this.removePortalConfigIfEmpty();
        } else {
            this.addBaseUrlSiteConfig(newValue.getString());
        }
    }

    private isBaseUrlInputPath(path: PropertyPath): boolean {
        return path.toString() === `.${SiteContentWizardStepForm.BASE_URL_INPUT_PROP}`;
    }

    private createFormWithBaseUrl(siteForm: Form): Form { // Inserting baseUrl input between Description and Site Configurator
        const formBuilder = new FormBuilder().addFormItems(
            [siteForm.getFormItems()[0], this.createBaseUrlFormItem(), ...siteForm.getFormItems().slice(1)]);

        return new Form(formBuilder);
    }

    private createBaseUrlFormItem(): Input {
        return new InputBuilder().setName(SiteContentWizardStepForm.BASE_URL_INPUT_PROP).setInputType(TextLine.getName()).setLabel(
            i18n('field.baseUrl')).setHelpText(i18n('field.baseUrl.help')).setOccurrences(
            new OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).build();
    }

    private getBaseUrlValue(): string {
        const portalConfig = SiteConfigProviderRegistry.getConfigProvider()?.getConfig(ApplicationKey.PORTAL);

        return portalConfig?.getConfig().getString('baseUrl');
    }

    private removePortalConfigIfEmpty(): void {
        const registry = SiteConfigProviderRegistry.getConfigProvider();

        if (registry) {
            const portalAppConfig = registry.getConfig(ApplicationKey.PORTAL);

            if (portalAppConfig) {
                const prop = portalAppConfig.getConfig().getProperty('baseUrl');

                if (prop) {
                    portalAppConfig.getConfig().removeProperties([prop]);
                }

                if (portalAppConfig.getConfig().getSize() === 0) {
                    registry.removeConfig(ApplicationKey.PORTAL);
                }
            }
        }
    }

    private addBaseUrlSiteConfig(baseUrl: string): void {
        const registry = SiteConfigProviderRegistry.getConfigProvider();

        if (registry) {
            const portalAppConfig = registry.getConfig(ApplicationKey.PORTAL) || registry.addConfig(ApplicationKey.PORTAL);
            portalAppConfig.getConfig().setString('baseUrl', 0, baseUrl);
        }
    }
}
