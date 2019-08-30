import AppBarTabId = api.app.bar.AppBarTabId;
import {LayerContext} from './layer/LayerContext';

export class ContentAppBarTabId
    extends AppBarTabId {

    static forEdit(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId('edit', id);
    }

    static forNew(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId('new', id);
    }

    isViewMode(): boolean {
        return this.getMode() === 'view';
    }

    isLocalizeMode(): boolean {
        return this.getMode() === 'localize';
    }

    toString(): string {
        const layer: string = LayerContext.get().getCurrentLayer().getName();

        return `${this.getMode()}:${layer}/${this.getId()}`;
    }
}
