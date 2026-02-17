import {Style} from './Style';
import {type StyleJson, type StylesJson} from './StylesDescriptor';

export class Styles {

    private static INSTANCES: Record<string, Styles> = {};

    private css: string[];
    private styles: Style[];

    constructor(contentId: string, json: StylesJson) {
        this.css = json.css;
        this.styles = (json.styles || []).map((styleJson: StyleJson) => new Style(styleJson));

        Styles.INSTANCES[contentId] = this;
    }

    public static getInstance(contentId: string): Styles {
        return Styles.INSTANCES[contentId];
    }

    public static getCssPaths(contentId: string): string[] {
        if (!Styles.INSTANCES[contentId]) {
            return [];
        }
        return Styles.INSTANCES[contentId].css || [];
    }

    public static getAll(contentId: string): Style[] {
        if (!Styles.INSTANCES[contentId]) {
            return [];
        }
        return Styles.INSTANCES[contentId].styles;
    }

    public static getForImage(contentId: string): Style[] {
        if (!Styles.INSTANCES[contentId]) {
            return [];
        }
        return Styles.INSTANCES[contentId].styles.filter(style => style.isForImage());
    }

    public static getForImageAsString(contentId: string): string[] {
        if (!Styles.INSTANCES[contentId]) {
            return [];
        }
        return Styles.INSTANCES[contentId].styles.filter(style => style.isForImage()).map(style => style.getName());
    }
}
