import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {ApplicationCaches} from 'lib-admin-ui/application/ApplicationCaches';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {Cache} from 'lib-admin-ui/cache/Cache';
import {assertNotNull} from 'lib-admin-ui/util/Assert';
import {Descriptor} from '../page/Descriptor';
import {DescriptorKey} from '../page/DescriptorKey';

export interface CacheableRequest {
    new(keys: ApplicationKey[] | ApplicationKey): ResourceRequest<Descriptor[]>;
}

export class ApplicationBasedCache<T extends Descriptor> {

    // tslint:disable-next-line variable-name
    static registerCache<T extends Descriptor>(descriptor: typeof Descriptor, Request: CacheableRequest): ApplicationBasedCache<T> {
        const w = WindowDOM.get();
        const topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        const cacheName = `${ClassHelper.getFunctionName(descriptor)}Cache`;

        if (!topWindow[cacheName] || BrowserHelper.isIE()) { // IE: Cache fails to work after frame reload (issue with freed script)
            const loadByApplications = (keys: ApplicationKey[]) => new Request(keys).sendAndParse().catch(DefaultErrorHandler.handle);
            topWindow[cacheName] = new ApplicationBasedCache<T>(loadByApplications);
        }
        return topWindow[cacheName];
    }

    private applicationCaches: ApplicationCaches<SimpleApplicationCache<T>>;

    protected constructor(loadByApplication: (keys: ApplicationKey[]) => void) {

        this.applicationCaches = new ApplicationCaches<SimpleApplicationCache<T>>();

        ApplicationEvent.on((event: ApplicationEvent) => {
            const key = event.getApplicationKey();
            const className = ClassHelper.getClassName(this);

            if (!key) {
                return;
            }

            if (ApplicationEventType.STARTED === event.getEventType()) {
                console.log(`${className} received ApplicationEvent STARTED, calling - loadByApplication. ${key.toString()}`);
                loadByApplication([key]);
            } else if (ApplicationEventType.STOPPED === event.getEventType()) {
                console.log(`${className} received ApplicationEvent STOPPED - calling deleteByApplicationKey. ${key.toString()}`);
                this.deleteByApplicationKey(key);
            }
        });
    }

    getByApplications(applicationKeys: ApplicationKey[]): T[] {
        assertNotNull(applicationKeys, 'applicationKeys not given');

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
        assertNotNull(key, 'key not given');

        const applicationKey = key.getApplicationKey();
        const cache = this.applicationCaches.getByKey(applicationKey);
        return cache ? cache.getByKey(key) : null;
    }

    put(descriptor: T) {
        assertNotNull(descriptor, 'a object to cache must be given');

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
    extends Cache<T, DescriptorKey> {

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
