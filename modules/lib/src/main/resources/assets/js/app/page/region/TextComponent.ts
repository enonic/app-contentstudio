import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Component, ComponentBuilder} from './Component';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {TextComponentJson} from './TextComponentJson';
import {TextComponentType} from './TextComponentType';
import {ComponentName} from './ComponentName';

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

    setText(value?: string, silent?: boolean) {
        this.text = StringHelper.isBlank(value) ? undefined : value;

        if (!silent) {
            this.notifyPropertyChanged(TextComponent.PROPERTY_TEXT);
        }
    }

    doReset() {
        this.setText();
    }

    isEmpty(): boolean {
        return StringHelper.isBlank(this.text);
    }

    toJson(): ComponentTypeWrapperJson {

        let json: TextComponentJson = <TextComponentJson>{};
        json.text = this.text != null ? this.text : null;

        return <ComponentTypeWrapperJson> {
            TextComponent: json
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, TextComponent)) {
            return false;
        }

        let other = <TextComponent>o;

        if (!super.equals(o)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.text, other.text)) {
            return false;
        }

        return true;
    }

    clone(): TextComponent {
        return new TextComponentBuilder(this).build();
    }
}

export class TextComponentBuilder
    extends ComponentBuilder<TextComponent> {

    text: string;

    constructor(source?: TextComponent) {

        super(source);

        if (source) {
            this.text = source.getText();
        }

        this.setType(TextComponentType.get());
    }

    public fromJson(json: TextComponentJson): TextComponentBuilder {

        if (json.text) {
            this.setText(json.text);
        }

        this.setName(json.name ? new ComponentName(json.name) : null);

        return this;
    }

    public setText(value: string): TextComponentBuilder {
        this.text = value;
        return this;
    }

    public build(): TextComponent {
        return new TextComponent(this);
    }
}
