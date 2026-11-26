import { type Form, type FormItem, FormItemSet, FormOptionSet, Input } from '@enonic/input-types/schema';

const hasRequiredItem = (item: FormItem): boolean => {
    if (item instanceof Input || item instanceof FormItemSet || item instanceof FormOptionSet) {
        if (item.getOccurrences().required()) return true;
    }

    return item.getFormItems().some(hasRequiredItem);
};

export const hasRequiredFields = (form: Form, excludeInputTypes: readonly string[] = []): boolean => {
    const excluded = new Set(excludeInputTypes.map((name) => name.toLowerCase()));

    return form.getFormItems().some((item) => {
        if (item instanceof Input && excluded.has(item.getInputType().getName().toLowerCase())) return false;
        return hasRequiredItem(item);
    });
};
