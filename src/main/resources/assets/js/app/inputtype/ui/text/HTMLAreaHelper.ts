import StringHelper = api.util.StringHelper;
import AppHelper = api.util.AppHelper;
import {ImageUrlBuilder, ImageUrlParameters} from '../../../util/ImageUrlResolver';

export class HTMLAreaHelper {

    private static getConvertedImageSrc(imgSrc: string): string {
        const id = HTMLAreaHelper.extractContentIdFromImgSrc(imgSrc);
        const aspectRatio = HTMLAreaHelper.extractParamValueFromImgSrc(imgSrc, 'scale');
        const filter = HTMLAreaHelper.extractParamValueFromImgSrc(imgSrc, 'filter');

        const urlParams: ImageUrlParameters = {
            id: id,
            useOriginal: false, // or extract from src??
            aspectRatio: aspectRatio,
            filter: filter
        };

        return ` src="${new ImageUrlBuilder(urlParams).buildForPreview()}" data-src="${imgSrc}"`;
    }

    public static extractContentIdFromImgSrc(imgSrc: string): string {
        if (imgSrc.indexOf('?') !== -1) {
            return StringHelper.substringBetween(imgSrc, ImageUrlBuilder.RENDER.imagePrefix, '?');
        }

        return imgSrc.replace(ImageUrlBuilder.RENDER.imagePrefix, StringHelper.EMPTY_STRING);
    }

    private static extractParamValueFromImgSrc(imgSrc: string, paramName: string): string {
        if (imgSrc.indexOf(`${paramName}=`) !== -1) {
            return api.util.UriHelper.decodeUrlParams(imgSrc.replace('&amp;', '&'))[paramName];
        }

        return null;
    }

    public static convertRenderSrcToPreviewSrc(value: string): string {
        let processedContent = value;
        let regex = /<img.*?src="(.*?)"/g;
        let imgSrcs;

        if (!processedContent) {
            return '';
        }

        while (processedContent.search(` src="${ImageUrlBuilder.RENDER.imagePrefix}`) > -1) {
            imgSrcs = regex.exec(processedContent);
            if (imgSrcs) {
                imgSrcs.forEach((imgSrc: string) => {
                    if (imgSrc.indexOf(ImageUrlBuilder.RENDER.imagePrefix) === 0) {
                        processedContent =
                            processedContent.replace(` src="${imgSrc}"`, HTMLAreaHelper.getConvertedImageSrc(imgSrc));
                    }
                });
            }
        }
        return processedContent;
    }

    public static convertPreviewSrcToRenderSrc(editorContent: string): string {
        const regex: RegExp = /<img.*?data-src="(.*?)".*?>/g;
        let processedContent: string = editorContent;

        AppHelper.whileTruthy(() => regex.exec(editorContent), (imgTags) => {
            const imgTag = imgTags[0];

            if (imgTag.indexOf('<img ') === 0 && imgTag.indexOf(ImageUrlBuilder.RENDER.imagePrefix) > 0) {
                const dataSrc = /<img.*?data-src="(.*?)".*?>/.exec(imgTag)[1];
                const src = /<img.*?\ssrc="(.*?)".*?>/.exec(imgTags[0])[1];

                const convertedImg = imgTag.replace(src, dataSrc).replace(` data-src="${dataSrc}"`, StringHelper.EMPTY_STRING);
                processedContent = processedContent.replace(imgTag, convertedImg);
            }
        });

        return processedContent;
    }
}
