import StringHelper = api.util.StringHelper;
import AppHelper = api.util.AppHelper;
import {ImagePreviewUrlResolver, ImageRenderUrlResolver, ImageUrlParameters} from '../../../util/ImageUrlResolver';

export class HTMLAreaHelper {
    public static maxImageWidth: number = 610; // Modal dialog width (660px) minus side padding (30px + 20px)

    private static getImageUrl(resolver: ImagePreviewUrlResolver, params: ImageUrlParameters): string {
        resolver
            .setScaleWidth(true)
            .setContentId(new api.content.ContentId(params.id))
            .setUseOriginal(params.useOriginal);

        if (!params.useOriginal) {
            resolver.setWidth(HTMLAreaHelper.maxImageWidth);
        }

        if (params.scale) {
            resolver.setScale(params.scale);
        }

        return resolver.resolve();
    }

    public static getImageRenderUrl(params: ImageUrlParameters): string {
        return HTMLAreaHelper.getImageUrl(new ImageRenderUrlResolver(), params);
    }

    public static getImagePreviewUrl(params: ImageUrlParameters): string {
        return HTMLAreaHelper.getImageUrl(new ImagePreviewUrlResolver(), params);
    }

    private static getConvertedImageSrc(imgSrc: string): string {
        let contentId = HTMLAreaHelper.extractContentIdFromImgSrc(imgSrc);
        let scaleValue = HTMLAreaHelper.extractScaleParamFromImgSrc(imgSrc);
        let imageUrl = HTMLAreaHelper.getImagePreviewUrl({id: contentId, scale: scaleValue});

        return ` src="${imageUrl}" data-src="${imgSrc}"`;
    }

    public static extractContentIdFromImgSrc(imgSrc: string): string {
        if (imgSrc.indexOf('?') !== -1) {
            return StringHelper.substringBetween(imgSrc, ImageRenderUrlResolver.imagePrefix, '?');
        }

        return imgSrc.replace(ImageRenderUrlResolver.imagePrefix, StringHelper.EMPTY_STRING);
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

        while (processedContent.search(` src="${ImageRenderUrlResolver.imagePrefix}`) > -1) {
            imgSrcs = regex.exec(processedContent);
            if (imgSrcs) {
                imgSrcs.forEach((imgSrc: string) => {
                    if (imgSrc.indexOf(ImageRenderUrlResolver.imagePrefix) === 0) {
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

            if (imgTag.indexOf('<img ') === 0 && imgTag.indexOf(ImageRenderUrlResolver.imagePrefix) > 0) {
                const dataSrc = /<img.*?data-src="(.*?)".*?>/.exec(imgTag)[1];
                const src = /<img.*?\ssrc="(.*?)".*?>/.exec(imgTags[0])[1];

                const convertedImg = imgTag.replace(src, dataSrc).replace(` data-src="${dataSrc}"`, StringHelper.EMPTY_STRING);
                processedContent = processedContent.replace(imgTag, convertedImg);
            }
        });

        return processedContent;
    }
}
