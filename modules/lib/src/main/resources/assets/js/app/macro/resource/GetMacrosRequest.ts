import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {MacroResourceRequest} from './MacroResourceRequest';
import {MacrosJson} from '@enonic/lib-admin-ui/macro/MacrosJson';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';

export class GetMacrosRequest
    extends MacroResourceRequest<MacroDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('getByApps');
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    getParams(): object {
        return {
            appKeys: ApplicationKey.toStringArray(this.applicationKeys)
        };
    }

    private toMacroDescriptors(macrosJson: MacrosJson): MacroDescriptor[] {
        const result: MacroDescriptor[] = [];

        for (const macro of macrosJson.macros) {
            result.push(MacroDescriptor.fromJson(macro));
        }

        return result;
    }

    protected parseResponse(response: JsonResponse<MacrosJson>): MacroDescriptor[] {
        return this.toMacroDescriptors(response.getResult());
    }
}
