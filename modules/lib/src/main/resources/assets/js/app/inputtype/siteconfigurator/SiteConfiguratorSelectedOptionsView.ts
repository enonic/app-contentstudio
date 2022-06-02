import {Application, ApplicationBuilder} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {ContentFormContext} from '../../ContentFormContext';
import {ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';

export class SiteConfiguratorSelectedOptionsView
    extends BaseSelectedOptionsView<Application> {

    private siteConfigProvider: ApplicationConfigProvider;

    private siteConfigFormDisplayedListeners: { (applicationKey: ApplicationKey, formView: FormView): void }[] = [];

    private formContext: ContentFormContext;

    private items: SiteConfiguratorSelectedOptionView[] = [];

    constructor(siteConfigProvider: ApplicationConfigProvider, formContext: ContentFormContext) {
        super();
        this.siteConfigProvider = siteConfigProvider;
        this.formContext = formContext;

        this.siteConfigProvider.onPropertyChanged(() => {

            this.items.forEach((optionView: SiteConfiguratorSelectedOptionView) => {
                const newConfig: ApplicationConfig =
                    this.siteConfigProvider.getConfig(optionView.getSiteConfig().getApplicationKey(), false);
                if (newConfig) {
                    optionView.setSiteConfig(newConfig);
                }
            });

        });

        this.setOccurrencesSortable(true);
    }

    makeEmptyOption(id: string): Option<Application> {
        const key: ApplicationKey = ApplicationKey.fromString(id);
        const emptyApp: ApplicationBuilder = new ApplicationBuilder();
        emptyApp.applicationKey = key;
        emptyApp.displayName = id;

        return Option.create<Application>()
            .setValue(id)
            .setDisplayValue(emptyApp.build())
            .setEmpty(true)
            .build();
    }

    createSelectedOption(option: Option<Application>): SelectedOption<Application> {
        const siteConfig: ApplicationConfig = this.siteConfigProvider.getConfig(option.getDisplayValue().getApplicationKey());
        const optionView: SiteConfiguratorSelectedOptionView = new SiteConfiguratorSelectedOptionView(option, siteConfig, this.formContext);

        optionView.setReadonly(this.readonly);

        optionView.onSiteConfigFormDisplayed((applicationKey: ApplicationKey) => {
            this.notifySiteConfigFormDisplayed(applicationKey, optionView.getFormView());
        });

        this.items.push(optionView);

        return new SelectedOption<Application>(optionView, this.count());
    }

    removeOption(optionToRemove: Option<Application>, silent: boolean = false) {
        this.items = this.items
            .filter(item => !item.getSiteConfig().getApplicationKey().equals(optionToRemove.getDisplayValue().getApplicationKey()));
        super.removeOption(optionToRemove, silent);
    }

    onSiteConfigFormDisplayed(listener: { (applicationKey: ApplicationKey, formView: FormView): void; }) {
        this.siteConfigFormDisplayedListeners.push(listener);
    }

    unSiteConfigFormDisplayed(listener: { (applicationKey: ApplicationKey, formView: FormView): void; }) {
        this.siteConfigFormDisplayedListeners =
            this.siteConfigFormDisplayedListeners.filter((curr) => (curr !== listener));
    }

    private notifySiteConfigFormDisplayed(applicationKey: ApplicationKey, formView: FormView) {
        this.siteConfigFormDisplayedListeners.forEach((listener) => listener(applicationKey, formView));
    }

}
