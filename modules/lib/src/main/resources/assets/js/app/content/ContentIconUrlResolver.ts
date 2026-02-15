import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {IconUrlResolver} from '@enonic/lib-admin-ui/icon/IconUrlResolver';
import {type ContentSummary} from './ContentSummary';

export class ContentIconUrlResolver
    extends IconUrlResolver {

    private content: ContentSummary;

    private crop: boolean;

    private size: number;

    static default(): string {

        return UriHelper.getAdminUri('common/images/default_content.png');
    }

    setContent(value: ContentSummary): ContentIconUrlResolver {
        this.content = value;
        return this;
    }

    setSize(value: number): ContentIconUrlResolver {
        this.size = value;
        return this;
    }

    setCrop(value: boolean): ContentIconUrlResolver {
        this.crop = value;
        return this;
    }

    resolve(): string {

        const url = this.content.getIconUrl();
        if (!url) {
            return null;
        }
        // CMS-4677: using crop=false for images only by default
        if (this.crop == null) {
            this.crop = !this.content.isImage();
        }

        // parse existing params from url in case there are any
        const params = UriHelper.decodeUrlParams(url);

        if (this.crop != null) {
            params['crop'] = String(this.crop);
        }
        if (this.size != null) {
            params['size'] = String(this.size);
        }

        return `${UriHelper.trimUrlParams(url)}?${UriHelper.encodeUrlParams(params)}`;
    }
}
