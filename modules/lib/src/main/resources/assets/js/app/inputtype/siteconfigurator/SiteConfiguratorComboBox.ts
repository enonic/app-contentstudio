import {Application} from '@enonic/lib-admin-ui/application/Application';
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

interface SiteConfiguratorComboBoxOptions extends ListBoxInputOptions<Application> {
    loader: SiteApplicationLoader;
}

export class SiteConfiguratorComboBox
    extends FilterableListBoxWrapperWithSelectedView<Application> {

    protected options: SiteConfiguratorComboBoxOptions;

    private readonly siteConfiguratorSelectedOptionsView: SiteConfiguratorSelectedOptionsView;

    constructor(maxOccurrences: number, siteConfigProvider: ApplicationConfigProvider,
                formContext: ContentFormContext, value?: string) {

        const filterObject = {
            state: Application.STATE_STARTED
        };
        const loader = new SiteApplicationLoader(filterObject);
        const selectedOptionsView = new SiteConfiguratorSelectedOptionsView(siteConfigProvider, formContext);

        super(new SiteConfiguratorListBox(), {
            maxSelected:  0,
            selectedOptionsView: selectedOptionsView,
            className: 'site-configurator-combobox',
            loader: loader,
        } as SiteConfiguratorComboBoxOptions);

        this.siteConfiguratorSelectedOptionsView = selectedOptionsView;
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

        this.listBox.whenShown(() => {
            // if not empty then search will be performed after finished typing
            if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
                this.search(this.optionFilterInput.getValue());
            }
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
        return this.siteConfiguratorSelectedOptionsView;
    }

    onSiteConfigFormDisplayed(listener: (applicationKey: ApplicationKey, formView: FormView) => void) {
        this.siteConfiguratorSelectedOptionsView.onSiteConfigFormDisplayed(listener);
    }

    unSiteConfigFormDisplayed(listener: (applicationKey: ApplicationKey, formView: FormView) => void) {
        this.siteConfiguratorSelectedOptionsView.unSiteConfigFormDisplayed(listener);
    }

    onOptionMoved(handler: (selectedOption: SelectedOption<Application>, fromIndex: number) => void): void {
        this.selectedOptionsView.onOptionMoved(handler);
    }

    getLoader(): SiteApplicationLoader {
        return this.options.loader;
    }

    getSelectedOption(item: Application): SelectedOption<Application> {
        return this.siteConfiguratorSelectedOptionsView.getById(item.getApplicationKey().toString());
    }

    getSelectedOptionByKey(key: string): SelectedOption<Application> {
        return this.siteConfiguratorSelectedOptionsView.getById(key);
    }

    getListSize(): number {
        return this.listBox.getItemCount();
    }

    selectByKey(key: string, silent?: boolean): void {
        const app = this.getLoader().getResults().find((app: Application) => app.getApplicationKey().toString() === key) ||
                    this.listBox.getItem(key);

        if (app) {
            this.select(app, silent);
        }
    }
}
