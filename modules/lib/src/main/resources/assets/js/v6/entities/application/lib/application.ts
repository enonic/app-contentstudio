import { Form } from '@enonic/input-types/schema';
import { type FormJson } from '@enonic/ui-types';
import { type ApplicationKey } from '../../../shared/lib/cms/application/applicationKey';

export type ApplicationJson = {
    key: string;
    displayName: string;
    description?: string;
    state: string;
    iconUrl?: string;
    config?: FormJson;
};

export type Application = {
    readonly key: ApplicationKey;
    readonly displayName: string;
    readonly description?: string;
    readonly state?: string;
    readonly iconUrl?: string;
    readonly form?: Form;
};

export function parseApplication(json: ApplicationJson): Application {
    return {
        key: json.key,
        displayName: json.displayName,
        description: json.description,
        state: json.state,
        iconUrl: json.iconUrl,
        form: json.config != null ? Form.fromJson(json.config) : undefined,
    };
}
