import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {LayerContent} from './LayerContent';
import {ProjectContext} from '../../../../project/ProjectContext';

export class LayerContentViewFooter extends DivEl {

    private layerContent: LayerContent;

    private actionButton: ActionButton;

    constructor(layerContent: LayerContent, cls: string) {
        super(cls);

        this.layerContent = layerContent;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.actionButton = this.createActionButton();
    }

    private createActionButton(): ActionButton {
        const button: ActionButton = new ActionButton(new Action(this.getLabelText()));

        button.getAction().onExecuted(() => {
            new EditContentEvent([this.layerContent.getItem()], this.layerContent.getProject()).fire();
        });

        return button;
    }

    private initListeners() {
        this.actionButton.onClicked((event: MouseEvent) => {
            event.stopPropagation();
        });
    }

    private getLabelText(): string {
        const isCurrentProject: boolean = this.layerContent.getProject().getName() === ProjectContext.get().getProject().getName();
        const isInherited: boolean = this.layerContent.getItem().isInherited();

        if (isCurrentProject) {
            return isInherited ? i18n('action.translate') : i18n('action.edit');
        }

        return i18n('action.open');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.actionButton);

            return rendered;
        });
    }
}
