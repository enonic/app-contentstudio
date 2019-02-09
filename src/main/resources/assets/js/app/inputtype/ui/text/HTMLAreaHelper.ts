import ContentId = api.content.ContentId;
import StringHelper = api.util.StringHelper;
import AppHelper = api.util.AppHelper;
import {ImageUrlResolver} from '../../../util/ImageUrlResolver';
import {Styles} from './styles/Styles';

export class HTMLAreaHelper {

    private static getConvertedImageSrc_old(imgSrc: string): string {
        const contentId = HTMLAreaHelper.extractContentIdFromImgSrc(imgSrc);
        const aspectRatio = HTMLAreaHelper.extractParamValueFromImgSrc(imgSrc, 'scale');
        const filter = HTMLAreaHelper.extractParamValueFromImgSrc(imgSrc, 'filter');

        const imgUrl = new ImageUrlResolver()
            .setContentId(new ContentId(contentId))
            .setAspectRatio(aspectRatio)
            .setFilter(filter)
            .resolveForPreview();

        return ` src="${imgUrl}" data-src="${imgSrc}"`;
    }

    private static getConvertedImageSrc(imgSrc: string): string {
        const contentId = HTMLAreaHelper.extractContentIdFromImgSrc(imgSrc);
        const styleParameter = '?style=';

        const imageUrlResolver = new ImageUrlResolver().setContentId(new ContentId(contentId));

        if (imgSrc.includes(ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL)) {
            imageUrlResolver.disableProcessing();
        } else if (imgSrc.includes(styleParameter)) {
            const styleName = imgSrc.split(styleParameter)[1];

            if (Styles.getInstance()) {
                const style = Styles.getForImage().find(s => s.getName() === styleName);

                if (style) {
                    imageUrlResolver.setFilter(style.getFilter()).setAspectRatio(style.getAspectRatio());
                }
            }
        }

        const imgUrl = imageUrlResolver.resolveForPreview();

        return ` src="${imgUrl}" data-src="${imgSrc}"`;
    }

    public static extractContentIdFromImgSrc(imgSrc: string): string {
        const prefix = imgSrc.includes(ImageUrlResolver.URL_PREFIX_RENDER) ?
                       ImageUrlResolver.URL_PREFIX_RENDER : ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL;

        if (imgSrc.includes('?')) {
            return StringHelper.substringBetween(imgSrc, prefix, '?');
        }

        return imgSrc.replace(prefix, StringHelper.EMPTY_STRING);
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

        while (processedContent.includes(` src="${ImageUrlResolver.URL_PREFIX_RENDER}`) ||
               processedContent.includes(` src="${ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL}`)) {
            imgSrcs = regex.exec(processedContent);
            if (imgSrcs) {
                imgSrcs.forEach((imgSrc: string) => {
                    if (imgSrc.startsWith(ImageUrlResolver.URL_PREFIX_RENDER) ||
                        imgSrc.startsWith(ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL)) {
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

            if (imgTag.startsWith('<img ') &&
                (imgTag.includes(ImageUrlResolver.URL_PREFIX_RENDER) || imgTag.includes(ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL))) {
                const dataSrc = /<img.*?data-src="(.*?)".*?>/.exec(imgTag)[1];
                const src = /<img.*?\ssrc="(.*?)".*?>/.exec(imgTags[0])[1];

                const convertedImg = imgTag.replace(src, dataSrc).replace(` data-src="${dataSrc}"`, StringHelper.EMPTY_STRING);
                processedContent = processedContent.replace(imgTag, convertedImg);
            }
        });

        return processedContent;
    }
}
