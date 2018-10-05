import {ImageStyleJson} from './ImageStylesDescriptor';
import {ImageStyle} from './ImageStyle';
declare var CONFIG;

export interface GetImageStylesResponse {
    css: string;
    styles: ImageStyleJson[];
}

export class ImageStylesRequest
    extends api.rest.ResourceRequest<GetImageStylesResponse, ImageStyle[]> {

    getRequestPath(): api.rest.Path {
        return CONFIG.imageStylesUrl;
    }

    getParams() {
        return null;
    }

    sendAndParse(): wemQ.Promise<ImageStyle[]> {
        return this.send().then((response: api.rest.JsonResponse<GetImageStylesResponse>) => {
            return this.fromJson(response.getResult());
        });
    }

    private fromJson(json: GetImageStylesResponse): ImageStyle[] {

        const list: ImageStyle[] = [];

        json.styles.forEach((imageStyleJson: ImageStyleJson) => {
            list.push(new ImageStyle(imageStyleJson));
        });

        return list;
    }
}
