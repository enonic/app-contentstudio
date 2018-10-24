import {XDataJson} from '../resource/json/XDataJson';
import {XDataName} from './XDataName';

export class XData
    extends api.schema.Schema
    implements api.Equitable {

    private schemaKey: string;

    private formItems: api.form.FormItem[];

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

    getFormItems(): api.form.FormItem[] {
        return this.formItems;
    }

    getSchemaKey(): string {
        return this.schemaKey;
    }

    isOptional(): boolean {
        return this.optional;
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, XData)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <XData>o;

        if (!api.ObjectHelper.stringEquals(this.schemaKey, other.schemaKey)) {
            return false;
        }

        if (!api.ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
            return false;
        }
        if (!api.ObjectHelper.booleanEquals(this.optional, other.optional)) {
            return false;
        }

        return true;
    }

    toForm(): api.form.Form {
        return new api.form.FormBuilder().addFormItems(this.formItems).build();
    }

}

export class XDataBuilder
    extends api.schema.SchemaBuilder {

    schemaKey: string;

    formItems: api.form.FormItem[];

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
            xDataJson.form.formItems.forEach((formItemJson) => {
                let formItem = api.form.FormItemFactory.createFormItem(formItemJson);
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
