import {Store} from '@enonic/lib-admin-ui/store/Store';

export class VersionContext {

    private versions: Map<string, string>;

    private activeVersionChangedEventListeners: { (contentId: string, version: string): void }[] = [];

    private constructor() {
        this.versions = new Map();
    }

    private static get(): VersionContext {
        let instance: VersionContext = Store.instance().get('versionContext');

        if (instance == null && document.body) {
            instance = new VersionContext();
            Store.instance().set('versionContext', instance);
        }

        return instance;
    }

    static getActiveVersion(contentId): string {
        return VersionContext.get().versions.get(contentId);
    }

    static hasActiveVersion(contentId): boolean {
        return VersionContext.get().versions.has(contentId);
    }

    static isActiveVersion(contentId: string, versionId: string): boolean {
        return VersionContext.getActiveVersion(contentId) === versionId;
    }

    static setActiveVersion(contentId: string, activeVersionId: string): void {
        if (VersionContext.getActiveVersion(contentId) === activeVersionId) {
            return;
        }

        VersionContext.get().versions.set(contentId, activeVersionId);
        VersionContext.get().notifyActiveVersionChanged(contentId, activeVersionId);
    }

    static onActiveVersionChanged(handler: (contentId: string, version: string) => void) {
        VersionContext.get().activeVersionChangedEventListeners.push(handler);
    }

    static unActiveVersionChanged(handler: (contentId: string, version: string) => void) {
        VersionContext.get().activeVersionChangedEventListeners =
            VersionContext.get().activeVersionChangedEventListeners.filter((curr: { (contentId: string, version: string): void }) => {
                return handler !== curr;
            });
    }

    private notifyActiveVersionChanged(contentId: string, version: string) {
        this.activeVersionChangedEventListeners.forEach((handler: { (contentId: string, version: string): void }) => {
            handler(contentId, version);
        });
    }
}
