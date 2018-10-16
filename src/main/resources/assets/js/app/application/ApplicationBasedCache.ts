import ApplicationKey = api.application.ApplicationKey;
import ApplicationEvent = api.application.ApplicationEvent;
import ApplicationEventType = api.application.ApplicationEventType;
import ApplicationCaches = api.application.ApplicationCaches;
import Descriptor = api.content.page.Descriptor;
import DescriptorKey = api.content.page.DescriptorKey;

export abstract class ApplicationBasedCache<T extends Descriptor, TKEY extends DescriptorKey> {

    private applicationCaches: ApplicationCaches<SimpleApplicationCache<T, TKEY>>;

    protected constructor() {

        this.applicationCaches = new ApplicationCaches<SimpleApplicationCache<T, TKEY>>();

        ApplicationEvent.on((event: ApplicationEvent) => {
            const key = event.getApplicationKey().toString();
            const className = api.ClassHelper.getClassName(this);

            if (ApplicationEventType.STARTED === event.getEventType()) {
                console.log(`${className} received ApplicationEvent STARTED, calling - loadByApplication. ${key}`);
                this.loadByApplication(event.getApplicationKey());
            } else if (ApplicationEventType.STOPPED === event.getEventType()) {
                console.log(`${className} received ApplicationEvent STOPPED - calling deleteByApplicationKey. ${key}`);
                this.deleteByApplicationKey(event.getApplicationKey());
            }
        });
    }

    protected abstract loadByApplication(_applicationKey: ApplicationKey);

    getByApplication(applicationKey: ApplicationKey): T[] {
        api.util.assertNotNull(applicationKey, 'applicationKey not given');
        let cache = this.applicationCaches.getByKey(applicationKey);
        if (!cache) {
            return null;
        }
        return cache.getAll();
    }

    getByKey(key: TKEY): T {
        api.util.assertNotNull(key, 'key not given');

        const applicationKey = key.getApplicationKey();
        const cache = this.applicationCaches.getByKey(applicationKey);
        return cache ? cache.getByKey(key) : null;
    }

    put(descriptor: T) {
        api.util.assertNotNull(descriptor, 'a object to cache must be given');

        const key = descriptor.getKey().getApplicationKey();

        let cache = this.applicationCaches.getByKey(key);
        if (!cache) {
            cache = this.createApplicationCache();
            this.applicationCaches.put(key, cache);
        }
        cache.put(descriptor);
    }

    createApplicationCache(): SimpleApplicationCache<T, TKEY> {
        return new SimpleApplicationCache<T, TKEY>();
    }

    private deleteByApplicationKey(applicationKey: ApplicationKey) {
        this.applicationCaches.removeByKey(applicationKey);
    }
}

export class SimpleApplicationCache<T extends Descriptor, TKEY extends DescriptorKey>
    extends api.cache.Cache<T, TKEY> {

    copy(object: T): T {
        return <T>object.clone();
    }

    getKeyFromObject(object: T): TKEY {
        return <TKEY>object.getKey();
    }

    getKeyAsString(key: TKEY): string {
        return key.toString();
    }
}
