import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Component, ComponentBuilder} from './Component';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {TextComponentJson} from './TextComponentJson';
import {TextComponentType} from './TextComponentType';
import {ComponentName} from './ComponentName';
import {ComponentTextUpdatedEvent} from './ComponentTextUpdatedEvent';
import {ComponentTextUpdatedOrigin} from './ComponentTextUpdatedOrigin';

export class TextComponent
    extends Component {

    private text: string;

    public static PROPERTY_TEXT: string = 'text';

    constructor(builder?: TextComponentBuilder) {
        super(builder);

        if (builder) {
            this.setText(builder.text, true);
        }
    }

    getText(): string {
        return this.text;
    }

    setText(value?: string, silent?: boolean, origin?: ComponentTextUpdatedOrigin) {
        this.text = StringHelper.isBlank(value) ? undefined : value;

        if (!silent) {
            this.notifyComponentUpdated(new ComponentTextUpdatedEvent(this.getPath(), value, origin));
        }
    }

    doReset() {
        this.setText();
    }

    isEmpty(): boolean {
        return StringHelper.isBlank(this.text);
    }

    toJson(): ComponentTypeWrapperJson {

        let json: TextComponentJson = {} as TextComponentJson;
        json.text = this.text != null ? this.text : null;

        return {
            TextComponent: json
        } as ComponentTypeWrapperJson;
    }

    equals(o: Equitable): boolean {
        if (!(o instanceof TextComponent)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        return ObjectHelper.stringEquals(this.text, o.text);
    }

    clone(): TextComponent {
        return new TextComponentBuilder(this).build();
    }
}

export class TextComponentBuilder
    extends ComponentBuilder {

    text: string;

    constructor(source?: TextComponent) {
        super(source);

        if (source) {
            this.text = source.getText();
        }

        this.setType(TextComponentType.get());
    }

    public fromJson(json: TextComponentJson): this {

        if (json.text) {
            this.setText(json.text);
        }

        this.setName(json.name ? new ComponentName(json.name) : null);

        return this;
    }

    public setText(value: string): this {
        this.text = value;
        return this;
    }

    public build(): TextComponent {
        return new TextComponent(this);
    }
}
