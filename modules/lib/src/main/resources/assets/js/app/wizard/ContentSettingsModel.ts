import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Content, ContentBuilder} from '../content/Content';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class ContentSettingsModel
    implements Equitable {

    private propertyChangedListeners: { (event: PropertyChangedEvent): void }[] = [];

    private owner: PrincipalKey;
    private language: string;

    public static PROPERTY_OWNER: string = 'owner';
    public static PROPERTY_LANG: string = 'language';

    constructor(content: Content) {
        this.language = content.getLanguage();
        this.owner = content.getOwner();
    }

    getOwner(): PrincipalKey {
        return this.owner;
    }

    setOwner(owner: PrincipalKey, silent?: boolean): ContentSettingsModel {
        if (!silent) {
            let event = new PropertyChangedEvent(ContentSettingsModel.PROPERTY_OWNER, this.owner, owner);
            this.notifyPropertyChanged(event);
        }
        this.owner = owner;
        return this;
    }

    getLanguage(): string {
        return this.language;
    }

    setLanguage(lang: string, silent?: boolean): ContentSettingsModel {
        if (!silent) {
            let event = new PropertyChangedEvent(ContentSettingsModel.PROPERTY_LANG, this.language, lang);
            this.notifyPropertyChanged(event);
        }
        this.language = lang;
        return this;
    }

    onPropertyChanged(listener: { (event: PropertyChangedEvent): void; }) {
        this.propertyChangedListeners.push(listener);
    }

    unPropertyChanged(listener: { (event: PropertyChangedEvent): void; }) {
        this.propertyChangedListeners =
            this.propertyChangedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPropertyChanged(event: PropertyChangedEvent) {
        this.propertyChangedListeners.forEach((listener) => listener(event));
    }

    equals(other: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(other, ContentSettingsModel)) {
            return false;
        } else {
            let otherModel = <ContentSettingsModel> other;
            return otherModel.owner === this.owner && otherModel.language === this.language;
        }
    }

    apply(builder: ContentBuilder) {
        builder.owner = this.owner;
        builder.language = this.language;
    }

}
