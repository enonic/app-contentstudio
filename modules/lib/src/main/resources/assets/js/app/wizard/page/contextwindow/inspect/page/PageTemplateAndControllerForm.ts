import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {SaveAsTemplateAction} from '../../../../action/SaveAsTemplateAction';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageTemplateAndControllerOption} from './PageTemplateAndSelectorViewer';
import Q from 'q';

export class PageTemplateAndControllerForm
    extends Form {

    private saveAsTemplateButton: ActionButton;
    private pageTemplateAndControllerSelector: PageTemplateAndControllerSelector;
    private fieldSet: Fieldset;

    constructor(private saveAsTemplateAction: SaveAsTemplateAction) {
        super('page-template-and-controller-form');

        this.pageTemplateAndControllerSelector = new PageTemplateAndControllerSelector();

        this.fieldSet = new Fieldset();
        const wrapper = new PageDropdownWrapper(this.pageTemplateAndControllerSelector);
        this.fieldSet.add(new FormItemBuilder(wrapper).setLabel(i18n('field.page.template')).build());

        this.saveAsTemplateButton = new ActionButton(saveAsTemplateAction);
        this.saveAsTemplateButton.addClass('blue large save-as-template');

        this.initListeners();
    }


    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.add(this.fieldSet);
            this.appendChild(this.saveAsTemplateButton);

            return rendered;
        });
    }

    private initListeners() {

        this.onShown(() => {
            // sync action with button, because it can go out of sync when changing action for hidden button
            this.saveAsTemplateAction.setVisible(this.saveAsTemplateButton.isVisible());
            this.saveAsTemplateAction.updateVisibility();
        });

        this.pageTemplateAndControllerSelector
            .onSelectionChanged(() => this.saveAsTemplateAction.updateVisibility());
    }

    public getSelectedTemplateOption(): PageTemplateAndControllerOption {
        return this.pageTemplateAndControllerSelector.getSelectedOption();
    }

    public setModel(liveEditModel: LiveEditModel): Q.Promise<number> {
        return this.pageTemplateAndControllerSelector.setModel(liveEditModel)
            .then((controllerCount) => {
                this.saveAsTemplateAction.updateVisibility();

                return controllerCount;
            });
    }
}

class PageDropdownWrapper
    extends FormInputEl {

    private readonly selector: PageTemplateAndControllerSelector;

    constructor(selector: PageTemplateAndControllerSelector) {
        super('div', 'content-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }


    getValue(): string {
        return this.selector.getSelectedOption()?.getKey();
    }
}
