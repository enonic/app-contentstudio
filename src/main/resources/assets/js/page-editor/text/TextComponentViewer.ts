import './../../api.ts';
import {TextComponentView} from './TextComponentView';
import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';

export class TextComponentViewer
    extends api.ui.NamesAndIconViewer<api.content.page.region.TextComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: api.content.page.region.TextComponent, componentView?: TextComponentView): string {
        if (componentView) {
            return componentView.extractText() || componentView.getName();
        } else {
            return object.getText();
        }
    }

    resolveSubName(object: api.content.page.region.TextComponent, relativePath: boolean = false): string {
        return object.getPath() ? object.getPath().toString() : '';
    }

    resolveIconClass(object: api.content.page.region.TextComponent): string {
        return ItemViewIconClassResolver.resolveByType('text');
    }

}
