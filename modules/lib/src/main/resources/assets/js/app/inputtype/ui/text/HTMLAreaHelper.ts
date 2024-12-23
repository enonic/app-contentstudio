import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ImageUrlResolver} from '../../../util/ImageUrlResolver';
import {Styles} from './styles/Styles';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import * as Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {ProjectHelper} from '../../../settings/data/project/ProjectHelper';
import {ContentId} from '../../../content/ContentId';
import {HtmlAreaSanitizer} from './HtmlAreaSanitizer';
import {Project} from '../../../settings/data/project/Project';

export class HTMLAreaHelper {

    private static sourceCodeEditablePromise: Q.Promise<boolean>;

    private static getConvertedImageSrc(imgSrc: string, contentId: string, project?: Project): string {
        const imageId = HTMLAreaHelper.extractImageIdFromImgSrc(imgSrc);
        const styleParameter = '?style=';

        const imageUrlResolver: ImageUrlResolver = new ImageUrlResolver(null, project)
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

    public static convertRenderSrcToPreviewSrc(value: string, contentId: string, project?: Project): string {
        if (!value) {
            return '';
        }

        let processedContent: string = value;
        const regex: RegExp = /<img.*?src="(.*?)"/g;
        let imgSrcs: RegExpExecArray = regex.exec(processedContent);

        while (imgSrcs) {
            imgSrcs.forEach((imgSrc: string) => {
                if (imgSrc.indexOf(ImageUrlResolver.URL_PREFIX_RENDER) === 0 ||
                    imgSrc.indexOf(ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL) === 0) {
                    processedContent =
                        processedContent.replace(` src="${imgSrc}"`, HTMLAreaHelper.getConvertedImageSrc(imgSrc, contentId, project));
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

            if (imgTag.indexOf('<img ') === 0 &&
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        HTMLAreaHelper.sourceCodeEditablePromise = HTMLAreaHelper.sourceCodeEditablePromise || HTMLAreaHelper.sendIsCodeEditableRequest();


        return HTMLAreaHelper.sourceCodeEditablePromise;
    }

    private static sendIsCodeEditableRequest(): Q.Promise<boolean> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            if (loginResult.isContentExpert()) {
                return Q(true);
            }

            return ProjectHelper.isUserProjectOwnerOrEditor(loginResult);
        }).catch((reason) => {
            DefaultErrorHandler.handle(reason);
            return Q(false);
        });
    }

    /*
        Backend sanitizers replace &nbsp; with unicode value and process tables
        Doing the same of frontend to make strings equal
     */
    public static sanitize(value: string): string {
        return new HtmlAreaSanitizer().sanitize(value);
    }

    public static getAllowedUriRegexp(): RegExp {
        return /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|content|media|image):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
    }

}
