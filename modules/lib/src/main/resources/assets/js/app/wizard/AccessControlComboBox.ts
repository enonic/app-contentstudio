import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {PrincipalContainerSelectedOptionsView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {CSPrincipalLoader} from '../security/CSPrincipalLoader';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {AccessControlListBox} from './AccessControlListBox';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

interface AccessControlComboBoxOptions extends ListBoxInputOptions<AccessControlEntry> {
    loader: CSPrincipalLoader;
}

export class AccessControlComboBox extends FilterableListBoxWrapperWithSelectedView<AccessControlEntry> {

    options: AccessControlComboBoxOptions;

    constructor() {
        const loader = new CSPrincipalLoader();

        super(new AccessControlListBox(loader), {
            maxSelected:  0,
            selectedOptionsView: new ACESelectedOptionsView(),
            className: 'access-control-combobox',
            loader: loader,
        } as AccessControlComboBoxOptions);
    }

    protected initListeners(): void {
        super.initListeners();

        this.options.loader.onLoadedData((event: LoadedDataEvent<Principal>) => {
            const entries = this.convertPrincipalsToEntries(event.getData());

            if (event.isPostLoad()) {
                this.listBox.addItems(entries);
            } else {
                this.listBox.setItems(entries);
            }
            return Q.resolve(null);
        });

        this.listBox.whenShown(() => {
            // if not empty then search will be performed after finished typing
            if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
                this.search(this.optionFilterInput.getValue());
            }
        });

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
    }

    protected search(value?: string): void {
        this.options.loader.search(value).catch(DefaultErrorHandler.handle);
    }

    createSelectedOption(item: AccessControlEntry): Option<AccessControlEntry> {
        return Option.create<AccessControlEntry>()
            .setValue(item.getPrincipalKey().toString())
            .setDisplayValue(item)
            .build();
    }

    onOptionValueChanged(listener: (item: AccessControlEntry) => void) {
        (this.selectedOptionsView as ACESelectedOptionsView).onItemValueChanged(listener);
    }

    private convertPrincipalsToEntries(principals: Principal[]): AccessControlEntry[] {
        return principals.map(this.convertPrincipalToEntry);
    }

    private convertPrincipalToEntry(principal: Principal): AccessControlEntry {
        return new AccessControlEntry(principal);
    }
}

class ACESelectedOptionsView
    extends PrincipalContainerSelectedOptionsView<AccessControlEntry> {

    constructor() {
        super('access-control-list');
    }

    protected createSelectedEntryView(option: Option<AccessControlEntry>): AccessControlEntryView {
        const ace: AccessControlEntry = option.getDisplayValue();
        if (ace.getAllowedPermissions().length === 0 && ace.getDeniedPermissions().length === 0) {
            // allow read by default
            ace.allow(Permission.READ);
        }

        return new AccessControlEntryView(ace, option.isReadOnly());
    }

}
