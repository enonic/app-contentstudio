import {SagaWidgetItemViewData} from './SagaWidgetItemView';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class PlaceholderGenerator {

    private constructor() {
        //
    }

    static generate(data: SagaWidgetItemViewData): string {
        if (StringHelper.isBlank(data.html)) { // placeholder for empty editor
            if (StringHelper.isBlank(data.content?.getDisplayName())) { // placeholder for empty displayName
                return 'Enter a topic or a phrase to generate the text for. For example: \'Describe the atmosphere of a cozy café on a rainy day.\'';
            }

            // placeholder for non-empty displayName
            return `Enter a topic or a phrase to generate the text for. For example: 'Tell me about ${data.content.getDisplayName()}'`;
        }

        return 'Describe the changes you\'d like to make. For example: \'Rewrite this in a more formal tone and add more descriptive details.\'';
    }
}
