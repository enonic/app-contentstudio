import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {MacroKey} from '@enonic/lib-admin-ui/macro/MacroKey';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
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
