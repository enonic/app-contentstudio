export class StyleHelper {

    public static STYLE: any = {
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

    public static isOriginalImage(style: string) {
        return style.indexOf(StyleHelper.STYLE.PROCESSING.ORIGINAL) > -1;
    }
}
