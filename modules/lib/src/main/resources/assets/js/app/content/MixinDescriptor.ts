import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {MixinDescriptorJson} from '../resource/json/MixinDescriptorJson';
import {MixinName} from './MixinName';
import {Schema, SchemaBuilder} from '@enonic/lib-admin-ui/schema/Schema';
import {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {FormItemFactoryImpl} from '@enonic/lib-admin-ui/form/FormItemFactoryImpl';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';

export class MixinDescriptor
    extends Schema
    implements Equitable {

    private schemaKey: string;

    private formItems: FormItem[];

    private optional: boolean;

    constructor(builder: MixinDescriptorBuilder) {
        super(builder);
        this.formItems = builder.formItems;
        this.schemaKey = builder.schemaKey;
        this.optional = builder.optional;
    }

    static fromJson(json: MixinDescriptorJson): MixinDescriptor {
        return new MixinDescriptorBuilder().fromMixinDescriptorJson(json).build();
    }

    getMixinName(): MixinName {
        return new MixinName(this.getName());
    }

    getFormItems(): FormItem[] {
        return this.formItems;
    }

    getSchemaKey(): string {
        return this.schemaKey;
    }

    isOptional(): boolean {
        return this.optional;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, MixinDescriptor)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as MixinDescriptor;

        if (!ObjectHelper.stringEquals(this.schemaKey, other.schemaKey)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
            return false;
        }
        if (!ObjectHelper.booleanEquals(this.optional, other.optional)) {
            return false;
        }

        return true;
    }

    toForm(): Form {
        return new FormBuilder().addFormItems(this.formItems).build();
    }

}

export class MixinDescriptorBuilder
    extends SchemaBuilder {

    schemaKey: string;

    formItems: FormItem[];

    optional: boolean;

    constructor(source?: MixinDescriptor) {
        super(source);
        if (source) {
            this.schemaKey = source.getSchemaKey();
            this.formItems = source.getFormItems();
            this.optional = source.isOptional();
        }
    }

    fromMixinDescriptorJson(descriptorJson: MixinDescriptorJson): MixinDescriptorBuilder {

        super.fromSchemaJson(descriptorJson);

        this.formItems = [];
        if (descriptorJson.form && descriptorJson.form.formItems) {
            const applicationKey: ApplicationKey = new MixinName(this.name).getApplicationKey();
            descriptorJson.form.formItems.forEach((formItemJson) => {
                const formItem: FormItem = FormItemFactoryImpl.get().createFormItem(formItemJson, applicationKey);
                if (formItem) {
                    this.formItems.push(formItem);
                }
            });
        }
        this.schemaKey = 'mixins:' + this.name;
        this.optional = descriptorJson.isOptional;
        return this;
    }

    build(): MixinDescriptor {
        return new MixinDescriptor(this);
    }

}
