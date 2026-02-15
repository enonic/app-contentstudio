import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {type FragmentComponentJson} from './FragmentComponentJson';
import {ComponentName} from './ComponentName';
import {FragmentComponentType} from './FragmentComponentType';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';
import {ContentId} from '../../content/ContentId';
import {ComponentFragmentUpdatedEvent} from './ComponentFragmentUpdatedEvent';

export class FragmentComponent
    extends ConfigBasedComponent {

    public static PROPERTY_FRAGMENT: string = 'fragment';

    private fragment: ContentId;

    constructor(builder: FragmentComponentBuilder) {
        super(builder);

        this.fragment = builder.fragment;
    }

    getFragment(): ContentId {
        return this.fragment;
    }

    setFragment(contentId: ContentId, name: string) {
        const oldValue = this.fragment;
        this.fragment = contentId;

        this.setName(name ? new ComponentName(name) : this.getType().getDefaultName());

        if (!ObjectHelper.equals(oldValue, contentId)) {
            this.notifyComponentUpdated(new ComponentFragmentUpdatedEvent(this.getPath(), contentId));
        }
    }

    hasFragment(): boolean {
        return !!this.fragment;
    }

    doReset() {
        this.setFragment(null, null);
    }

    isEmpty(): boolean {
        return !this.fragment;
    }

    toJson(): ComponentTypeWrapperJson {

        const json: FragmentComponentJson = {} as FragmentComponentJson;
        json.fragment = this.fragment != null ? this.fragment.toString() : null;
        json.config = this.config != null ? this.config.toJson() : null;

        return {
            FragmentComponent: json
        } as ComponentTypeWrapperJson;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FragmentComponent)) {
            return false;
        }

        const other = o as FragmentComponent;

        if (!ObjectHelper.equals(this.fragment, other.fragment)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): FragmentComponent {
        return new FragmentComponentBuilder(this).build();
    }
}

export class FragmentComponentBuilder
    extends ConfigBasedComponentBuilder {

    fragment: ContentId;

    constructor(source?: FragmentComponent) {
        super(source);

        if (source) {
            this.fragment = source.getFragment();
        }

        this.setType(FragmentComponentType.get());
    }

    public setFragment(value: ContentId): this {
        this.fragment = value;
        return this;
    }

    public fromJson(json: FragmentComponentJson): this {
        super.fromJson(json);

        if (json.fragment) {
            this.setFragment(new ContentId(json.fragment));
        }

        return this;
    }

    public build(): FragmentComponent {
        return new FragmentComponent(this);
    }
}
