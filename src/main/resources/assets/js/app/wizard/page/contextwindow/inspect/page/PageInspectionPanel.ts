import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {SaveAsTemplateAction} from '../../../../action/SaveAsTemplateAction';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageModel} from '../../../../../../page-editor/PageModel';
import {PageMode} from '../../../../../page/PageMode';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {PageTemplateAndControllerForm} from './PageTemplateAndControllerForm';
import PropertyChangedEvent = api.PropertyChangedEvent;
import PropertyTree = api.data.PropertyTree;
import FormContextBuilder = api.form.FormContextBuilder;
import FormView = api.form.FormView;
import FormContext = api.form.FormContext;
import PageDescriptor = api.content.page.PageDescriptor;
import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;

export class PageInspectionPanel
    extends BaseInspectionPanel {

    private liveEditModel: LiveEditModel;

    private pageModel: PageModel;

    private pageTemplateAndControllerSelector: PageTemplateAndControllerSelector;

    private pageTemplateAndControllerForm: PageTemplateAndControllerForm;

    private inspectionHandler: BaseInspectionHandler;

    constructor(private saveAsTemplateAction: SaveAsTemplateAction) {
        super();
    }

    setModel(liveEditModel: LiveEditModel) {

        this.liveEditModel = liveEditModel;
        this.pageModel = liveEditModel.getPageModel();

        this.layout();
    }

    private layout() {
        this.removeChildren();

        this.pageTemplateAndControllerSelector = new PageTemplateAndControllerSelector(this.liveEditModel);
        this.pageTemplateAndControllerForm = new PageTemplateAndControllerForm(this.pageTemplateAndControllerSelector);
        this.pageTemplateAndControllerForm.onShown(() => this.saveAsTemplateAction.updateVisibility());
        this.pageTemplateAndControllerSelector.onOptionSelected(() => {
            this.saveAsTemplateAction.updateVisibility();
        });
        this.appendChild(this.pageTemplateAndControllerForm);

        const saveAsTemplateButton = new ActionButton(this.saveAsTemplateAction);
        saveAsTemplateButton.addClass('blue large save-as-template');
        this.pageTemplateAndControllerForm.appendChild(saveAsTemplateButton);
        this.saveAsTemplateAction.updateVisibility();

        this.inspectionHandler = new BaseInspectionHandler();

        this.inspectionHandler
            .setPageModel(this.pageModel)
            .setPageInspectionPanel(this)
            .setPageTemplateAndControllerForm(this.pageTemplateAndControllerForm)
            .setModel(this.liveEditModel);
    }

    refreshInspectionHandler(liveEditModel: LiveEditModel) {
        this.inspectionHandler.refreshConfigView(liveEditModel);
    }

    getName(): string {
        return i18n('live.view.insert.page');
    }
}

class BaseInspectionHandler {

    pageModel: PageModel;

    pageInspectionPanel: PageInspectionPanel;

    configForm: FormView;

    pageTemplateAndControllerForm: PageTemplateAndControllerForm;

    private propertyChangedListener: (event: PropertyChangedEvent) => void;

    setPageModel(value: PageModel): BaseInspectionHandler {
        this.pageModel = value;
        return this;
    }

    setPageInspectionPanel(value: PageInspectionPanel): BaseInspectionHandler {
        this.pageInspectionPanel = value;
        return this;
    }

    setPageTemplateAndControllerForm(value: PageTemplateAndControllerForm): BaseInspectionHandler {
        this.pageTemplateAndControllerForm = value;
        return this;
    }

    setModel(liveEditModel: LiveEditModel) {
        this.initListener(liveEditModel);

        this.showPageConfig(liveEditModel.getPageModel(), liveEditModel.getFormContext());
    }

    private initListener(liveEditModel: LiveEditModel) {
        let pageModel = liveEditModel.getPageModel();

        if (this.propertyChangedListener) {
            liveEditModel.getPageModel().unPropertyChanged(this.propertyChangedListener);
        }

        this.propertyChangedListener = (event: PropertyChangedEvent) => {
            if (this === event.getSource()) {
                return;
            }

            if ([PageModel.PROPERTY_CONFIG, PageModel.PROPERTY_CONTROLLER].indexOf(event.getPropertyName()) === -1) {
                return;
            }

            if (event.getPropertyName() === PageModel.PROPERTY_CONTROLLER) {
                // empty
            }

            let controller = pageModel.getController();
            if (controller) {
                this.refreshConfigForm(controller, pageModel.getConfig(), liveEditModel.getFormContext());
            }
        };

        pageModel.onPropertyChanged(this.propertyChangedListener);
    }

    private refreshConfigForm(pageDescriptor: PageDescriptor, config: PropertyTree, context: FormContext) {
        if (this.configForm) {
            this.configForm.remove();
            this.configForm = null;
        }

        if (!pageDescriptor) {
            return;
        }

        const root = config ? config.getRoot() : null;
        this.configForm = new FormView(context ? context : new FormContextBuilder().build(), pageDescriptor.getConfig(), root);
        this.pageInspectionPanel.appendChild(this.configForm);
        this.pageModel.setIgnorePropertyChanges(true);
        this.configForm.layout().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).finally(() => {
            this.pageModel.setIgnorePropertyChanges(false);
        }).done();
    }

    refreshConfigView(liveEditModel: LiveEditModel) {
        if (!this.pageModel.isPageTemplate()) {
            let pageModel = liveEditModel.getPageModel();
            let pageMode = pageModel.getMode();

            if (pageMode === PageMode.FORCED_TEMPLATE || pageMode === PageMode.AUTOMATIC) {
                this.showPageConfig(pageModel, liveEditModel.getFormContext());
            } else {
                throw new Error('Unsupported PageMode: ' + PageMode[pageMode]);
            }
        }
    }

    protected showPageConfig(pageModel: PageModel, formContext: FormContext) {
        this.refreshConfigForm(pageModel.getDescriptor(), pageModel.getConfig(), formContext);
    }
}
