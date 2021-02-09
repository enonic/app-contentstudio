import {TextComponentView} from './TextComponentView';
import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {TextComponent} from '../../app/page/region/TextComponent';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export class TextComponentViewer
    extends NamesAndIconViewer<TextComponent> {

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
