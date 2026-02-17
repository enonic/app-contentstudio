import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ApplicationRemovedEvent} from './ApplicationRemovedEvent';
import {type Site} from '../content/Site';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {type PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {type PropertyAddedEvent} from '@enonic/lib-admin-ui/data/PropertyAddedEvent';
import {type PropertyRemovedEvent} from '@enonic/lib-admin-ui/data/PropertyRemovedEvent';
import {type Property} from '@enonic/lib-admin-ui/data/Property';
import {type ContentId} from '../content/ContentId';

export class SiteModel {

    private site: Site;

    private siteConfigs: ApplicationConfig[];

    private applicationAddedListeners: ((applicationConfig: ApplicationConfig) => void)[] = [];

    private applicationRemovedListeners: ((event: ApplicationRemovedEvent) => void)[] = [];

    private propertyChangedListeners: ((event: PropertyChangedEvent) => void)[] = [];

    private applicationPropertyAddedListener: (event: PropertyAddedEvent) => void;

    private applicationPropertyRemovedListener: (event: PropertyRemovedEvent) => void;

    private applicationGlobalEventsListener: (event: ApplicationEvent) => void;

    private applicationStoppedListeners: ((applicationEvent: ApplicationEvent) => void)[] = [];

    private applicationStartedListeners: ((applicationEvent: ApplicationEvent) => void)[] = [];

    private applicationUninstalledListeners: ((applicationEvent: ApplicationEvent) => void)[] = [];

    private siteModelUpdatedListeners: (() => void)[] = [];

    constructor(site: Site) {
        this.initApplicationPropertyListeners();
        this.setup(site);
    }

    private initApplicationPropertyListeners() {
        this.applicationPropertyAddedListener = (event: PropertyAddedEvent) => {
            const property: Property = event.getProperty();

            if (property.getPath().toString().indexOf('.siteConfig') === 0 &&
                property.getName() === ApplicationConfig.PROPERTY_CONFIG) {
                const siteConfig: ApplicationConfig = ApplicationConfig.create().fromData(property.getParent()).build();

                if (!this.siteConfigs) {
                    this.siteConfigs = [];
                }

                this.siteConfigs.push(siteConfig);
                this.notifyApplicationAdded(siteConfig);
            }
        };

        this.applicationPropertyRemovedListener = (event: PropertyRemovedEvent) => {
            const property: Property = event.getProperty();

            if (property.getName() === 'siteConfig') {
                const applicationKey: ApplicationKey =
                    ApplicationKey.fromString(property.getPropertySet().getString(ApplicationConfig.PROPERTY_KEY));
                this.siteConfigs =
                    this.siteConfigs.filter((siteConfig: ApplicationConfig) => !siteConfig.getApplicationKey().equals(applicationKey));
                this.notifyApplicationRemoved(applicationKey);
            }
        };

        this.applicationGlobalEventsListener = (event: ApplicationEvent) => {
            switch (event.getEventType()) {
            case ApplicationEventType.STOPPED:
                this.notifyApplicationStopped(event);
                break;
            case ApplicationEventType.STARTED:
                this.notifyApplicationStarted(event);
                break;
            case ApplicationEventType.UNINSTALLED:
                this.notifyApplicationUninstalled(event);
                break;
            }
        };
    }

    private setup(site: Site) {
        this.site = site;
        this.siteConfigs = site.getSiteConfigs();
        this.site.getContentData().onPropertyAdded(this.applicationPropertyAddedListener);
        this.site.getContentData().onPropertyRemoved(this.applicationPropertyRemovedListener);
        ApplicationEvent.on(this.applicationGlobalEventsListener);
    }

    update(site: Site): SiteModel {
        const changed = !ObjectHelper.equals(site, this.site);

        if (this.site) {
            this.site.getContentData().unPropertyAdded(this.applicationPropertyAddedListener);
            this.site.getContentData().unPropertyRemoved(this.applicationPropertyRemovedListener);
            ApplicationEvent.un(this.applicationGlobalEventsListener);
        }

        if (site) {
            this.setup(site);
        }

        if (changed) {
            this.notifySiteModelUpdated();
        }

        return this;
    }

    getSite(): Site {
        return this.site;
    }

    getSiteId(): ContentId {
        return this.site.getContentId();
    }

    getApplicationKeys(): ApplicationKey[] {
        return this.siteConfigs.map((sc: ApplicationConfig) => sc.getApplicationKey());
    }

    onPropertyChanged(listener: (event: PropertyChangedEvent) => void) {
        this.propertyChangedListeners.push(listener);
    }

    unPropertyChanged(listener: (event: PropertyChangedEvent) => void) {
        this.propertyChangedListeners =
            this.propertyChangedListeners.filter((curr: (event: PropertyChangedEvent) => void) => listener !== curr);
    }

    onApplicationAdded(listener: (applicationConfig: ApplicationConfig) => void) {
        this.applicationAddedListeners.push(listener);
    }

    unApplicationAdded(listener: (applicationConfig: ApplicationConfig) => void) {
        this.applicationAddedListeners =
            this.applicationAddedListeners.filter((curr: (config: ApplicationConfig) => void) => listener !== curr);
    }

    private notifyApplicationAdded(applicationConfig: ApplicationConfig) {
        this.applicationAddedListeners.forEach((listener: (applicationConfig) => void) => {
            listener(applicationConfig);
        });
    }

    onApplicationRemoved(listener: (event: ApplicationRemovedEvent) => void) {
        this.applicationRemovedListeners.push(listener);
    }

    unApplicationRemoved(listener: (event: ApplicationRemovedEvent) => void) {
        this.applicationRemovedListeners =
            this.applicationRemovedListeners.filter((curr: (event: ApplicationRemovedEvent) => void) => listener !== curr);
    }

    private notifyApplicationRemoved(applicationKey: ApplicationKey) {
        const event = new ApplicationRemovedEvent(applicationKey);
        this.applicationRemovedListeners.forEach((listener: (event: ApplicationRemovedEvent) => void) => {
            listener(event);
        });
    }

    onApplicationUnavailable(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationStoppedListeners.push(listener);
    }

    unApplicationUnavailable(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationStoppedListeners =
            this.applicationStoppedListeners.filter((curr: (applicationEvent: ApplicationEvent) => void) => listener !== curr);
    }

    private notifyApplicationStopped(applicationEvent: ApplicationEvent) {
        this.applicationStoppedListeners.forEach((listener: (applicationEvent: ApplicationEvent) => void) => {
            listener(applicationEvent);
        });
    }

    onApplicationStarted(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationStartedListeners.push(listener);
    }

    unApplicationStarted(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationStartedListeners =
            this.applicationStartedListeners.filter((curr: (applicationEvent: ApplicationEvent) => void) => listener !== curr);
    }

    onApplicationUninstalled(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationUninstalledListeners.push(listener);
    }

    unApplicationUninstalled(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationUninstalledListeners =
            this.applicationUninstalledListeners.filter((curr: (applicationEvent: ApplicationEvent) => void) => listener !== curr);
    }

    private notifyApplicationStarted(applicationEvent: ApplicationEvent) {
        this.applicationStartedListeners.forEach((listener: (applicationEvent: ApplicationEvent) => void) => {
            listener(applicationEvent);
        });
    }

    private notifyApplicationUninstalled(applicationEvent: ApplicationEvent) {
        this.applicationUninstalledListeners.forEach((listener: (applicationEvent: ApplicationEvent) => void) => {
            listener(applicationEvent);
        });
    }

    onSiteModelUpdated(listener: () => void) {
        this.siteModelUpdatedListeners.push(listener);
    }

    unSiteModelUpdated(listener: () => void) {
        this.siteModelUpdatedListeners =
            this.siteModelUpdatedListeners.filter((curr: () => void) => {
                return listener !== curr;
            });
    }

    private notifySiteModelUpdated() {
        this.siteModelUpdatedListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}
