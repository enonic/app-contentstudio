import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import Q from 'q';
import {seedFormDefaults} from '../../../v6/features/shared/form/seedFormDefaults';
import {type Descriptor} from '../Descriptor';
import {DescriptorKey} from '../DescriptorKey';
import {ComponentDescriptorUpdatedEvent} from './ComponentDescriptorUpdatedEvent';
import {ComponentName} from './ComponentName';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';
import {type DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';

export abstract class DescriptorBasedComponent
    extends ConfigBasedComponent {

    private descriptorKey: DescriptorKey;

    protected constructor(builder: DescriptorBasedComponentBuilder) {
        super(builder);

        this.descriptorKey = builder.descriptor;
    }

    hasDescriptor(): boolean {
        return !!this.descriptorKey;
    }

    getDescriptorKey(): DescriptorKey {
        return this.descriptorKey;
    }

    setDescriptor(descriptor: Descriptor): Q.Promise<void> {
        this.setName(descriptor ? new ComponentName(descriptor.getDisplayName()) : this.getType().getDefaultName());

        const oldDescriptorKeyValue = this.descriptorKey;

        if (ObjectHelper.equals(oldDescriptorKeyValue, descriptor?.getKey())) {
            return Q.resolve();
        }

        this.descriptorKey = descriptor?.getKey();

        // Pre-seed config with the descriptor's defaults so it matches what the
        // form2 FormRenderer produces on mount, avoiding a reload loop (#9085).
        const propertyTree = new PropertyTree();
        const configForm = descriptor?.getConfig();
        if (configForm) {
            try {
                seedFormDefaults(configForm, propertyTree.getRoot());
            } catch (e) {
                DefaultErrorHandler.handle(e);
            }
        }

        this.config?.unChanged(this.configChangedHandler);
        this.config = propertyTree;
        this.config.onChanged(this.configChangedHandler);
        this.notifyComponentUpdated(new ComponentDescriptorUpdatedEvent(this.getPath(), this.descriptorKey));

        return Q.resolve();
    }

    doReset() {
        this.setDescriptor(null).catch(DefaultErrorHandler.handle);
    }

    toComponentJson(): DescriptorBasedComponentJson {

        return {
            descriptor: this.descriptorKey != null ? this.descriptorKey.toString() : null,
            config: this.config != null ? this.config.toJson() : null,
            name: this.getName()?.toString(),
        } as DescriptorBasedComponentJson;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, DescriptorBasedComponent)) {
            return false;
        }

        const other: DescriptorBasedComponent = o as DescriptorBasedComponent;

        if (!ObjectHelper.equals(this.descriptorKey, other.descriptorKey)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): DescriptorBasedComponent {
        throw new Error('Must be implemented by inheritors');
    }
}

export abstract class DescriptorBasedComponentBuilder
    extends ConfigBasedComponentBuilder {

    descriptor: DescriptorKey;

    description: string;

    icon: string;

    protected constructor(source?: DescriptorBasedComponent) {
        super(source);
        if (source) {
            this.descriptor = source.getDescriptorKey();
        }
    }

    public fromJson(json: DescriptorBasedComponentJson): this {
        super.fromJson(json);

        if (json.descriptor) {
            this.setDescriptor(DescriptorKey.fromString(json.descriptor));
        }

        return this;
    }

    public setDescriptor(value: DescriptorKey): this {
        this.descriptor = value;
        return this;
    }

    public setDescription(value: string): this {
        this.description = value;
        return this;
    }

    public setIcon(value: string): this {
        this.icon = value;
        return this;
    }
}
