/**
 * Created on 06.04.2018.
 * Verifies: xp-apps#747 Issues with the moving of fragments(Confirmation dialog does not appear, when a fragment is filtered)
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const TextComponent = require('../../page_objects/components/text.component');

describe('Move Fragment specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN text-component has been saved as fragment THEN new Fragment-content should be created`,
        async() = > {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponent = new TextComponent();
    //1. Open existing site and insert new text component with the text:
    await
    studioUtils.selectContentAndOpenWizard(SITE.displayName);
    await
    contentWizard.clickOnShowComponentViewToggler();
    await
    pageComponentView.openMenu("main");
    await
    pageComponentView.selectMenuItem(["Insert", "Text"]);
    await
    textComponent.typeTextInCkeEditor('text_component_1')
    await
    contentWizard.switchToMainFrame();
    await
    contentWizard.waitAndClickOnSave();
    await
    contentWizard.pause(1500);
    //2. wait for (1500) page is rendered and open the menu
    await
    pageComponentView.openMenu("text_component_1");
    //3. Click on Save as Fragment menu item:
    await
    pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
    studioUtils.saveScreenshot('text_saved_as_fragment2')
        });

    // Verifies: app-contentstudio#22 Confirmation dialog does not appear, when a fragment is filtered
    it(`GIVEN existing text-fragment is selected WHEN 'Move' button has been pressed and the action is confirmed THEN the fragment should be moved to the root directory`,
        async() = > {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            let confirmationDialog = new ConfirmationDialog();
    //1. Select the fragment and click on Move button:
    await
    studioUtils.findAndSelectContentByDisplayName('text_component_1');
    await
    contentBrowsePanel.clickOnMoveButton();
    //2. Verify -  modal dialog is loaded and click on Move button:
    await
    moveContentDialog.waitForOpened();
    await
    moveContentDialog.clickOnMoveButton();
    //3. Verify - Confirmation dialog should be loaded!
    await
    confirmationDialog.waitForDialogOpened();
    //4. Click on 'Yes' button:
    await
    confirmationDialog.clickOnYesButton();
    //5. Verify the notification message - "You are about to move content out of its site which might make it unreachable. Are you sure?"
    studioUtils.saveScreenshot('fragment_is_moved');
    let actualMessage = await
    contentBrowsePanel.waitForNotificationMessage();
    assert.equal(actualMessage, `Item \"text_component_1\" is moved.`, 'Expected notification message should appear');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
