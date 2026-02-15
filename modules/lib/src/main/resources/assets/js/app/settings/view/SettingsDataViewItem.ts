import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {SettingsTreeItemBuilder, SettingsViewItem} from './SettingsViewItem';

export abstract class SettingsDataViewItem<DATA extends Equitable>
    extends SettingsViewItem {

    readonly data: DATA;

    protected constructor(builder: SettingsDataItemBuilder<DATA>) {
        super(builder);

        this.data = builder.getData();
    }

    abstract getName(): string;

    getData(): DATA {
        return this.data;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SettingsViewItem)) {
            return false;
        }

        const other: SettingsDataViewItem<DATA> = o as SettingsDataViewItem<DATA>;

        return ObjectHelper.equals(this.data, other.data);
    }

}

export abstract class SettingsDataItemBuilder<DATA extends Equitable>
    extends SettingsTreeItemBuilder {

    private data: DATA;

    constructor(source?: SettingsDataViewItem<DATA>) {
        super(source);

        if (source) {
            this.data = source.getData();
        }
        return;
    }

    setData(value: DATA): SettingsDataItemBuilder<DATA> {
        this.data = value;
        return this;
    }

    getData(): DATA {
        return this.data;
    }

    abstract build(): SettingsDataViewItem<DATA>;
}
