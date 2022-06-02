import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PropertyEvent} from '@enonic/lib-admin-ui/data/PropertyEvent';
import {PropertyTreeHelper} from '@enonic/lib-admin-ui/util/PropertyTreeHelper';
import {Component, ComponentBuilder} from './Component';
import {ConfigBasedComponentJson} from './ConfigBasedComponentJson';


export abstract class ConfigBasedComponent
    extends Component {

    public static PROPERTY_CONFIG: string = 'config';

    public static debug: boolean = false;

    private disableEventForwarding: boolean;

    protected config: PropertyTree;

    protected configChangedHandler: (event: PropertyEvent) => void;

    constructor(builder: ConfigBasedComponentBuilder<ConfigBasedComponent>) {
        super(builder);

        this.config = builder.config;
        this.configChangedHandler = (event: PropertyEvent) => {
            if (ConfigBasedComponent.debug) {
                console.debug(`Component[${this.getPath().toString()}].config.onChanged: `, event);
            }
            if (!this.disableEventForwarding) {
                this.notifyPropertyValueChanged(ConfigBasedComponent.PROPERTY_CONFIG);
            }
        };

        this.config.onChanged(this.configChangedHandler);
    }

    setDisableEventForwarding(value: boolean) {
        this.disableEventForwarding = value;
    }

    getConfig(): PropertyTree {
        return this.config;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ConfigBasedComponent)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        const other: ConfigBasedComponent = <ConfigBasedComponent>o;

        return PropertyTreeHelper.propertyTreesEqual(this.config, other.config);
    }
}

export class ConfigBasedComponentBuilder<T extends ConfigBasedComponent>
    extends ComponentBuilder<T> {

    config: PropertyTree;

    constructor(source?: ConfigBasedComponent) {
        super(source);

        if (source) {
            this.config = source.getConfig() ? source.getConfig().copy() : null;
        } else {
            this.config = new PropertyTree();
        }
    }

    public setConfig(value: PropertyTree): ConfigBasedComponentBuilder<T> {
        this.config = value;
        return this;
    }

    public fromJson(json: ConfigBasedComponentJson): ConfigBasedComponentBuilder<T> {
        super.fromJson(json);

        if (json.config) {
            this.setConfig(PropertyTree.fromJson(json.config));
        }

        return this;
    }
}
