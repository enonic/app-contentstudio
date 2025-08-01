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
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {Descriptor} from '../../../../../page/Descriptor';
import {PageState} from '../../../PageState';
import {GetComponentDescriptorRequest} from '../../../../../resource/GetComponentDescriptorRequest';
import {PageTemplateAndControllerOption} from './PageTemplateAndSelectorViewer';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';

export class PageInspectionPanel
    extends BaseInspectionPanel {

    private pageTemplateAndControllerSelector: PageTemplateAndControllerSelector;

    private pageTemplateAndControllerForm: PageTemplateAndControllerForm;

    private configForm: FormView;

    constructor(private saveAsTemplateAction: SaveAsTemplateAction) {
        super();

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.pageTemplateAndControllerSelector = new PageTemplateAndControllerSelector();
        this.pageTemplateAndControllerForm = new PageTemplateAndControllerForm(this.pageTemplateAndControllerSelector);
    }

    private initListeners() {
        this.pageTemplateAndControllerForm.onShown(() => this.saveAsTemplateAction.updateVisibility());
        this.pageTemplateAndControllerSelector.onSelectionChanged(() => {
            this.saveAsTemplateAction.updateVisibility();
        });

        PageState.getEvents().onPageUpdated(() => {
            if (PageState.getState().hasController()) {
                this.refreshConfigForm();
            }
        });
    }

    getSelectedValue(): PageTemplateAndControllerOption {
        return this.pageTemplateAndControllerSelector.getSelectedOption();
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;

        this.pageTemplateAndControllerSelector.setModel(this.liveEditModel);
        this.saveAsTemplateAction.updateVisibility();
        this.refreshConfigForm();
    }

    getName(): string {
        return i18n('widget.components.insert.page');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.insertChild(this.pageTemplateAndControllerForm, 0);

            const saveAsTemplateButton = new ActionButton({action: this.saveAsTemplateAction});
            this.pageTemplateAndControllerForm.appendChild(saveAsTemplateButton);

            return rendered;
        });
    }

    private refreshConfigForm(): void {
        if (this.configForm) {
            this.configForm.remove();
            this.configForm = null;
        }

        if (!PageState.getState()?.hasController()) {
            this.notifyLayoutListeners();
            return;
        }

        const config: PropertyTree = PageState.getState()?.getConfig();
        const context: ContentFormContext = this.liveEditModel?.getFormContext();
        const root: PropertySet = config ? config.getRoot() : null;

        new GetComponentDescriptorRequest(PageState.getState().getController().toString()).sendAndParse().then((descriptor: Descriptor) => {
            this.configForm = new FormView(context ? context : new FormContextBuilder().build(), descriptor.getConfig(), root);
            this.configForm.setLazyRender(false);
            this.appendChild(this.configForm);

            this.configForm.layout().catch(DefaultErrorHandler.handle);
        }).catch(DefaultErrorHandler.handle).finally(() => {
            this.notifyLayoutListeners();
        });
    }
}
