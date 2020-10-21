import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {SaveAsTemplateAction} from '../../../../action/SaveAsTemplateAction';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageModel} from '../../../../../../page-editor/PageModel';
import {PageMode} from '../../../../../page/PageMode';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {PageTemplateAndControllerForm} from './PageTemplateAndControllerForm';
import {ContentFormContext} from '../../../../../ContentFormContext';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {FormContextBuilder} from 'lib-admin-ui/form/FormContext';
import {FormView} from 'lib-admin-ui/form/FormView';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {PropertySet} from 'lib-admin-ui/data/PropertySet';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';

export class PageInspectionPanel
    extends BaseInspectionPanel {

    private liveEditModel: LiveEditModel;

    private pageTemplateAndControllerSelector: PageTemplateAndControllerSelector;

    private pageTemplateAndControllerForm: PageTemplateAndControllerForm;

    private inspectionHandler: BaseInspectionHandler;

    constructor(private saveAsTemplateAction: SaveAsTemplateAction) {
        super();

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.inspectionHandler = new BaseInspectionHandler(this);
        this.pageTemplateAndControllerSelector = new PageTemplateAndControllerSelector();
        this.pageTemplateAndControllerForm = new PageTemplateAndControllerForm(this.pageTemplateAndControllerSelector);
    }

    private initListeners() {
        this.pageTemplateAndControllerForm.onShown(() => this.saveAsTemplateAction.updateVisibility());
        this.pageTemplateAndControllerSelector.onOptionSelected(() => {
            this.saveAsTemplateAction.updateVisibility();
        });
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;

        this.pageTemplateAndControllerSelector.setModel(this.liveEditModel);
        this.saveAsTemplateAction.updateVisibility();
        this.inspectionHandler.setModel(this.liveEditModel);
        this.inspectionHandler.refreshConfigForm();
    }

    refreshInspectionHandler() {
        this.inspectionHandler.refreshConfigView();
    }

    getName(): string {
        return i18n('widget.components.insert.page');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.insertChild(this.pageTemplateAndControllerForm, 0);

            const saveAsTemplateButton = new ActionButton(this.saveAsTemplateAction);
            saveAsTemplateButton.addClass('blue large save-as-template');
            this.pageTemplateAndControllerForm.appendChild(saveAsTemplateButton);

            return rendered;
        });
    }
}

class BaseInspectionHandler {

    liveEditModel: LiveEditModel;

    pageInspectionPanel: PageInspectionPanel;

    configForm: FormView;

    private propertyChangedListener: (event: PropertyChangedEvent) => void;

    constructor(pageInspectionPanel: PageInspectionPanel) {
        this.pageInspectionPanel = pageInspectionPanel;
        this.initPropertyChangedListener();
    }

    private initPropertyChangedListener() {
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

            if (this.liveEditModel.getPageModel().hasController()) {
                this.refreshConfigForm();
            }
        };
    }

    setModel(liveEditModel: LiveEditModel) {
        this.unbindListeners();
        this.liveEditModel = liveEditModel;
        this.bindListeners();
    }

    private unbindListeners() {
        if (this.liveEditModel && this.liveEditModel.getPageModel()) {
            this.liveEditModel.getPageModel().unPropertyChanged(this.propertyChangedListener);
        }
    }

    private bindListeners() {
        this.liveEditModel.getPageModel().onPropertyChanged(this.propertyChangedListener);
    }

    refreshConfigForm() {
        if (this.configForm) {
            this.configForm.remove();
            this.configForm = null;
        }

        const pageModel: PageModel = this.liveEditModel.getPageModel();
        const pageDescriptor: PageDescriptor = pageModel.getDescriptor();

        if (!pageDescriptor || pageModel.getMode() === PageMode.FORCED_TEMPLATE || pageModel.getMode() === PageMode.AUTOMATIC) {
            return;
        }

        const config: PropertyTree = pageModel.getConfig();
        const context: ContentFormContext = this.liveEditModel.getFormContext();

        const root: PropertySet = config ? config.getRoot() : null;
        this.configForm = new FormView(context ? context : new FormContextBuilder().build(), pageDescriptor.getConfig(), root);
        this.configForm.setLazyRender(false);
        this.pageInspectionPanel.appendChild(this.configForm);
        this.liveEditModel.getPageModel().setIgnorePropertyChanges(true);
        this.configForm.layout().catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).finally(() => {
            this.liveEditModel.getPageModel().setIgnorePropertyChanges(false);
        }).done();
    }

    refreshConfigView() {
        if (!this.liveEditModel.getPageModel().isPageTemplate()) {
            const pageModel: PageModel = this.liveEditModel.getPageModel();
            const pageMode: PageMode = pageModel.getMode();
            if (pageMode === PageMode.FORCED_TEMPLATE || pageMode === PageMode.AUTOMATIC) {
                this.refreshConfigForm();
            } else {
                throw new Error('Unsupported PageMode: ' + PageMode[pageMode]);
            }
        }
    }
}
