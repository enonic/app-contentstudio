import * as Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {HtmlAreaResizeEvent} from '../text/HtmlAreaResizeEvent';
import {SiteConfiguratorDialog} from '../ui/siteconfigurator/SiteConfiguratorDialog';
import {ContentFormContext} from '../../ContentFormContext';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {FormValidityChangedEvent} from '@enonic/lib-admin-ui/form/FormValidityChangedEvent';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {FormState} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {GetApplicationRequest} from '../../resource/GetApplicationRequest';
import {ApplicationAddedEvent} from '../../site/ApplicationAddedEvent';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';

export interface SiteConfiguratorSelectedOptionViewParams {
    option: Option<Application>,
    siteConfig: ApplicationConfig,
    formContext: ContentFormContext,
    isNew?: boolean
}

export class SiteConfiguratorSelectedOptionView
    extends BaseSelectedOptionView<Application> {

    private readonly application: Application;

    private formView: FormView;

    private siteConfig: ApplicationConfig;

    private tempSiteConfig: ApplicationConfig;

    private siteConfigFormDisplayedListeners: { (applicationKey: ApplicationKey): void }[];

    private formContext: ContentFormContext;

    private isNew: boolean;

    private formValidityChangedHandler: { (event: FormValidityChangedEvent): void };

    private configureDialog: SiteConfiguratorDialog;

    private formViewStateOnDialogOpen: FormView;

    private namesAndIconView: NamesAndIconView;

    constructor(params: SiteConfiguratorSelectedOptionViewParams) {
        super(new BaseSelectedOptionViewBuilder<Application>().setOption(params.option));

        this.siteConfigFormDisplayedListeners = [];
        this.application = params.option.getDisplayValue();
        this.siteConfig = params.siteConfig;
        this.formContext = params.formContext;
        this.isNew = params.isNew;

        this.setEditable(this.application.getForm()?.getFormItems().length > 0);

        if (params.isNew) {
            this.onRendered(() => {
                this.saveOnFirstTimeRendered();
            });
        }
    }

    doRender(): Q.Promise<boolean> {
        this.namesAndIconView = this.createNamesAndIconView();

        this.appendChild(this.namesAndIconView);

        this.formValidityChangedHandler = (event: FormValidityChangedEvent) => {
            this.toggleClass('invalid', !event.isValid());
        };

        this.toggleClass('uninstalled', this.getOption().isEmpty() === true);
        this.toggleClass('stopped', this.application.getState() === Application.STATE_STOPPED);

        this.appendActionButtons();

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

        this.tempSiteConfig = this.makeTemporarySiteConfig();

        this.formView = this.createFormView(this.tempSiteConfig);
        this.bindValidationEvent(this.formView);

        const cancelCallback = () => {
            this.revertFormViewToGivenState(this.formViewStateOnDialogOpen);
        };

        const okCallback = (): void => {
            if (this.isConfigChanged()) {
                this.applyTemporaryConfig(this.tempSiteConfig);
                new ContentRequiresSaveEvent(this.formContext.getPersistedContent().getContentId()).fire();
            }
        };

        const siteConfiguratorDialog = new SiteConfiguratorDialog({
                application: this.application,
                formView: this.formView,
                okCallback: okCallback,
                cancelCallback: cancelCallback,
                isDirtyCallback: this.isConfigChanged.bind(this)
            }
        );

        const handleAvailableSizeChanged = () => siteConfiguratorDialog.handleAvailableSizeChanged();
        HtmlAreaResizeEvent.on(handleAvailableSizeChanged);

        siteConfiguratorDialog.onRemoved(() => {
            HtmlAreaResizeEvent.un(handleAvailableSizeChanged);
        });

        return siteConfiguratorDialog;
    }

    private saveOnFirstTimeRendered(): void {
        if (this.isConfigChanged()) {
            this.applyTemporaryConfig(this.tempSiteConfig);
            new ApplicationAddedEvent(this.siteConfig).fire();
        } else if (!this.configureDialog) {
            new ApplicationAddedEvent(this.siteConfig).fire();
        }
    }

    private isConfigChanged(): boolean {
        return this.tempSiteConfig && !this.tempSiteConfig.equals(this.siteConfig);
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
        tempSiteConfig.getConfig().forEach((property: Property) => {
            this.siteConfig.getConfig().setProperty(property.getName(), property.getIndex(), property.getValue());
        });

        this.siteConfig.getConfig().forEach((property: Property) => {
            const prop: Property = tempSiteConfig.getConfig().getProperty(property.getName(), property.getIndex());

            if (!prop) {
                this.siteConfig.getConfig().removeProperty(property.getName(), property.getIndex());
            }
        });
    }

    private makeTemporarySiteConfig(): ApplicationConfig {
        const propSet: PropertySet = (new PropertyTree(this.siteConfig.getConfig())).getRoot();
        return ApplicationConfig.create().setConfig(propSet).setApplicationKey(this.siteConfig.getApplicationKey()).build();
    }

    private createFormView(siteConfig: ApplicationConfig): FormView {
        const context: ContentFormContext =
            <ContentFormContext>this.formContext.cloneBuilder()
                .setApplicationKey(this.application.getApplicationKey())
                .setFormState(new FormState(this.isNew))
                .build();
        const formView: FormView =
            <FormView>new FormView(context, this.application.getForm(), siteConfig.getConfig()).addClass('site-form');

        formView.onLayoutFinished(() => {
            formView.displayValidationErrors(true);
            formView.validate(false, true);
            this.toggleClass('invalid', !formView.isValid());
            this.notifySiteConfigFormDisplayed(this.application.getApplicationKey());
            this.isNew = false;
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
