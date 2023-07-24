import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {FragmentComponentView} from '../fragment/FragmentComponentView';
import {Content} from '../../app/content/Content';
import {ComponentType} from '../../app/page/region/ComponentType';
import {ComponentPath} from '../../app/page/region/ComponentPath';
import {Component} from '../../app/page/region/Component';

export class PageResetEvent
    extends Event {

    constructor() {
        super();
    }

    static on(handler: (event: PageResetEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: PageResetEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
