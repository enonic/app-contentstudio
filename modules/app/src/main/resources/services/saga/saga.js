const authLib = require('/lib/xp/auth');
const requests = require('/lib/requests');
const openAI = require('./openai');

exports.get = function (request) {
    const isAuthenticated = authLib.getUser() != null;
    if (!isAuthenticated) {
        return requests.respondMessage(401, 'You must be logged to use Saga.');
    }

    log.info(JSON.stringify(request));

    try {
        const threadId = request.params.thread_id;
        if (!threadId) {
            return requests.respondJson(400, 'Missing thread_id parameter.');
        }

        const runId = request.params.run_id;
        if (!runId) {
            return requests.respondJson(400, 'Missing run_id parameter.');
        }

        log.info('openAI.retrieveRun');
        const response = openAI.retrieveRun(threadId, runId);

        if (response.status !== 'completed') {
            log.info('GET: Not completed yet.');
            return requests.respondJson(200, {
                status: response.status || 'unknown',
            });
        }

        log.info('GET: Retrieving messages');
        const messages = openAI.listMessages(threadId).data;
        for (let i = 0; i < messages.length; i++) {

            const message = messages[i];
            if (!message || message.role !== 'assistant') {
                continue;
            }

            const text = message && message.content[0].text.value;
            const match = text && text.match(/```html\n([\s\S]*?)\n```/);
            const html = match && match.length > 1 ? match[1].trim() : null;

            if (html) {
                return requests.respondJson(200, {
                    status: response.status,
                    data: html,
                });
            }
        }

        return requests.respondJson(200, {
            status: response.status,
        });
    } catch (e) {
        log.error(e);
        return requests.respondJson(400, 'Invalid JSON.');
    }
};

exports.post = function (request) {
    const isAuthenticated = authLib.getUser() != null;
    if (!isAuthenticated) {
        return requests.respondMessage(401, 'You must be logged to use Saga.');
    }

    try {
        const body = JSON.parse(request.body);

        const result = processData(body);

        return requests.respondJson(200, result);
    } catch (e) {
        return requests.respondJson(400, 'Invalid JSON.');
        log.error(e);
    }
};

function processData(data) {
    const html = data.html;
    const selectedHtml = data.selectedHtml;

    if (html == null) {
        throw 'Missing html.';
    }

    log.info('openAI.createThreadAndRun: ');
    const result = openAI.createThreadAndRun('Expand the following text in code:\n```html\n' + (html || selectedHtml) + '\n```');
    log.info(JSON.stringify(result));

    switch (result.status) {
    case 'queued':
    case 'in_progress':
    case 'completed':
        return {
            assistant_id: result.assistant_id,
            thread_id: result.thread_id,
            run_id: result.id,
            status: result.status,
        };
    default:
        throw 'Run failed with status: ' + result.status;
    }
}
