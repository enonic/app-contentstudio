const requests = require('/lib/requests');
const utils = require('/lib/utils');
const OPENAI_API_TOKEN = app.config['openai.apiToken'];
const HARDCODED_ASSISTANT_ID = 'asst_FgKzZ5mi6TlWQMrkcVH7L5GJ';

function request(params) {
    if (!OPENAI_API_TOKEN) {
        throw 'Missing OPENAI_API_TOKEN.';
    }

    return requests.request(utils.copy(params, {
        headers: {
            'Authorization': 'Bearer ' + OPENAI_API_TOKEN,
            'OpenAI-Beta': 'assistants=v1',
        }
    }));
}

exports.request = request;

/**
 * @returns {{status: number, body: string}}
 */
function doGet(url) {
    return requests.getRequest(url, {
        'Authorization': 'Bearer ' + OPENAI_API_TOKEN,
        'OpenAI-Beta': 'assistants=v1',
    });
}

exports.doGet = doGet;

/**
 * @returns {{status: number, body: string}}
 */
function doPost(params) {
    return request(utils.copy(params, {
        method: 'POST',
    }));
}

exports.doPost = doPost;

/*
Client must keep track of all created threads. All active threads must be stored inside a node.
Upon application start list all threads and remove all threads that are older than 2 minutes.
Inactive threads must be cleaned up every 2 minutes.
All threads that expired (in terms of a client interaction) must be deleted.
Thread will be removed automatically after 30 days of inactivity.
Each file uploaded in a thread costs $0.20 per day.
 */

/**
 * @returns {{id: string, object: string, created_at: number, metadata: object}}
 */
exports.createThread = function () {
    const response = doPost({
        path: 'https://api.openai.com/v1/threads',
    });

    return JSON.parse(response.body);
}

/**
 * @returns {{id: string, object: "thread.deleted", deleted: boolean}}
 */
exports.deleteThread = function (id) {
    const response = request({
        method: 'DELETE',
        path: 'https://api.openai.com/v1/threads/' + id,
    });

    return JSON.parse(response.body);
}

/**
 * @returns {{id: string, object: "thread.message", created_at: number, metadata: object}}
 */
exports.createMessage = function (threadId, message) {
    const response = doPost({
        path: 'https://api.openai.com/v1/threads/' + threadId + '/messages',
        body: {
            role: 'user',
            content: message,
        }
    });

    return JSON.parse(response.body);
}

/**
 *
 * @param {string} message
 * @returns {{id: string, assistant_id: string, thread_id: string, status: string}}
 */
exports.createThreadAndRun = function (message) {
    const response = doPost({
        path: 'https://api.openai.com/v1/threads/runs',
        body: {
            assistant_id: HARDCODED_ASSISTANT_ID,
            thread: {
                messages: [{
                    content: message,
                    role: 'user',
                }],
            }
        }
    });

    log.info(JSON.stringify(response));

    return JSON.parse(response.body);
}

/**
 *
 * @param {string} threadId
 * @param {string} runId
 * @returns {{id: string, assistant_id: string, thread_id: string, status: string}}
 */
exports.retrieveRun = function (threadId, runId) {
    log.info('retrieveRun URL: ' + 'https://api.openai.com/v1/threads/' + threadId + '/runs/' + runId);
    const response = doGet('https://api.openai.com/v1/threads/' + threadId + '/runs/' + runId);
    log.info('Retrieved run: ' + response != null);

    log.info(JSON.stringify(response));

    return JSON.parse(response.body);
}

/**
 *
 * @param {string} threadId
 * @returns {{object: "list", data: Array<{role: string, content: Array<{type: string, text: {value: string}}>}>}}
 */
exports.listMessages = function (threadId) {
    const response = doGet('https://api.openai.com/v1/threads/' + threadId + '/messages');

    log.info(JSON.stringify(response));

    return JSON.parse(response.body);
}
