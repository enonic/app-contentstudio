/**
 * Created on 15.08.2022
 */
const chai = require('chai');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const HtmlTableDialog = require('../../page_objects/wizardpanel/html.table.dialog');

describe('Text Component with CKE - insert html table', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component has been inserted WHEN 'Html table' has been inserted AND saved THEN 'Saved' button should be visible in the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let htmlTableDialog = new HtmlTableDialog();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //1. Insert a text-component:
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await pageComponentView.clickOnCloseButton();
            await textComponentCke.switchToLiveEditFrame();
            //2. Click on 'Insert Table' menu-button:
            await textComponentCke.clickOnInsertTableButton();
            // menu item for inserting of Html-table gets visible:
            //await textComponentCke.waitForTableDisplayedInCke();
            //3. Click on More... button and open Table modal dialog
            await textComponentCke.clickOnMoreButtonInHtmlTableFrame();
            await htmlTableDialog.waitForDialogLoaded();
            //4. Insert number of columns and rows
            await htmlTableDialog.typeTextInRowsInput(3);
            await htmlTableDialog.typeTextInColumnsInput(3);
            //5. Click on OK button and insert the table:
            await htmlTableDialog.clickOnOkButton();
            //6. Save the changes:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(1000);
            await studioUtils.saveScreenshot("cke_html_table_inserted");
            //7. Verify that Saved button is disabled:
            await contentWizard.waitForSavedButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
