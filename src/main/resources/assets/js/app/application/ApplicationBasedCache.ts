import ApplicationKey = api.application.ApplicationKey;
import ApplicationEvent = api.application.ApplicationEvent;
import ApplicationEventType = api.application.ApplicationEventType;
import ApplicationCaches = api.application.ApplicationCaches;
import Descriptor = api.content.page.Descriptor;
import DescriptorKey = api.content.page.DescriptorKey;
import ResourceRequest = api.rest.ResourceRequest;

export interface CacheableRequest {
    new(keys: ApplicationKey[] | ApplicationKey): ResourceRequest<any, Descriptor[]>;
}

export class ApplicationBasedCache<T extends Descriptor> {

    // tslint:disable-next-line variable-name
    static registerCache<T extends Descriptor>(descriptor: typeof Descriptor, Request: CacheableRequest): ApplicationBasedCache<T> {
        const w = api.dom.WindowDOM.get();
        const topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        const cacheName = `${api.ClassHelper.getFunctionName(descriptor)}Cache`;

        if (!topWindow[cacheName] || api.BrowserHelper.isIE()) { // IE: Cache fails to work after frame reload (issue with freed script)
            const loadByApplications = (keys: ApplicationKey[]) => new Request(keys).sendAndParse().catch(api.DefaultErrorHandler.handle);
            topWindow[cacheName] = new ApplicationBasedCache<T>(loadByApplications);
        }
        return topWindow[cacheName];
    }

    private applicationCaches: ApplicationCaches<SimpleApplicationCache<T>>;

    protected constructor(loadByApplication: (keys: ApplicationKey[]) => void) {

        this.applicationCaches = new ApplicationCaches<SimpleApplicationCache<T>>();

        ApplicationEvent.on((event: ApplicationEvent) => {
            const key = event.getApplicationKey().toString();
            const className = api.ClassHelper.getClassName(this);

            if (ApplicationEventType.STARTED === event.getEventType()) {
                console.log(`${className} received ApplicationEvent STARTED, calling - loadByApplication. ${key}`);
                loadByApplication([event.getApplicationKey()]);
            } else if (ApplicationEventType.STOPPED === event.getEventType()) {
                console.log(`${className} received ApplicationEvent STOPPED - calling deleteByApplicationKey. ${key}`);
                this.deleteByApplicationKey(event.getApplicationKey());
            }
        });
    }

    getByApplications(applicationKeys: ApplicationKey[]): T[] {
        api.util.assertNotNull(applicationKeys, 'applicationKeys not given');

        let caches = [];
        const allCached = applicationKeys.every((key) => {
            let keyCache = this.applicationCaches.getByKey(key);
            if (keyCache) {
                caches = caches.concat(keyCache.getAll());
            }
            return !!keyCache;
        });

        return allCached ? caches : null;
    }

    getByKey(key: DescriptorKey): T {
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

    putApplicationKeys(applicationKeys: ApplicationKey[]) {
        applicationKeys.forEach((key) => {
            let cache = this.applicationCaches.getByKey(key);
            if (!cache) {
                let newCache = this.createApplicationCache();
                this.applicationCaches.put(key, newCache);
            }
        });
    }

    createApplicationCache(): SimpleApplicationCache<T> {
        return new SimpleApplicationCache<T>();
    }

    private deleteByApplicationKey(applicationKey: ApplicationKey) {
        this.applicationCaches.removeByKey(applicationKey);
    }
}

export class SimpleApplicationCache<T extends Descriptor>
    extends api.cache.Cache<T, DescriptorKey> {

    copy(object: T): T {
        return <T>object.clone();
    }

    getKeyFromObject(object: T): DescriptorKey {
        return object.getKey();
    }

    getKeyAsString(key: DescriptorKey): string {
        return key.toString();
    }
}
