import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {LayerContent} from './LayerContent';
import {LayersContentActionButton} from '../../../../project/tree/LayersContentActionButton';

export class LayerContentViewFooter extends DivEl {

    private layerContent: LayerContent;

    private actionButton: ActionButton;

    constructor(layerContent: LayerContent, cls: string) {
        super(cls);

        this.layerContent = layerContent;
        this.actionButton = new LayersContentActionButton(layerContent);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.actionButton);

            return rendered;
        });
    }
}
