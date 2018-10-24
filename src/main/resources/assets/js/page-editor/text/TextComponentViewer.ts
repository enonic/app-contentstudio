import {TextComponentView} from './TextComponentView';
import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {TextComponent} from '../../app/page/region/TextComponent';

export class TextComponentViewer
    extends api.ui.NamesAndIconViewer<TextComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: TextComponent, componentView?: TextComponentView): string {
        if (componentView) {
            return componentView.extractText() || componentView.getName();
        } else {
            return object.getText();
        }
    }

    resolveSubName(object: TextComponent, relativePath: boolean = false): string {
        return object.getPath() ? object.getPath().toString() : '';
    }

    resolveIconClass(object: TextComponent): string {
        return ItemViewIconClassResolver.resolveByType('text');
    }

}
