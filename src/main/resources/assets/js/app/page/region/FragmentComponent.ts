import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {FragmentComponentJson} from './FragmentComponentJson';
import {ComponentName} from './ComponentName';
import {FragmentComponentType} from './FragmentComponentType';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';

export class FragmentComponent
    extends ConfigBasedComponent {

    public static PROPERTY_FRAGMENT: string = 'fragment';

    private fragment: api.content.ContentId;

    constructor(builder: FragmentComponentBuilder) {
        super(builder);

        this.fragment = builder.fragment;
    }

    getFragment(): api.content.ContentId {
        return this.fragment;
    }

    setFragment(contentId: api.content.ContentId, name: string) {
        let oldValue = this.fragment;
        this.fragment = contentId;

        this.setName(name ? new ComponentName(name) : this.getType().getDefaultName());

        if (!api.ObjectHelper.equals(oldValue, contentId)) {
            this.notifyPropertyChanged(FragmentComponent.PROPERTY_FRAGMENT);
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

        let json: FragmentComponentJson = <FragmentComponentJson>super.toComponentJson();
        json.fragment = this.fragment != null ? this.fragment.toString() : null;
        json.config = this.config != null ? this.config.toJson() : null;

        return <ComponentTypeWrapperJson> {
            FragmentComponent: json
        };
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, FragmentComponent)) {
            return false;
        }

        const other = <FragmentComponent>o;

        if (!api.ObjectHelper.equals(this.fragment, other.fragment)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): FragmentComponent {
        return new FragmentComponentBuilder(this).build();
    }
}

export class FragmentComponentBuilder
    extends ConfigBasedComponentBuilder<FragmentComponent> {

    fragment: api.content.ContentId;

    constructor(source?: FragmentComponent) {
        super(source);

        if (source) {
            this.fragment = source.getFragment();
        }

        this.setType(FragmentComponentType.get());
    }

    public setFragment(value: api.content.ContentId): FragmentComponentBuilder {
        this.fragment = value;
        return this;
    }

    public fromJson(json: FragmentComponentJson): FragmentComponentBuilder {
        super.fromJson(json);

        if (json.fragment) {
            this.setFragment(new api.content.ContentId(json.fragment));
        }

        return this;
    }

    public build(): FragmentComponent {
        return new FragmentComponent(this);
    }
}
