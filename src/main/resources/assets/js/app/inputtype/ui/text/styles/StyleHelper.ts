export class StyleHelper {

    public static STYLE: any = {
        ALIGNMENT: {
            JUSTIFY: {
                CLASS: 'editor-align-justify',
                WIDTH: ''
            },
            LEFT: {
                CLASS: 'editor-align-left',
                WIDTH: '40'
            },
            CENTER: {
                CLASS: 'editor-align-center',
                WIDTH: '60'
            },
            RIGHT: {
                CLASS: 'editor-align-right',
                WIDTH: '40'
            }
        },
        WIDTH: {
            AUTO: 'editor-width-auto',
            CUSTOM: 'editor-width-custom',
        },
        PROCESSING: {
            ORIGINAL: 'editor-style-original'
        }
    };

    public static isOriginalImage(style: string) {
        return style.indexOf(StyleHelper.STYLE.PROCESSING.ORIGINAL) > -1;
    }

    public static getAlignmentStyles(): string[] {
        return [
            StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS,
            StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS,
            StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS,
            StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS
        ];
    }
}
