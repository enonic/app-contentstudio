import {Extension} from './Extension';

export class ContextPanelExtension extends Extension {
    static create(): Extension {
        return Extension.create('context-panel-extension');
    }
}
