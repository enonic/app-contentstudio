import * as Q from 'q';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {FormView} from 'lib-admin-ui/form/FormView';
import {Application} from 'lib-admin-ui/application/Application';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationConfig} from 'lib-admin-ui/application/ApplicationConfig';
import {GetApplicationRequest} from 'lib-admin-ui/application/GetApplicationRequest';
import {HtmlAreaResizeEvent} from '../text/HtmlAreaResizeEvent';
import {SiteConfiguratorDialog} from '../ui/siteconfigurator/SiteConfiguratorDialog';
import {ContentFormContext} from '../../ContentFormContext';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {BaseSelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {FormValidityChangedEvent} from 'lib-admin-ui/form/FormValidityChangedEvent';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';

export class SiteConfiguratorSelectedOptionView
    extends BaseSelectedOptionView<Application> {

    private application: Application;

    private formView: FormView;

    private siteConfig: ApplicationConfig;

    private siteConfigFormDisplayedListeners: { (applicationKey: ApplicationKey): void }[];

    private formContext: ContentFormContext;

    private formValidityChangedHandler: { (event: FormValidityChangedEvent): void };

    private configureDialog: SiteConfiguratorDialog;

    private formViewStateOnDialogOpen: FormView;

    private namesAndIconView: NamesAndIconView;

    constructor(option: Option<Application>, siteConfig: ApplicationConfig, formContext: ContentFormContext) {
        super(option);

        this.siteConfigFormDisplayedListeners = [];

        this.application = option.getDisplayValue();
        this.siteConfig = siteConfig;
        this.formContext = formContext;

        if (!this.application.getForm() || this.application.getForm().getFormItems().length === 0) {
            this.setEditable(false);
        }
    }

    doRender(): Q.Promise<boolean> {
        this.namesAndIconView = this.createNamesAndIconView();

        const header: DivEl = new DivEl('header');
        header.appendChild(this.namesAndIconView);

        this.appendChild(header);

        this.formValidityChangedHandler = (event: FormValidityChangedEvent) => {
            this.toggleClass('invalid', !event.isValid());
        };

        this.toggleClass('uninstalled', this.getOption().isEmpty() === true);
        this.toggleClass('stopped', this.application.getState() === Application.STATE_STOPPED);

        this.appendActionButtons(header);

        this.configureDialog = this.initConfigureDialog();

        if (this.configureDialog) {
            return this.formView.layout().then(() => Q(true));
        }

        return Q(true);
    }

    private createNamesAndIconView() {
        const namesAndIconView: NamesAndIconView = new NamesAndIconView(new NamesAndIconViewBuilder().setSize(
            NamesAndIconViewSize.small)).setMainName(this.application.getDisplayName()).setSubName(
            this.application.getName() + (!!this.application.getVersion() ? '-' + this.application.getVersion() : ''));

        if (this.application.getIconUrl()) {
            namesAndIconView.setIconUrl(this.application.getIconUrl());
        }

        if (this.application.getDescription()) {
            namesAndIconView.setSubName(this.application.getDescription());
        }

        return namesAndIconView;
    }

    setSiteConfig(siteConfig: ApplicationConfig) {
        this.siteConfig = siteConfig;
    }

    update() {
        new GetApplicationRequest(this.application.getApplicationKey()).sendAndParse().then((app: Application) => {
            if (app.getIconUrl()) {
                this.namesAndIconView.setIconUrl(app.getIconUrl());
            }

            if (app.getDescription()) {
                this.namesAndIconView.setSubName(app.getDescription());
            }

            this.namesAndIconView.setMainName(app.getDisplayName());
        }).catch(DefaultErrorHandler.handle).done();
    }

    protected onEditButtonClicked(e: MouseEvent) {
        this.showConfigureDialog();

        return super.onEditButtonClicked(e);
    }

    showConfigureDialog() {

        if (this.formView) {
            this.formViewStateOnDialogOpen = this.formView;
            this.unbindValidationEvent(this.formViewStateOnDialogOpen);
        }

        this.configureDialog = this.initConfigureDialog();
        if (this.configureDialog) {
            this.configureDialog.open();
        }
    }

    private initConfigureDialog(): SiteConfiguratorDialog {
        if (!this.isEditable()) {
            if (!this.formView) {
                this.formView = this.createFormView(this.siteConfig);
            }
            return null;
        }

        if (this.formView) {
            this.formView.remove();
        }
        const tempSiteConfig: ApplicationConfig = this.makeTemporarySiteConfig();

        this.formView = this.createFormView(tempSiteConfig);
        this.bindValidationEvent(this.formView);

        const okCallback = () => {
            if (!tempSiteConfig.equals(this.siteConfig)) {
                this.applyTemporaryConfig(tempSiteConfig);
                new ContentRequiresSaveEvent(this.formContext.getPersistedContent().getContentId()).fire();
            }
        };

        const cancelCallback = () => {
            this.revertFormViewToGivenState(this.formViewStateOnDialogOpen);
        };

        const siteConfiguratorDialog = new SiteConfiguratorDialog(this.application,
            this.formView,
            okCallback,
            cancelCallback
        );

        const handleAvailableSizeChanged = () => siteConfiguratorDialog.handleAvailableSizeChanged();
        HtmlAreaResizeEvent.on(handleAvailableSizeChanged);

        siteConfiguratorDialog.onRemoved(() => {
            HtmlAreaResizeEvent.un(handleAvailableSizeChanged);
        });

        return siteConfiguratorDialog;
    }

    private revertFormViewToGivenState(formViewStateToRevertTo: FormView) {
        this.unbindValidationEvent(this.formView);

        if (this.formView) {
            this.formView.remove();
        }

        this.formView = formViewStateToRevertTo;
        this.formView.validate(false, true);
        this.toggleClass('invalid', !this.formView.isValid());
    }

    private applyTemporaryConfig(tempSiteConfig: ApplicationConfig) {
        tempSiteConfig.getConfig().forEach((property) => {
            this.siteConfig.getConfig().setProperty(property.getName(), property.getIndex(), property.getValue());
        });
        this.siteConfig.getConfig().forEach((property) => {
            let prop = tempSiteConfig.getConfig().getProperty(property.getName(), property.getIndex());
            if (!prop) {
                this.siteConfig.getConfig().removeProperty(property.getName(), property.getIndex());
            }
        });
    }

    private makeTemporarySiteConfig(): ApplicationConfig {
        let propSet = (new PropertyTree(this.siteConfig.getConfig())).getRoot();
        return ApplicationConfig.create().setConfig(propSet).setApplicationKey(this.siteConfig.getApplicationKey()).build();
    }

    private createFormView(siteConfig: ApplicationConfig): FormView {
        let formView = new FormView(this.formContext, this.application.getForm(), siteConfig.getConfig());
        formView.addClass('site-form');

        formView.onLayoutFinished(() => {
            formView.displayValidationErrors(true);
            formView.validate(false, true);
            this.toggleClass('invalid', !formView.isValid());
            this.notifySiteConfigFormDisplayed(this.application.getApplicationKey());
        });

        return formView;
    }

    private bindValidationEvent(formView: FormView) {
        if (formView) {
            formView.onValidityChanged(this.formValidityChangedHandler);
        }
    }

    private unbindValidationEvent(formView: FormView) {
        if (formView) {
            formView.unValidityChanged(this.formValidityChangedHandler);
        }
    }

    getApplication(): Application {
        return this.application;
    }

    getSiteConfig(): ApplicationConfig {
        return this.siteConfig;
    }

    getFormView(): FormView {
        return this.formView;
    }

    onSiteConfigFormDisplayed(listener: { (applicationKey: ApplicationKey): void; }) {
        this.siteConfigFormDisplayedListeners.push(listener);
    }

    unSiteConfigFormDisplayed(listener: { (applicationKey: ApplicationKey): void; }) {
        this.siteConfigFormDisplayedListeners =
            this.siteConfigFormDisplayedListeners.filter((curr) => (curr !== listener));
    }

    private notifySiteConfigFormDisplayed(applicationKey: ApplicationKey) {
        this.siteConfigFormDisplayedListeners.forEach((listener) => listener(applicationKey));
    }
}
