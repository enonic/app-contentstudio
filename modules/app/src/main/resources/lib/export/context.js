const contextLib = require('/lib/xp/context');

function switchContext(repository, branch, successCallback, errorCallback) {
    const context = contextLib.get();

    if (context.repository !== repository || context.branch !== branch) {
        try {
            const newContext = {
                principals: ["role:system.admin"],
                repository,
                branch
            }

            return contextLib.run(newContext, function () {
                return successCallback();
            });
        } catch (e) {
            errorCallback(e);
        }
    } else {
        return successCallback();
    }
}

exports.switchContext = switchContext;
