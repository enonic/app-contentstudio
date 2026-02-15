import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type XDataJson} from '../resource/json/XDataJson';
import {XDataName} from './XDataName';
import {Schema, SchemaBuilder} from '@enonic/lib-admin-ui/schema/Schema';
import {type FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {type Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {FormItemFactoryImpl} from '@enonic/lib-admin-ui/form/FormItemFactoryImpl';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';

export class XData
    extends Schema
    implements Equitable {

    private schemaKey: string;

    private formItems: FormItem[];

    private optional: boolean;

    constructor(builder: XDataBuilder) {
        super(builder);
        this.formItems = builder.formItems;
        this.schemaKey = builder.schemaKey;
        this.optional = builder.optional;
    }

    static fromJson(json: XDataJson): XData {
        return new XDataBuilder().fromXDataJson(json).build();
    }

    getXDataName(): XDataName {
        return new XDataName(this.getName());
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

        if (!ObjectHelper.iFrameSafeInstanceOf(o, XData)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        const other = o as XData;

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

export class XDataBuilder
    extends SchemaBuilder {

    schemaKey: string;

    formItems: FormItem[];

    optional: boolean;

    constructor(source?: XData) {
        super(source);
        if (source) {
            this.schemaKey = source.getSchemaKey();
            this.formItems = source.getFormItems();
            this.optional = source.isOptional();
        }
    }

    fromXDataJson(xDataJson: XDataJson): XDataBuilder {

        super.fromSchemaJson(xDataJson);

        this.formItems = [];
        if (xDataJson.form && xDataJson.form.formItems) {
            const applicationKey: ApplicationKey = new XDataName(this.name).getApplicationKey();
            xDataJson.form.formItems.forEach((formItemJson) => {
                const formItem: FormItem = FormItemFactoryImpl.get().createFormItem(formItemJson, applicationKey);
                if (formItem) {
                    this.formItems.push(formItem);
                }
            });
        }
        this.schemaKey = 'x-data:' + this.name;
        this.optional = xDataJson.isOptional;
        return this;
    }

    build(): XData {
        return new XData(this);
    }

}
