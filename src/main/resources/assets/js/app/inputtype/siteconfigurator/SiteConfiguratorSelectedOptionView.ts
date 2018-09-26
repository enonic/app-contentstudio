import PropertyTree = api.data.PropertyTree;
import Option = api.ui.selector.Option;
import FormView = api.form.FormView;
import Application = api.application.Application;
import ApplicationKey = api.application.ApplicationKey;
import ApplicationConfig = api.application.ApplicationConfig;
import ContentFormContext = api.content.form.ContentFormContext;
import {HtmlAreaResizeEvent} from '../text/HtmlAreaResizeEvent';
import {HTMLAreaDialogHandler} from '../ui/text/dialog/HTMLAreaDialogHandler';
import {CreateHtmlAreaDialogEvent} from '../ui/text/CreateHtmlAreaDialogEvent';
import {SiteConfiguratorDialog} from '../ui/siteconfigurator/SiteConfiguratorDialog';

export class SiteConfiguratorSelectedOptionView
    extends api.ui.selector.combobox.BaseSelectedOptionView<Application> {

    private application: Application;

    private formView: FormView;

    private siteConfig: ApplicationConfig;

    private siteConfigFormDisplayedListeners: { (applicationKey: ApplicationKey): void }[];

    private formContext: ContentFormContext;

    private formValidityChangedHandler: { (event: api.form.FormValidityChangedEvent): void };

    private configureDialog: SiteConfiguratorDialog;

    private formViewStateOnDialogOpen: FormView;

    constructor(option: Option<Application>, siteConfig: ApplicationConfig, formContext: api.content.form.ContentFormContext) {
        super(option);

        this.siteConfigFormDisplayedListeners = [];

        this.application = option.displayValue;
        this.siteConfig = siteConfig;
        this.formContext = formContext;

        if (!this.application.getForm() || this.application.getForm().getFormItems().length === 0) {
            this.setEditable(false);
        }
    }

    doRender(): wemQ.Promise<boolean> {

        let header = new api.dom.DivEl('header');

        let namesAndIconView = new api.app.NamesAndIconView(new api.app.NamesAndIconViewBuilder().setSize(
            api.app.NamesAndIconViewSize.small)).setMainName(this.application.getDisplayName()).setSubName(
            this.application.getName() + (!!this.application.getVersion() ? '-' + this.application.getVersion() : ''));

        if (this.application.getIconUrl()) {
            namesAndIconView.setIconUrl(this.application.getIconUrl());
        }

        if (this.application.getDescription()) {
            namesAndIconView.setSubName(this.application.getDescription());
        }

        header.appendChild(namesAndIconView);

        this.appendChild(header);

        this.formValidityChangedHandler = (event: api.form.FormValidityChangedEvent) => {
            this.toggleClass('invalid', !event.isValid());
        };

        this.toggleClass('empty', this.getOption().empty === true);
        this.toggleClass('stopped', this.application.getState() === Application.STATE_STOPPED);

        this.formView = this.createFormView(this.siteConfig);

        this.appendActionButtons(header);

        this.configureDialog = this.initConfigureDialog();

        if (this.configureDialog) {
            return this.formView.layout().then(() => wemQ(true));
        }

        return wemQ(true);
    }

    setSiteConfig(siteConfig: ApplicationConfig) {
        this.siteConfig = siteConfig;
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

    initConfigureDialog(): SiteConfiguratorDialog {
        if (!this.isEditable()) {
            return null;
        }

        const tempSiteConfig: ApplicationConfig = this.makeTemporarySiteConfig();

        this.formView = this.createFormView(tempSiteConfig);
        this.bindValidationEvent(this.formView);

        const okCallback = () => {
            if (!tempSiteConfig.equals(this.siteConfig)) {
                this.applyTemporaryConfig(tempSiteConfig);
                new api.content.event.ContentRequiresSaveEvent(this.formContext.getPersistedContent().getContentId()).fire();
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
        const toggleMask = () => {
            siteConfiguratorDialog.toggleMask(true);
            HTMLAreaDialogHandler.getOpenDialog().onRemoved(() => {
                siteConfiguratorDialog.toggleMask(false);
            });
        };

        HtmlAreaResizeEvent.on(handleAvailableSizeChanged);
        CreateHtmlAreaDialogEvent.on(toggleMask);

        siteConfiguratorDialog.onRemoved(() => {
            HtmlAreaResizeEvent.un(handleAvailableSizeChanged);
            CreateHtmlAreaDialogEvent.un(toggleMask);
        });

        return siteConfiguratorDialog;
    }

    private revertFormViewToGivenState(formViewStateToRevertTo: FormView) {
        this.unbindValidationEvent(this.formView);
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
        propSet.setContainerProperty(this.siteConfig.getConfig().getProperty());
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
