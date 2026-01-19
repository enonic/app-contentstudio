/**
 * Created on 15.08.2022
 */
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
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // TODO uncomment it ,issue-9241
    it.skip(`GIVEN Text component has been inserted WHEN 'Html table' has been inserted AND saved THEN 'Saved' button should be visible in the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let htmlTableDialog = new HtmlTableDialog();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text-component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Click on 'Insert Table' menu-button:
            await textComponentCke.clickOnInsertTableButton();
            // 5. Click on More... button and open Table modal dialog
            await textComponentCke.clickOnMoreButtonInHtmlTableFrame();
            await htmlTableDialog.waitForDialogLoaded();
            // 6. Insert number of columns and rows
            await htmlTableDialog.typeTextInRowsInput(3);
            await htmlTableDialog.typeTextInColumnsInput(3);
            // 7. Click on OK button and insert the table:
            await htmlTableDialog.clickOnOkButton();
            await htmlTableDialog.waitForDialogClosed();
            await contentWizard.pause(500);
            // 8. Save the changes:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(1000);
            await studioUtils.saveScreenshot('cke_html_table_inserted');
            // 9. Verify that 'Saved' button is disabled:
            await contentWizard.waitForSavedButtonVisible();
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
