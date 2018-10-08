import {ImageStyleJson} from './ImageStylesDescriptor';
import {ImageStyles} from './ImageStyles';
declare var CONFIG;

export interface GetImageStylesResponse {
    css: string;
    styles: ImageStyleJson[];
}

export class ImageStylesRequest
    extends api.rest.ResourceRequest<GetImageStylesResponse, ImageStyles> {

    getRequestPath(): api.rest.Path {
        return CONFIG.imageStylesUrl;
    }

    getParams() {
        return null;
    }

    sendAndParse(): wemQ.Promise<ImageStyles> {
        return this.send().then((response: api.rest.JsonResponse<GetImageStylesResponse>) => {
            return this.fromJson(response.getResult());
        });
    }

    private fromJson(json: GetImageStylesResponse): ImageStyles {
        return new ImageStyles(json);
    }
}
