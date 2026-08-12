/**
 * Created on 20.09.2022. updated on 12.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');

describe('layer.with.app.spec - tests for layer with applications', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const IMPORTED_SITE = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const EXPECTED_ORDER = 'Display name (Z-A)';

    it("Precondition 1 - new layer in 'Default' project should be added by SU", async () => {
        await studioUtils.closeProjectSelectionDialog();
        await studioUtils.openSettingsPanel();
        // 1. Select 'Default' project and open wizard for new layer:
        await projectUtils.selectParentAndOpenProjectWizardDialog(appConst.PROJECTS.DEFAULT_PROJECT_NAME);
        let layer = projectUtils.buildLayer(
            appConst.PROJECTS.DEFAULT_PROJECT_NAME,
            null,
            appConst.PROJECT_ACCESS_MODE.PUBLIC,
            null,
            appConst.APP_CONTENT_TYPES,
            LAYER_DISPLAY_NAME,
        );
        await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
    });

    it('GIVEN Project Selection dialog is opened Focus should be set on the current project WHEN Arrow Up have been pressed THEN the next project should be selected', async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let projectSelectionDialog = new ProjectSelectionDialog();
        // 1. Select the layer's context:
        await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
        // 2. Open Project Selection dialog:
        await contentBrowsePanel.clickOnProjectViewerButton();
        await projectSelectionDialog.waitForDialogLoaded();
        await studioUtils.saveScreenshot('project_selection_dialog_current_project');
        // 3. Verify - The Focus is set on the current project
        await projectSelectionDialog.waitForSelectedProjectItem(LAYER_DISPLAY_NAME);
        await projectSelectionDialog.press_Tab();
        await projectSelectionDialog.press_Tab();
        // 4. Press Arrow Up
        await projectSelectionDialog.pressArrowUp();
        // 5. Press 'Enter' key(switch to the next project):
        await projectSelectionDialog.pressEnterKey();
        await studioUtils.saveScreenshot('project_selection_dialog_shift_tab_pressed');
        let currentProject = await contentBrowsePanel.getCurrentProjectDisplayName();
        // 6. Verify - The next project should be displayed in the Browse Panel:
        assert.ok(currentProject.includes(LAYER_DISPLAY_NAME) === false, 'The next project should be selected');
    });

    // Verifies: New Content dialog doesn't show content types from project apps #5104
    // https://github.com/enonic/app-contentstudio/issues/5104
    it("GIVEN layer's context with an application is selected AND no selections in the grid WHEN New content dialog is opened THEN all content types from project's application should be available in the dialog", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Select the layer's context:
        await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
        // 2. Click on 'New' button
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.pause(500);
        await studioUtils.saveScreenshot('root_new_content_with_apps');
        // 3. Verify that all input types are available for adding new content in root directory:
        let contentTypeItems = await newContentDialog.getItemsInAllTab();
        assert.ok(contentTypeItems.includes('all-inputs'), 'Expected input type is displayed in the modal dialog');
        assert.ok(contentTypeItems.includes('attachment0_0'), 'Expected input type is displayed in the modal dialog');
        assert.ok(contentTypeItems.length > 50, 'All types from the application are present in the modal dialog');
    });

    // Verifies Copy of inherited content should not be created as 'inherited' #8269
    // https://github.com/enonic/xp/issues/8269
    it("GIVEN layer's context is selected WHEN inherited site has been duplicated THEN the local copy of the site should not be created as 'inherited'", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Select the layer's context:
        await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
        await studioUtils.findAndSelectItem(IMPORTED_SITE);
        let contentDuplicateDialog = await contentBrowsePanel.clickOnDuplicateButtonAndWait();
        await contentDuplicateDialog.clickOnDuplicateButton();
        await contentDuplicateDialog.waitForDialogClosed();
        // 2. Verify that the copy of the site should not be displayed as 'inherited':
        await studioUtils.findAndSelectItem(IMPORTED_SITE + '-copy');
        await studioUtils.saveScreenshot('inherited_site_copy');
        let isInherited = await contentBrowsePanel.isContentInherited(IMPORTED_SITE + '-copy');
        assert.ok(isInherited === false, 'Copy of inherited site should not be with gray mask');
    });

    // Verifies #2576 Inherited icon and Reset button should not be displayed in duplicated content
    it("GIVEN copy of the inherited site is selected WHEN the site has been opened THEN 'Reset' button should not be displayed in the wizard toolbar", async () => {
        // 1. Select the layer's context:
        await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
        // 2. Open the site
        let contentWizard = await studioUtils.openContentAndSwitchToTabByDisplayName(
            IMPORTED_SITE + '-copy',
            IMPORTED_SITE,
        );
        await studioUtils.saveScreenshot('inherited_site_copy_wizard');
        // 3. Verify that 'Reset' button is not displayed:
        await contentWizard.waitForResetButtonNotDisplayed();
    });

    it("GIVEN the duplicate of inherited site is selected WHEN 'Sort' dialog has been opened THEN 'Default' sorting order should be selected in the modal dialog", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let sortContentDialog = new SortContentDialog();
        // 1. Select the layer's context:
        await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
        // 2. Select the duplicate of inherited site and open Sort Content dialog:
        await studioUtils.findAndSelectItem(IMPORTED_SITE + '-copy');
        await contentBrowsePanel.clickOnSortButton();
        await sortContentDialog.waitForDialogVisible();
        await studioUtils.saveScreenshot('inherited_site_order');
        // 3. Verify that 'Default' order is selected :
        let actualOrder = await sortContentDialog.getSelectedOrder();
        assert.equal(actualOrder, EXPECTED_ORDER, "'Modified date' order should be selected in the modal dialog");
    });

    it('Post conditions: the layer should be deleted', async () => {
        await studioUtils.openSettingsPanel();
        await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
    });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioApp();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
