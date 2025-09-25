import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageTemplateAndControllerOption} from './PageTemplateAndSelectorViewer';
import Q from 'q';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PageEventsManager} from '../../../../PageEventsManager';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';

export class PageTemplateAndControllerForm
    extends Form {

    private readonly customizeButton: ActionButton;
    private readonly pageTemplateAndControllerSelector: PageTemplateAndControllerSelector;
    private readonly fieldSet: Fieldset;
    private readonly customizeAction: Action;
    private isPageLocked: boolean = false;
    private isPageRenderable: boolean = false;
    private liveEditModel: LiveEditModel;

    constructor() {
        super('page-template-and-controller-form');

        this.pageTemplateAndControllerSelector = new PageTemplateAndControllerSelector();

        this.fieldSet = new Fieldset();
        const wrapper = new PageDropdownWrapper(this.pageTemplateAndControllerSelector);
        this.fieldSet.add(new FormItemBuilder(wrapper).setLabel(i18n('field.page.template')).build());

        const unlockAction = new Action(i18n('live.view.page.customize'));
        unlockAction.onExecuted(() => {
            new ConfirmationDialog()
                .setQuestion(i18n('dialog.page.customize.confirmation'))
                .setYesCallback(() => () => PageEventsManager.get().notifyCustomizePageRequested())
                .open();
        });
        this.customizeAction = unlockAction;

        this.customizeButton = new ActionButton(this.customizeAction);
        this.customizeButton.addClass('large');

        this.initListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.add(this.fieldSet);

            const div = new DivEl('template-button-bar');
            div.appendChildren(this.customizeButton);
            this.appendChild(div);

            return rendered;
        });
    }

    private updateButtonsVisibility() {
        const isInherited = this.liveEditModel?.getContent().isInherited();
        this.customizeAction.setVisible(!isInherited && this.isPageLocked && this.isPageRenderable);

        // https://github.com/enonic/lib-admin-ui/issues/4139
        this.customizeButton.setVisible(this.customizeAction.isVisible());
    }

    private initListeners() {

        PageEventsManager.get().onPageLocked(() => {
            this.isPageLocked = true;
            this.updateButtonsVisibility();
        });
        PageEventsManager.get().onPageUnlocked(() => {
            this.isPageLocked = false;
            this.updateButtonsVisibility();
        });
        PageEventsManager.get().onRenderableChanged((renderable) => {
            this.isPageRenderable = renderable;
            this.updateButtonsVisibility();
        })
    }

    public getSelectedTemplateOption(): PageTemplateAndControllerOption {
        return this.pageTemplateAndControllerSelector.getSelectedOption();
    }

    public setModel(liveEditModel: LiveEditModel): Q.Promise<number> {
        this.liveEditModel = liveEditModel;
        return this.pageTemplateAndControllerSelector.setModel(liveEditModel)
            .then((controllerCount) => {
                this.updateButtonsVisibility();
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
