import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {LayerContent} from './LayerContent';

export class LayerContentViewFooter extends DivEl {

    private layerContent: LayerContent;

    private actionButton: ActionButton;

    constructor(layerContent: LayerContent) {
        super('footer');

        this.layerContent = layerContent;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.actionButton = this.createActionButton();
    }

    private createActionButton(): ActionButton {
        const labelText: string = this.layerContent.getItem().isInherited() ? i18n('action.translate') : i18n('action.open');
        const button: ActionButton = new ActionButton(new Action(labelText));

        button.getAction().onExecuted(() => {
            new EditContentEvent([this.layerContent.getItem()]).fire();
        });

        return button;
    }

    private initListeners() {
        this.actionButton.onClicked((event: MouseEvent) => {
            event.stopPropagation();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.actionButton);

            return rendered;
        });
    }
}
