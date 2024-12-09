import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {SaveAsTemplateAction} from '../../../../action/SaveAsTemplateAction';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {PageTemplateAndControllerForm} from './PageTemplateAndControllerForm';
import {ContentFormContext} from '../../../../../ContentFormContext';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {FormContextBuilder} from '@enonic/lib-admin-ui/form/FormContext';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {Descriptor} from '../../../../../page/Descriptor';
import {PageState} from '../../../PageState';
import {GetComponentDescriptorRequest} from '../../../../../resource/GetComponentDescriptorRequest';

export class PageInspectionPanel
    extends BaseInspectionPanel {

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
        this.pageTemplateAndControllerSelector.onSelectionChanged(() => {
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

    constructor(pageInspectionPanel: PageInspectionPanel) {
        this.pageInspectionPanel = pageInspectionPanel;
        this.initPropertyChangedListener();
    }

    private initPropertyChangedListener() {
        PageState.getEvents().onPageUpdated(() => {
            if (PageState.getState().hasController()) {
                this.refreshConfigForm();
            }
        });
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
    }

    refreshConfigForm() {
        if (this.configForm) {
            this.configForm.remove();
            this.configForm = null;
        }

        if (!PageState.getState()?.hasController()) {
            return;
        }

        const config: PropertyTree = PageState.getState()?.getConfig();
        const context: ContentFormContext = this.liveEditModel.getFormContext();
        const root: PropertySet = config ? config.getRoot() : null;

        new GetComponentDescriptorRequest(PageState.getState().getController().toString()).sendAndParse().then((descriptor: Descriptor) => {
            this.configForm = new FormView(context ? context : new FormContextBuilder().build(), descriptor.getConfig(), root);
            this.configForm.setLazyRender(false);
            this.pageInspectionPanel.appendChild(this.configForm);

            this.configForm.layout().catch(DefaultErrorHandler.handle);
        }).catch(DefaultErrorHandler.handle);
    }
}
