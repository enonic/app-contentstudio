import {Application} from 'lib-admin-ui/application/Application';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationViewer} from 'lib-admin-ui/application/ApplicationViewer';
import {FormView} from 'lib-admin-ui/form/FormView';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ApplicationConfigProvider} from 'lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {SiteConfiguratorSelectedOptionsView} from './SiteConfiguratorSelectedOptionsView';
import {SiteConfiguratorSelectedOptionView} from './SiteConfiguratorSelectedOptionView';
import {ContentFormContext} from '../../ContentFormContext';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SiteApplicationLoader} from '../../application/SiteApplicationLoader';

export class SiteConfiguratorComboBox
    extends RichComboBox<Application> {

    private siteConfiguratorSelectedOptionsView: SiteConfiguratorSelectedOptionsView;

    constructor(maxOccurrences: number, siteConfigProvider: ApplicationConfigProvider,
                formContext: ContentFormContext, value?: string) {

        const filterObject = {
            state: Application.STATE_STARTED
        };

        const builder: RichComboBoxBuilder<Application> = new RichComboBoxBuilder<Application>();
        builder
            .setMaximumOccurrences(maxOccurrences)
            .setIdentifierMethod('getApplicationKey')
            .setComboBoxName('applicationSelector')
            .setLoader(new SiteApplicationLoader(filterObject))
            .setSelectedOptionsView(new SiteConfiguratorSelectedOptionsView(siteConfigProvider, formContext))
            .setOptionDisplayValueViewer(new ApplicationViewer()).setValue(value)
            .setDelayedInputValueChangedHandling(500)
            .setDisplayMissingSelectedOptions(true);

        super(builder);

        this.siteConfiguratorSelectedOptionsView = <SiteConfiguratorSelectedOptionsView>builder.getSelectedOptionsView();

        this.addClass('site-configurator-combobox');
    }

    getSelectedOptionViews(): SiteConfiguratorSelectedOptionView[] {
        let views: SiteConfiguratorSelectedOptionView[] = [];
        this.getSelectedOptions().forEach((selectedOption: SelectedOption<Application>) => {
            views.push(<SiteConfiguratorSelectedOptionView>selectedOption.getOptionView());
        });
        return views;
    }

    getSelectedOptionsView(): SiteConfiguratorSelectedOptionsView {
        return this.siteConfiguratorSelectedOptionsView;
    }

    onSiteConfigFormDisplayed(listener: { (applicationKey: ApplicationKey, formView: FormView): void; }) {
        this.siteConfiguratorSelectedOptionsView.onSiteConfigFormDisplayed(listener);
    }

    unSiteConfigFormDisplayed(listener: { (applicationKey: ApplicationKey, formView: FormView): void; }) {
        this.siteConfiguratorSelectedOptionsView.unSiteConfigFormDisplayed(listener);
    }

}
