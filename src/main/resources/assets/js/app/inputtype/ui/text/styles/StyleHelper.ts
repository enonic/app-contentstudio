export enum StyleType {
    ALIGNMENT,
    WIDTH,
    PROCESSING
}

export class StyleHelper {

    public static STYLE = {
        ALIGNMENT: {
            JUSTIFY: 'editor-align-justify',
            LEFT: 'editor-align-left',
            CENTER: 'editor-align-center',
            RIGHT: 'editor-align-right'
        },
        WIDTH: {
            AUTO: 'editor-width-auto',
            CUSTOM: 'editor-width-custom'
        },
        PROCESSING: {
            ORIGINAL: 'editor-style-original'
        }
    };

    public static getStyleTypes(obj: any = StyleHelper.STYLE): Object {
        const result = {};

        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;

            if ((typeof obj[i]) == 'object') {
                const flatObject = StyleHelper.getStyleTypes(obj[i]);
                for (let x in flatObject) {
                    if (!flatObject.hasOwnProperty(x)) continue;

                    result[flatObject[x]] = flatObject[i];
                }
            } else {
                result[i] = obj[i];
            }
        }
        return result;
    }

    public static isOfSameType(style1: string, style2: string): boolean {
        const styles = StyleHelper.getStyleTypes();

        return styles[style1] === styles[style2];
    }

    public static getOfType(type: string): string[] {
        const types = StyleHelper.getStyleTypes();
        const result = [];

        for (var style in types) {
            if (types[style] === type) {
                result.push(style);
            }
        }

        return result;
    }
}