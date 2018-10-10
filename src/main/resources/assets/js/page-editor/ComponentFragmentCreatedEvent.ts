import {FragmentComponentView} from './fragment/FragmentComponentView';
import {Content} from '../app/content/Content';
import Event = api.event.Event;
import ComponentType = api.content.page.region.ComponentType;

export class ComponentFragmentCreatedEvent
    extends api.event.Event {

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
        Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentFragmentCreatedEvent) => void, contextWindow: Window = window) {
        Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
