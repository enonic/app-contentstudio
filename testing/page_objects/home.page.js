/**
 * Created on 6/19/2017.
 */

const Page = require('./page');
const appConst = require('../libs/app_const');

const xpTourDialog = {
    container: `//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]`
};
const XPATH = {
    container: `div[class*='home-main-container visible']`
};

const selectors = {
    contentStudioLink: 'a[id="com.enonic.app.contentstudio"] span.app-tile-name',
    avatarButton:'button#avatar-button',
};

class HomePage extends Page {

    get closeXpTourButton() {
        return `${xpTourDialog.container}//div[@class='cancel-button-top']`;
    }

    async waitForLoaded() {
        return await this.waitForElementDisplayed(XPATH.container);
    }

    isLoaded() {
        return this.isElementDisplayed(XPATH.container);
    }

    async isAvatarButtonDisplayed() {
        try {
            let host = await this.getXpMenuShadowHost();
            const avatarButton = await host.shadow$(selectors.avatarButton);
            return await avatarButton.isDisplayed();
        } catch (err) {
            return false;
        }
    }

    async waitForContentLinkDisplayed(){
        const host = await this.getXpMenuShadowHost();
        const span = await host.shadow$(selectors.contentStudioLink);
        await span.waitForDisplayed({timeout: appConst.mediumTimeout});
    }

    async clickOnContentStudioLink() {
        try {
            const host = await this.getXpMenuShadowHost();
            const span = await host.shadow$(selectors.contentStudioLink);
            await span.waitForDisplayed({timeout: appConst.mediumTimeout});
            await span.click();
        } catch (err) {
            await this.handleError('Content Studio link was not found', 'err_content_studio_link', err);
        }
    }
}

module.exports = HomePage;
