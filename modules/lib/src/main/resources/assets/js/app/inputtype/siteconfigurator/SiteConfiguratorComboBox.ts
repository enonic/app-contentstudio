import {Application, ApplicationBuilder} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {SiteConfiguratorSelectedOptionsView} from './SiteConfiguratorSelectedOptionsView';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {ContentFormContext} from '../../ContentFormContext';
import {SiteApplicationLoader} from '../../application/SiteApplicationLoader';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {SiteConfiguratorListBox} from './SiteConfiguratorListBox';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {TextLine} from '@enonic/lib-admin-ui/form/inputtype/text/TextLine';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';

interface SiteConfiguratorComboBoxOptions
    extends ListBoxInputOptions<Application> {
    loader: SiteApplicationLoader;
}

export class SiteConfiguratorComboBox
    extends FilterableListBoxWrapperWithSelectedView<Application> {

    declare protected options: SiteConfiguratorComboBoxOptions;

    declare protected selectedOptionsView: SiteConfiguratorSelectedOptionsView;

    constructor(maxOccurrences: number, siteConfigProvider: ApplicationConfigProvider,
                formContext: ContentFormContext, value?: string) {

        super(new SiteConfiguratorListBox(), {
            maxSelected: maxOccurrences,
            selectedOptionsView: new SiteConfiguratorSelectedOptionsView(siteConfigProvider, formContext),
            className: 'site-configurator-combobox',
            loader: new SiteApplicationLoader({
                state: Application.STATE_STARTED
            }),
        } as SiteConfiguratorComboBoxOptions);
    }

    protected initListeners(): void {
        super.initListeners();

        this.options.loader.onLoadedData((event: LoadedDataEvent<Application>) => {
            const entries = event.getData();

            if (event.isPostLoad()) {
                this.listBox.addItems(entries);
            } else {
                this.listBox.setItems(entries);
            }
            return Q.resolve(null);
        });

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
    }

    protected loadListOnShown(): void {
        if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
            this.search(this.optionFilterInput.getValue());
        }
    }

    protected search(value?: string): void {
        this.options.loader.search(value).catch(DefaultErrorHandler.handle);
    }

    createSelectedOption(item: Application): Option<Application> {
        return Option.create<Application>()
            .setValue(item.getApplicationKey().toString())
            .setDisplayValue(item)
            .build();
    }

    getSelectedOptionViews(): SiteConfiguratorSelectedOptionView[] {
        let views: SiteConfiguratorSelectedOptionView[] = [];
        this.getSelectedOptions().forEach((selectedOption: SelectedOption<Application>) => {
            views.push(selectedOption.getOptionView() as SiteConfiguratorSelectedOptionView);
        });
        return views;
    }

    getSelectedOptionsView(): SiteConfiguratorSelectedOptionsView {
        return this.selectedOptionsView;
    }

    onSiteConfigFormDisplayed(listener: (applicationKey: ApplicationKey, formView: FormView) => void) {
        this.selectedOptionsView.onSiteConfigFormDisplayed(listener);
    }

    unSiteConfigFormDisplayed(listener: (applicationKey: ApplicationKey, formView: FormView) => void) {
        this.selectedOptionsView.unSiteConfigFormDisplayed(listener);
    }

    onOptionMoved(handler: (selectedOption: SelectedOption<Application>, fromIndex: number) => void): void {
        this.selectedOptionsView.onOptionMoved(handler);
    }

    getLoader(): SiteApplicationLoader {
        return this.options.loader;
    }

    getSelectedOption(item: Application): SelectedOption<Application> {
        return this.selectedOptionsView.getById(item.getApplicationKey().toString());
    }

    getSelectedOptionByKey(key: string): SelectedOption<Application> {
        return this.selectedOptionsView.getById(key);
    }

    getListSize(): number {
        return this.listBox.getItemCount();
    }

    selectByKey(key: string, silent?: boolean): void {
        const appKey = ApplicationKey.fromString(key);
        const app = appKey.equals(ApplicationKey.PORTAL) ?
                    this.createPortalApp() :
                    this.getLoader().getResults()?.find((app: Application) => app.getApplicationKey().toString() === key) ||
                    this.listBox.getItem(key);

        if (app) {
            this.select(app, silent);
        }
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
}
