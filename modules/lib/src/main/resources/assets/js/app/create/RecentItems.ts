import { NewContentEvent } from './NewContentEvent';
import { CookieHelper } from '@enonic/lib-admin-ui/util/CookieHelper';

NewContentEvent.on((event: NewContentEvent) => {
    RecentItems.get().addItemName(event.getContentTypeName());
});

export class RecentItems {
    private static INSTANCE: RecentItems = new RecentItems();

    private maximum: number = 7;

    private cookieKey: string = 'app.browse.RecentItemsList';

    private cookieExpire: number = 30;

    private valueSeparator: string = '|';

    public static get(): RecentItems {
        return RecentItems.INSTANCE;
    }

    public addItemName(name: string) {
        let itemsNames = this.getRecentItemsNames();

        itemsNames = itemsNames.filter((storedName: string) => storedName !== name);
        itemsNames.unshift(name);
        itemsNames = itemsNames.slice(0, this.maximum);

        CookieHelper.setCookie(this.cookieKey, itemsNames.join(this.valueSeparator), this.cookieExpire);
    }

    public getRecentItemsNames(): string[] {
        const cookies = CookieHelper.getCookie(this.cookieKey);
        return cookies ? cookies.split(this.valueSeparator) : [];
    }
}
