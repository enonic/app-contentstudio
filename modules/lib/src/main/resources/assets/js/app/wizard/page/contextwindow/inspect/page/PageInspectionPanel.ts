import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
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
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';

export class PageInspectionPanel
    extends BaseInspectionPanel {

    private pageTemplateAndControllerForm: PageTemplateAndControllerForm;

    private noControllerMessage: PEl;

    private configForm: FormView;

    constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.pageTemplateAndControllerForm = new PageTemplateAndControllerForm();
        this.noControllerMessage = new PEl('no-controller-message');
        this.noControllerMessage.setHtml(i18n('text.notemplatesorblocks'));
    }

    private initListeners() {
        PageState.getEvents().onPageUpdated(() => {
            if (PageState.getState().hasController()) {
                this.refreshConfigForm();
            }
        });
    }

    getSelectedValue(): PageTemplateAndControllerOption {
        return this.pageTemplateAndControllerForm.getSelectedTemplateOption();
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;

        this.pageTemplateAndControllerForm.setModel(liveEditModel).then((controllerCount) => {

            const showForm = PageState.getState()?.hasController() || controllerCount > 0;

            this.pageTemplateAndControllerForm.setVisible(showForm);
            this.noControllerMessage.setVisible(!showForm);

            this.refreshConfigForm();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.insertChild(this.pageTemplateAndControllerForm, 0);

            this.appendChild(this.noControllerMessage);

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
