import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {MacroKey} from 'lib-admin-ui/macro/MacroKey';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PreviewRequest} from './PreviewRequest';
import {MacroPreviewStringJson} from './MacroPreviewJson';

export class GetPreviewStringRequest
    extends PreviewRequest<string> {

    constructor(data: PropertyTree, macroKey: MacroKey) {
        super(data, macroKey);
        this.addRequestPathElements('previewString');
    }

    protected parseResponse(response: JsonResponse<MacroPreviewStringJson>): string {
        return response.getResult().macro;
    }
}
