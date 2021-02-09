import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {Cache} from 'lib-admin-ui/cache/Cache';
import {ContentType, ContentTypeBuilder} from '../inputtype/schema/ContentType';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ContentTypeCache
    extends Cache<ContentType, ContentTypeName> {

    private static instance: ContentTypeCache;

    constructor() {
        super();
        ApplicationEvent.on((event: ApplicationEvent) => {
            if (ApplicationEventType.STARTED === event.getEventType()
                || ApplicationEventType.STOPPED === event.getEventType()
                || ApplicationEventType.UPDATED === event.getEventType()) {
                console.log(ClassHelper.getClassName(this) + ' received ApplicationEvent - removing cached content types... ' +
                            event.getApplicationKey().toString());
                this.getCachedByApplicationKey(event.getApplicationKey()).forEach((contentType: ContentType) => {
                    this.deleteByKey(this.getKeyFromObject(contentType));
                    console.log('Removed cached content type: ' + contentType.getName());
                });
            }
        });
    }

    copy(object: ContentType): ContentType {
        return new ContentTypeBuilder(object).build();
    }

    getKeyFromObject(object: ContentType): ContentTypeName {
        return new ContentTypeName(object.getName());
    }

    getKeyAsString(key: ContentTypeName): string {
        return key.toString();
    }

    private getCachedByApplicationKey(applicationKey: ApplicationKey): ContentType[] {
        let result: ContentType[] = [];
        this.getAll().forEach((contentType: ContentType) => {
            if (applicationKey.equals(this.getKeyFromObject(contentType).getApplicationKey())) {
                result.push(contentType);
            }
        });
        return result;
    }

    static get(): ContentTypeCache {
        if (!ContentTypeCache.instance) {
            ContentTypeCache.instance = new ContentTypeCache();
        }
        return ContentTypeCache.instance;
    }
}
