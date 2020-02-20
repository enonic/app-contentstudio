import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {SettingsTreeItemBuilder, SettingsViewItem} from './SettingsViewItem';

export abstract class SettingsDataViewItem<DATA extends Equitable>
    extends SettingsViewItem {

    protected data: DATA;

    constructor(builder: SettingsDataItemBuilder<DATA>) {
        super(builder);

        this.data = builder.data;
    }

    abstract getData(): DATA;

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SettingsViewItem)) {
            return false;
        }

        const other: SettingsDataViewItem<DATA> = <SettingsDataViewItem<DATA>>o;

        if (!ObjectHelper.equals(this.data, other.data)) {
            return false;
        }

        return true;
    }

}

export abstract class SettingsDataItemBuilder<DATA extends Equitable>
    extends SettingsTreeItemBuilder {

    data: DATA;

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

    abstract build(): SettingsDataViewItem<DATA>;
}
