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
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PageEventsManager} from '../../../../PageEventsManager';

export class PageTemplateAndControllerForm
    extends Form {

    private saveAsTemplateButton: ActionButton;
    private customizeButton: ActionButton;
    private pageTemplateAndControllerSelector: PageTemplateAndControllerSelector;
    private fieldSet: Fieldset;
    private isPageLocked: boolean;

    constructor(private saveAsTemplateAction: SaveAsTemplateAction, private customizeAction: Action) {
        super('page-template-and-controller-form');

        this.pageTemplateAndControllerSelector = new PageTemplateAndControllerSelector();

        this.fieldSet = new Fieldset();
        const wrapper = new PageDropdownWrapper(this.pageTemplateAndControllerSelector);
        this.fieldSet.add(new FormItemBuilder(wrapper).setLabel(i18n('field.page.template')).build());

        this.saveAsTemplateButton = new ActionButton(saveAsTemplateAction);
        this.saveAsTemplateButton.addClass('blue large');

        this.customizeButton = new ActionButton(customizeAction);
        this.customizeButton.addClass('blue large');

        this.initListeners();
    }


    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.add(this.fieldSet);

            const div = new DivEl('template-button-bar');
            div.appendChildren(this.saveAsTemplateButton, this.customizeButton);
            this.appendChild(div);

            return rendered;
        });
    }

    private updateCustomizeActionVisibility() {
        this.customizeAction.setVisible(this.isPageLocked);
    }

    private initListeners() {

        PageEventsManager.get().onPageLocked(() => {
            this.isPageLocked = true;
            this.updateCustomizeActionVisibility();
        });
        PageEventsManager.get().onPageUnlocked(() => {
            this.isPageLocked = false;
            this.updateCustomizeActionVisibility();
        });

        this.onShown(() => {
            // https://github.com/enonic/lib-admin-ui/issues/4139
            // sync action with button, because it can go out of sync when changing action for hidden button
            this.saveAsTemplateAction.setVisible(this.saveAsTemplateButton.isVisible());
            this.saveAsTemplateAction.updateVisibility();
            // sync action with button
            this.customizeAction.setVisible(this.customizeButton.isVisible());
            this.updateCustomizeActionVisibility();
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
