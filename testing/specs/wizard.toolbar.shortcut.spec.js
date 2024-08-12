/**
 * Created on 17.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const appConst = require('../libs/app_const');

describe('Wizard toolbar - shortcut spec', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let DISPLAY_NAME;
    const WIZARD_TOOLBAR_ARIA_LABEL = 'Main menu bar';
    const WIZARD_TOOLBAR_ROLE = 'toolbar';
    const CONTENT_WIZARD_PROJECT_VIEWER_ARIA_LABEL = 'Content project selector';
    const CONTENT_WIZARD_PROJECT_VIEWER_ARIA_HAS_POPUP = 'dialog';

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+s' has been pressed THEN folder should be saved`,
        async () => {
            let contentWizard = new ContentWizard();
            DISPLAY_NAME = contentBuilder.generateRandomName('folder');
            // 1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            await contentWizard.pause(1000);
            // 2. Press 'Ctrl+S'
            await contentWizard.hotKeySave();
            // 3. Verify the notification message:
            await contentWizard.waitForExpectedNotificationMessage(appConst.itemSavedNotificationMessage(DISPLAY_NAME));
        });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`,
        async () => {
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            let contentWizard = new ContentWizard();
            // 2. Press 'Ctrl+Delete'
            await contentWizard.hotKeyDelete();
            // 3. Verify that Delete Content dialog loaded:
            await studioUtils.saveScreenshot('wizard_shortcut_delete');
            await deleteContentDialog.waitForDialogOpened();
        });

    // verifies:https://github.com/enonic/app-contentstudio/issues/127
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Alt+p' have been pressed THEN 'Publish Dialog' should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Press 'Ctrl+Alt+p'
            await contentWizard.hotKeyPublish();
            // 3. Verify that Publish Content dialog loaded:
            await contentPublishDialog.waitForDialogOpened();
        });

    // Verify Accessibility attributes in Content Wizard Panel:
    it(`WHEN existing folder has been opened THEN role attribute should be set to 'toolbar' for wizard-toolbar div`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Verify that role attribute is set to 'toolbar' for wizard-toolbar div:
            await contentWizard.waitForToolbarRoleAttribute(WIZARD_TOOLBAR_ROLE);
        });

    // Verify Accessibility attributes in Content Wizard Panel:
    it(`WHEN existing folder has been opened THEN div with expected 'aria-label' attribute ('Main menu bar') should be present`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Verify that Browse-Toolbar is a div with expected 'aria-label' attribute ('Main menu bar')
            await contentWizard.waitForToolbarAriaLabelAttribute(WIZARD_TOOLBAR_ARIA_LABEL);
            // 3. Verify that expected aria-label attribute set ProjectViewer div:  aria-label='Content project selector'
            await contentWizard.waitForProjectViewerAriaLabelAttribute(CONTENT_WIZARD_PROJECT_VIEWER_ARIA_LABEL);
            // 4. 'Default' project should be displayed in the viewer in wizard:
            let actualProjectName = await contentWizard.getProjectDisplayName();
            assert.equal(actualProjectName, appConst.PROJECTS.DEFAULT_PROJECT_NAME,
                'Default project name should be displayed in Project Viewer bar');
            // 5. Verify 'aria-haspopup' attribute in the project-viewer div:
            await contentWizard.waitForProjectViewerAriaHasPopupAttribute(CONTENT_WIZARD_PROJECT_VIEWER_ARIA_HAS_POPUP);
        });

    it.skip(`GIVEN folder-wizard is opened WHEN 'Alt+w' have been pressed THEN wizard should be closed and grid is loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            await contentWizard.hotKeyCloseWizard();
            await contentBrowsePanel.waitForGridLoaded();
        });

    it(`GIVEN existing folder is opened AND the display name has been updated WHEN 'Ctrl+Enter' have been pressed THEN the content should be saved and the wizard closes`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Update the content, Save gets enabled:
            await contentWizard.typeDisplayName(appConst.generateRandomName('test'));
            // 3. Press 'Ctrl+Enter
            await contentWizard.hotKeySaveAndCloseWizard();
            // 4. Verify that the wizard is closed:
            await contentBrowsePanel.waitForGridLoaded();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let contentWizard = new ContentWizard();
        return contentWizard.isAlertPresent().then(result => {
            if (result) {
                return contentWizard.alertAccept();
            }
        }).then(() => {
            return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        })
    });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
