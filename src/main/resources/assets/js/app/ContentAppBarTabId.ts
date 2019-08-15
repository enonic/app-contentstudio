import AppBarTabId = api.app.bar.AppBarTabId;
import {LayerContext} from './layer/LayerContext';

export class ContentAppBarTabId
    extends AppBarTabId {

    static forEdit(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId('edit', id);
    }

    toString(): string {
        const layer: string = LayerContext.get().getCurrentLayer().getName();

        return `${this.getMode()}:${layer}/${this.getId()}`;
    }
}
