import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {FragmentComponentView} from './fragment/FragmentComponentView';
import {Content} from '../app/content/Content';
import {ComponentType} from '../app/page/region/ComponentType';

export class ComponentFragmentCreatedEvent
    extends Event {

    private sourceComponentType: ComponentType;

    private fragmentComponentView: FragmentComponentView;

    private fragmentContent: Content;

    constructor(fragmentComponentView: FragmentComponentView, sourceComponentType: ComponentType,
                fragmentContent: Content) {
        super();
        this.fragmentComponentView = fragmentComponentView;
        this.sourceComponentType = sourceComponentType;
        this.fragmentContent = fragmentContent;
    }

    getComponentView(): FragmentComponentView {
        return this.fragmentComponentView;
    }

    getFragmentContent(): Content {
        return this.fragmentContent;
    }

    getSourceComponentType(): ComponentType {
        return this.sourceComponentType;
    }

    static on(handler: (event: ComponentFragmentCreatedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentFragmentCreatedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
