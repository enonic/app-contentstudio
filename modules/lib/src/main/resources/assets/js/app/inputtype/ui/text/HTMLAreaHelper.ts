import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ImageUrlResolver} from '../../../util/ImageUrlResolver';
import {Styles} from './styles/Styles';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import * as Q from 'q';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {ProjectHelper} from '../../../settings/data/project/ProjectHelper';

export class HTMLAreaHelper {

    private static getConvertedImageSrc(imgSrc: string, contentId: string): string {
        const imageId = HTMLAreaHelper.extractImageIdFromImgSrc(imgSrc);
        const styleParameter = '?style=';

        const imageUrlResolver = new ImageUrlResolver()
            .setContentId(new ContentId(imageId))
            .setTimestamp(new Date())
            .setScaleWidth(true);

        if (imgSrc.includes(ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL)) {
            imageUrlResolver.disableProcessing();
        } else {
            imageUrlResolver.setDefaultSize();

            if (imgSrc.includes(styleParameter)) {
                const styleName = imgSrc.split(styleParameter)[1];
                const style = Styles.getForImage(contentId).find(s => s.getName() === styleName);

                if (style) {
                    imageUrlResolver.setFilter(style.getFilter()).setAspectRatio(style.getAspectRatio());
                }
            }
        }

        let imgUrl = imageUrlResolver.resolveForPreview();

        // Support scale parameter from the old content
        const src = imgSrc.replace(/&amp;/g, '&');
        const params = UriHelper.decodeUrlParams(src);
        if (params.scale) {
            imgUrl = UriHelper.appendUrlParams(imgUrl, {scale: params.scale}, false);
        }

        return ` src="${imgUrl}" data-src="${imgSrc}"`;
    }

    public static extractImageIdFromImgSrc(imgSrc: string): string {
        const prefix = imgSrc.includes(ImageUrlResolver.URL_PREFIX_RENDER) ?
                       ImageUrlResolver.URL_PREFIX_RENDER : ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL;

        if (imgSrc.includes('?')) {
            return StringHelper.substringBetween(imgSrc, prefix, '?');
        }

        return imgSrc.replace(prefix, StringHelper.EMPTY_STRING);
    }

    public static convertRenderSrcToPreviewSrc(value: string, contentId: string): string {
        if (!value) {
            return '';
        }

        let processedContent: string = value;
        const regex: RegExp = /<img.*?src="(.*?)"/g;
        let imgSrcs: RegExpExecArray = regex.exec(processedContent);

        while (imgSrcs) {
            imgSrcs.forEach((imgSrc: string) => {
                if (imgSrc.startsWith(ImageUrlResolver.URL_PREFIX_RENDER) ||
                    imgSrc.startsWith(ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL)) {
                    processedContent =
                        processedContent.replace(` src="${imgSrc}"`, HTMLAreaHelper.getConvertedImageSrc(imgSrc, contentId));
                }
            });

            imgSrcs = regex.exec(processedContent);
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

    public static isSourceCodeEditable(): Q.Promise<boolean> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            if (loginResult.isContentExpert()) {
                return Q(true);
            }

            return ProjectHelper.isUserProjectOwnerOrEditor(loginResult);
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
            return Q(false);
        });
    }
}
