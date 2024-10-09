/**
 * Created on 13.02.2024
 */
const BasDropdown = require('../selectors/base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ProjectsSelector')]",
};

// Parent Step wizard - select a project in the dropdown selector
class ProjectsSelector extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredByIdAndClickOnApply(projectId, parentElement) {
        try {
            await this.clickOnFilteredByNameItemAndClickOnApply(projectId, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Projects Selector selector, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async selectFilteredByDisplayNameAndClickOnApply(displayName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(displayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Project Selector selector, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ProjectsSelector;
