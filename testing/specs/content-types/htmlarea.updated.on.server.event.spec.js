/**
 * Created on 04.12.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const LauncherPanel = require('../../page_objects/launcher.panel');

describe('htmlarea.updated.on.server.event.spec: tests for updating html area on server event', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const TEXT1 = 'test12345';
    const TEXT2 = 'test 9999';
    let SITE;
    const CONTENT_NAME = contentBuilder.generateRandomName('area');


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // HtmlArea is not updated on server event #7132
    // https://github.com/enonic/app-contentstudio/issues/7132
    it(`GIVEN Open a same content item with HtmlArea in two browser tabs WHEN  update the text one of area THEN the text should ve updated in the second browser tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let launcherPanel = new LauncherPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open a new wizard for a content with htmlArea:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            await htmlAreaForm.insertTextInHtmlArea(0, TEXT1);
            // 2. Save the new content:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 3. Open a same content item with HtmlArea in two browser tabs:
            //  Close then reopen the tab with 'Content Studio'
            await studioUtils.doCloseWindowTabByTitle(appConst.BROWSER_XP_TITLES.CONTENT_STUDIO);
            // Open the tab with Content Browse Panel (index of the tab is 2)
            await launcherPanel.clickOnContentStudioLink();
            await studioUtils.doSwitchToContentBrowsePanel();
            // Open the same content in new browser tab   (index of the tab is 3):
            await studioUtils.findAndSelectItem(CONTENT_NAME);
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            // 4. Update the text in htmlArea:
            await htmlAreaForm.insertTextInHtmlArea(0, TEXT2);
            // 5. save the content
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('updated_text_in_first_tab_htmlarea')
            // 6. switch to another tab with the same html-area content
            await studioUtils.doSwitchToTabByIndex(1);
            await studioUtils.saveScreenshot('check_updated_text_in_second_tab');
            // 7. Verify that the text should be updated in the second browser tab
            let textActual = await htmlAreaForm.getTextInHtmlArea(0);
            assert.ok(textActual.includes(TEXT2), "Text in shtmlArea should include the expected text");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
