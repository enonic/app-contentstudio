import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import * as Q from 'q';
import {ProjectSelectedApplicationViewer} from './ProjectSelectedApplicationViewer';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {SiteConfiguratorDialog} from '../../../../../inputtype/ui/siteconfigurator/SiteConfiguratorDialog';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {FormContext} from '@enonic/lib-admin-ui/form/FormContext';
import {FormState} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {FormValidityChangedEvent} from '@enonic/lib-admin-ui/form/FormValidityChangedEvent';
import {ProjectApplication} from './ProjectApplication';
import {ContentFormContext} from '../../../../../ContentFormContext';
import {Project} from '../../../../data/project/Project';

export class ProjectApplicationSelectedOptionView
    extends BaseSelectedOptionView<Application> {

    private projectApplicationViewer: ProjectSelectedApplicationViewer;

    private configureDialog?: SiteConfiguratorDialog;

    private currentConfigSet?: PropertySet;

    private formView?: FormView;

    private project?: Project;

    private dataChangedHandler?: () => void;

    constructor(builder: ProjectApplicationSelectedOptionViewBuilder) {
        super(builder);

        this.project = builder.project;
    }

    doRender(): Q.Promise<boolean> {
        this.projectApplicationViewer = new ProjectSelectedApplicationViewer();
        this.projectApplicationViewer.setObject(this.getOption().getDisplayValue());

        this.appendChild(this.projectApplicationViewer);
        this.appendActionButtons();

        return Q(true);
    }

    layoutForm(): Q.Promise<void> {
        if (!this.formView) {
            this.formView = this.createFormView();
            return this.formView.layout();
        }

        return this.revertFormView();
    }

    setConfig(config: PropertySet): ProjectApplicationSelectedOptionView {
        this.currentConfigSet = config;
        return this;
    }

    setDataChangedHandler(handler: () => void): ProjectApplicationSelectedOptionView {
        this.dataChangedHandler = handler;
        return this;
    }

    getCurrentConfig(): ProjectApplication {
        const app: Application = this.getOption().getDisplayValue();

        const config: ApplicationConfig = ApplicationConfig.create()
            .setApplicationKey(app.getApplicationKey())
            .setConfig(this.formView.getData())
            .build();

        return new ProjectApplication(app, config);
    }

    protected onEditButtonClicked(e: MouseEvent): boolean {
        this.showConfigurationDialog();

        return super.onEditButtonClicked(e);
    }

    private showConfigurationDialog(): void {
        if (!this.configureDialog) {
            this.initConfigurationDialog();
        }

        this.configureDialog.open();
    }

    private initConfigurationDialog(): void {
        this.configureDialog = new SiteConfiguratorDialog({
                application: this.getOption().getDisplayValue(),
                formView: this.formView,
                isDirtyCallback: this.isDialogDataDirty.bind(this),
                okCallback: this.applyConfig.bind(this),
                cancelCallback: this.revertFormView.bind(this)
            }
        );
    }

    private isDialogDataDirty(): boolean {
        return !this.currentConfigSet.equals(this.formView.getData());
    }

    private applyConfig(): void {
        this.currentConfigSet = new PropertyTree(this.formView.getData()).getRoot();

        if (this.dataChangedHandler) {
            this.dataChangedHandler();
        }
    }

    private revertFormView(): Q.Promise<void> {
        return this.formView.update(new PropertyTree(this.currentConfigSet).getRoot());
    }

    private createFormView(): FormView {
        const app: Application = this.getOption().getDisplayValue();
        const isNew: boolean = !this.currentConfigSet;
        const propSet: PropertySet = new PropertyTree(isNew ? new PropertySet() : this.currentConfigSet).getRoot();
        const context: FormContext = ContentFormContext.create()
            .setProject(this.project)
            .setApplicationKey(app.getApplicationKey())
            .setFormState(new FormState(isNew))
            .build();
        const formView: FormView = new FormViewWrapper(context, app.getForm(), propSet);

        formView.onLayoutFinished(() => {
            formView.displayValidationErrors(true);
            formView.validate(false, true);

            if (isNew) {
                this.currentConfigSet = new PropertyTree(formView.getData()).getRoot();
            }
        });

        formView.onValidityChanged((event: FormValidityChangedEvent) => {
            this.toggleClass('invalid', !event.isValid());
        });

        return formView;
    }
}

export class ProjectApplicationSelectedOptionViewBuilder extends BaseSelectedOptionViewBuilder<Application> {

    project?: Project;

    setProject(value: Project): this {
        this.project = value;
        return this;
    }
}

class FormViewWrapper extends FormView {

    layout(validate?: boolean): Q.Promise<void> {
        return this.isLayoutFinished() ? Q.resolve() : super.layout(validate);
    }
}
