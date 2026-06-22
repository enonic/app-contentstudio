import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class SelectionHelper {

    /**
     * Returns true when the given ids match the ids currently shown by the selected options
     * (same items, same order). Lets a selector skip a redundant rebuild of its selection:
     * deselecting and re-selecting every item removes and re-adds the option views, which shifts
     * the form's scroll position and steals focus to the filter input - even when nothing changed.
     */
    static isSameSelection<T>(currentOptions: SelectedOption<T>[], newIds: string[]): boolean {
        const filteredNewIds: string[] = (newIds || []).filter((id) => !StringHelper.isBlank(id));
        const currentIds: string[] = currentOptions.map((selectedOption) => selectedOption.getOption().getValue());

        return ObjectHelper.stringArrayEquals(filteredNewIds, currentIds);
    }
}
