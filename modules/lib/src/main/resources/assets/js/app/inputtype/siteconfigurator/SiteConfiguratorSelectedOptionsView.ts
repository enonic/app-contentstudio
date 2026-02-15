import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type FormView} from '@enonic/lib-admin-ui/form/FormView';
import {type Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {type ContentFormContext} from '../../ContentFormContext';
import {type ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {type ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';

export class SiteConfiguratorSelectedOptionsView
    extends BaseSelectedOptionsView<Application> {

    private readonly siteConfigProvider: ApplicationConfigProvider;

    private siteConfigFormDisplayedListeners: ((applicationKey: ApplicationKey, formView: FormView) => void)[] = [];

    private readonly formContext: ContentFormContext;

    private items: SiteConfiguratorSelectedOptionView[] = [];

    constructor(siteConfigProvider: ApplicationConfigProvider, formContext: ContentFormContext) {
        super();
        this.siteConfigProvider = siteConfigProvider;
        this.formContext = formContext;

        this.initListeners();
        this.setOccurrencesSortable(true);
    }

    protected initListeners(): void {
        this.siteConfigProvider.onPropertyChanged(() => {
            this.items.forEach((optionView: SiteConfiguratorSelectedOptionView) => {
                const newConfig: ApplicationConfig = this.siteConfigProvider.getConfig(optionView.getSiteConfig().getApplicationKey());

                if (newConfig) {
                    optionView.setSiteConfig(newConfig);
                }
            });
        });
    }

    protected getEmptyDisplayValue(id: string): Application {
        return SiteConfiguratorSelectedOptionView.getEmptyDisplayValue(id);
    }

    createSelectedOption(option: Option<Application>): SelectedOption<Application> {
        const key: ApplicationKey = option.getDisplayValue().getApplicationKey();
        const existingConfig: ApplicationConfig = this.siteConfigProvider.getConfig(key);
        const siteConfig: ApplicationConfig = existingConfig || this.siteConfigProvider.addConfig(key);
        const optionView: SiteConfiguratorSelectedOptionView = new SiteConfiguratorSelectedOptionView({
            option: option,
            siteConfig: siteConfig,
            formContext: this.formContext,
            isNew: !existingConfig
        });

        optionView.setReadonly(this.readonly);

        optionView.onSiteConfigFormDisplayed((applicationKey: ApplicationKey) => {
            this.notifySiteConfigFormDisplayed(applicationKey, optionView.getFormView());
        });

        if (key.isSystemReserved()) {
            optionView.addClass('system-app');
        }

        this.items.push(optionView);

        return new SelectedOption<Application>(optionView, this.count());
    }

    removeOption(optionToRemove: Option<Application>, silent: boolean = false) {
        this.items = this.items
            .filter(item => !item.getSiteConfig().getApplicationKey().equals(optionToRemove.getDisplayValue().getApplicationKey()));
        super.removeOption(optionToRemove, silent);
    }

    onSiteConfigFormDisplayed(listener: (applicationKey: ApplicationKey, formView: FormView) => void) {
        this.siteConfigFormDisplayedListeners.push(listener);
    }

    unSiteConfigFormDisplayed(listener: (applicationKey: ApplicationKey, formView: FormView) => void) {
        this.siteConfigFormDisplayedListeners =
            this.siteConfigFormDisplayedListeners.filter((curr) => (curr !== listener));
    }

    private notifySiteConfigFormDisplayed(applicationKey: ApplicationKey, formView: FormView) {
        this.siteConfigFormDisplayedListeners.forEach((listener) => listener(applicationKey, formView));
    }

}
