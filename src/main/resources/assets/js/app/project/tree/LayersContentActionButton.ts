import {LayerContent} from '../../view/context/widget/layers/LayerContent';
import {ProjectContext} from '../ProjectContext';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class LayersContentActionButton extends ActionButton {

    private item: LayerContent;

    constructor(item: LayerContent) {
        super(new Action());

        this.item = item;

        this.getAction().setLabel(this.getLabelText());

        this.getAction().onExecuted(() => {
            new EditContentEvent([this.item.getItem()], this.item.getProject()).fire();
        });

        this.onClicked((event: MouseEvent) => {
            event.stopPropagation();
        });
    }

    private getLabelText(): string {
        const isCurrentProject: boolean = this.item.getProject().getName() === ProjectContext.get().getProject().getName();
        const isInherited: boolean = this.item.getItem().isInherited();

        if (isCurrentProject) {
            return isInherited ? i18n('action.translate') : i18n('action.edit');
        }

        return i18n('action.open');
    }
}
