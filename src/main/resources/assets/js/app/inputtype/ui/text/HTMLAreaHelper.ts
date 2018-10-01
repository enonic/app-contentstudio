import StringHelper = api.util.StringHelper;
import AppHelper = api.util.AppHelper;

export class HTMLAreaHelper {

    static imagePrefix: string = 'image://';
    static maxImageWidth: number = 640;

    public static getImagePreviewUrl(imageId: string, originalWidth: boolean = false, scale?: string): string {
        let resolver = new api.content.util.ContentImageUrlResolver()
            .setContentId(new api.content.ContentId(imageId))
            .setWidth(originalWidth ? '' : HTMLAreaHelper.maxImageWidth.toString());

        if (scale) {
            resolver.setScale(scale);
        }

        return resolver.generate();
    }

    private static getConvertedImageSrc(imgSrc: string): string {
        let contentId = HTMLAreaHelper.extractContentIdFromImgSrc(imgSrc);
        let scaleValue = HTMLAreaHelper.extractScaleParamFromImgSrc(imgSrc);
        let imageUrl = new api.content.util.ContentImageUrlResolver().setContentId(new api.content.ContentId(contentId)).setScaleWidth(
            true).setScale(scaleValue).setSize(HTMLAreaHelper.maxImageWidth).resolve();

        return ` src="${imageUrl}" data-src="${imgSrc}"`;
    }

    private static extractContentIdFromImgSrc(imgSrc: string): string {
        if (imgSrc.indexOf('?') !== -1) {
            return StringHelper.substringBetween(imgSrc, HTMLAreaHelper.imagePrefix, '?');
        }

        return imgSrc.replace(HTMLAreaHelper.imagePrefix, StringHelper.EMPTY_STRING);
    }

    private static extractScaleParamFromImgSrc(imgSrc: string): string {
        if (imgSrc.indexOf('scale=') !== -1) {
            return api.util.UriHelper.decodeUrlParams(imgSrc.replace('&amp;', '&'))['scale'];
        }

        return null;
    }

    public static prepareImgSrcsInValueForEdit(value: string): string {
        let processedContent = value;
        let regex = /<img.*?src="(.*?)"/g;
        let imgSrcs;

        if (!processedContent) {
            return '';
        }

        while (processedContent.search(` src="${HTMLAreaHelper.imagePrefix}`) > -1) {
            imgSrcs = regex.exec(processedContent);
            if (imgSrcs) {
                imgSrcs.forEach((imgSrc: string) => {
                    if (imgSrc.indexOf(HTMLAreaHelper.imagePrefix) === 0) {
                        processedContent =
                            processedContent.replace(` src="${imgSrc}"`, HTMLAreaHelper.getConvertedImageSrc(imgSrc));
                    }
                });
            }
        }
        return processedContent;
    }

    public static prepareEditorImageSrcsBeforeSave(editorContent: string): string {
        const regex: RegExp = /<img.*?data-src="(.*?)".*?>/g;
        let processedContent: string = editorContent;

        AppHelper.whileTruthy(() => regex.exec(editorContent), (imgTags) => {
            const imgTag = imgTags[0];

            if (imgTag.indexOf('<img ') === 0 && imgTag.indexOf(HTMLAreaHelper.imagePrefix) > 0) {
                const dataSrc = /<img.*?data-src="(.*?)".*?>/.exec(imgTag)[1];
                const src = /<img.*?\ssrc="(.*?)".*?>/.exec(imgTags[0])[1];

                const convertedImg = imgTag.replace(src, dataSrc).replace(` data-src="${dataSrc}"`, StringHelper.EMPTY_STRING);
                processedContent = processedContent.replace(imgTag, convertedImg);
            }
        });

        return processedContent;
    }
}
