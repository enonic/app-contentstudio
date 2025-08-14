import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalContainerSelectedOptionsView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ProjectAccessControlEntryView} from './ProjectAccessControlEntryView';
import {CSPrincipalLoader} from '../../../../../security/CSPrincipalLoader';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {ProjectAccessControlListBox} from './ProjectAccessControlListBox';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';

interface ProjectAccessControlComboBoxOptions extends ListBoxInputOptions<ProjectAccessControlEntry> {
    loader: CSPrincipalLoader;
}

export class ProjectAccessControlComboBox
    extends FilterableListBoxWrapperWithSelectedView<ProjectAccessControlEntry> {

    declare options: ProjectAccessControlComboBoxOptions;

    constructor() {
        const loader = new CSPrincipalLoader();

        super(new ProjectAccessControlListBox(loader), {
            maxSelected:  0,
            selectedOptionsView: new ProjectACESelectedOptionsView(),
            className: 'project-access-combobox',
            loader: loader,
        } as ProjectAccessControlComboBoxOptions);
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

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
    }

    protected loadListOnShown(): void {
        // if not empty then search will be performed after finished typing
        if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
            this.search(this.optionFilterInput.getValue());
        }
    }

    protected search(value?: string): void {
        this.options.loader.search(value).catch(DefaultErrorHandler.handle);
    }

    createSelectedOption(item: ProjectAccessControlEntry): Option<ProjectAccessControlEntry> {
        return Option.create<ProjectAccessControlEntry>()
            .setValue(item.getPrincipalKey().toString())
            .setDisplayValue(item)
            .build();
    }

    onOptionValueChanged(listener: (item: ProjectAccessControlEntry) => void) {
        (this.selectedOptionsView as ProjectACESelectedOptionsView).onItemValueChanged(listener);
    }

    private convertPrincipalsToEntries(principals: Principal[]): ProjectAccessControlEntry[] {
        return principals.map(this.convertPrincipalToEntry);
    }

    private convertPrincipalToEntry(principal: Principal): ProjectAccessControlEntry {
        return new ProjectAccessControlEntry(principal);
    }

    getLoader(): CSPrincipalLoader {
        return this.options.loader;
    }
}

export class ProjectACESelectedOptionsView
    extends PrincipalContainerSelectedOptionsView<ProjectAccessControlEntry> {

    protected createSelectedEntryView(option: Option<ProjectAccessControlEntry>): ProjectAccessControlEntryView {
        return new ProjectAccessControlEntryView(option.getDisplayValue(), option.isReadOnly());
    }

}

export class ProjectAccessControlComboBoxWrapper extends FormInputEl {

    private readonly selector: ProjectAccessControlComboBox;

    constructor(selector: ProjectAccessControlComboBox) {
        super('div', 'locale-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }

    getComboBox(): ProjectAccessControlComboBox {
        return this.selector;
    }
}
