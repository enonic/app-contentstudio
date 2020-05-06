import {Element} from 'lib-admin-ui/dom/Element';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Action} from 'lib-admin-ui/ui/Action';
import {PublishContentAction} from '../browse/action/PublishContentAction';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {FoldButton} from 'lib-admin-ui/ui/toolbar/FoldButton';

export class MobilePreviewFoldButton
    extends FoldButton {

    constructor(actions: Action[], hostElement: Element) {
        super('', hostElement);

        this.addClass('mobile-preview-fold-button');
        this.addActions(actions);
    }

    private addElement(button: ActionButton) {
        let buttonWidth = button.getEl().getWidthWithBorder();
        this.push(button, buttonWidth);
    }

    private addAction(action: Action) {
        let button = new ActionButton(action);
        if (ObjectHelper.iFrameSafeInstanceOf(action, PublishContentAction)) {
            button.addClass('publish');
        }
        this.addElement(button);
    }

    private addActions(actions: Action[]) {
        actions.forEach((action) => {
            this.addAction(action);
        });
    }
}
