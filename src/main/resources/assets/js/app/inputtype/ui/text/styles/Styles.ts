import {Style} from './Style';
import {StyleJson, StylesJson} from './StylesDescriptor';

export class Styles {

    private static INSTANCE: Styles;

    private css: string[];
    private styles: Style[];

    constructor(json: StylesJson) {
        this.css = json.css;
        this.styles = (json.styles || []).map((styleJson: StyleJson) => new Style(styleJson));

        Styles.INSTANCE = this;
    }

    public static getInstance(): Styles {
        return Styles.INSTANCE;
    }

    public static getCssPaths(): string[] {
        return Styles.INSTANCE.css || [];
    }

    public static getAll(): Style[] {
        return Styles.INSTANCE.styles;
    }

    public static getForImage(): Style[] {
        return Styles.INSTANCE.styles.filter(style => style.isForImage());
    }
}
