/**
 * Created on 11.01.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');

describe('add.new.in.selector.spec ui-tests for adding a new content directly from Content Selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const SHORTCUT_NAME = appConst.generateRandomName('shortcut');
    const NEW_CONTENT_NAME = appConst.generateRandomName('folder');

    it(`GIVEN wizard for new shortcut is opened WHEN 'Add new' icon has been clicked THEN 'New Content' modal dialog should be loaded`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let newContentDialog = new NewContentDialog();
            // 1. Open shortcut-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            await contentWizard.waitAndClickOnSave();
            // 2. Click on 'Add new' button and create new folder
            await shortcutForm.clickOnAddNewContentButton();
            await newContentDialog.waitForOpened();
            await studioUtils.clickOnItemInNewContentDialog(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(NEW_CONTENT_NAME);
            await contentWizard.waitAndClickOnSave();
            // 3. Switch to shortcut-wizard:
            await studioUtils.doSwitchToPrevTab();
            // 4. Verify that 'Add new' button gets not visible:
            await shortcutForm.waitForAddNewContentButtonNotDisplayed();
            // 5. Verify that created folder is displayed in the elected option in shortcut-wizard:
            let actualTarget = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualTarget, NEW_CONTENT_NAME, 'Expected folder-name should be displayed');
        });

    it(`GIVEN existing shortcut is opened THEN the selected target has been removed THEN 'Add new' button gets visible again`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            // 1. Open the existing shortcut:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_NAME);
            // 2. Remove the selected option in target selector:
            await shortcutForm.clickOnRemoveTargetIcon();
            // 3. Verify that 'Add new' button gets visible again:
            await shortcutForm.waitForAddNewContentButtonDisplayed();
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
