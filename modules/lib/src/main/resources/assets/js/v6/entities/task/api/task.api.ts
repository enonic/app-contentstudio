import { ResultAsync } from 'neverthrow';
import { type TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { TaskInfo } from '@enonic/lib-admin-ui/task/TaskInfo';
import { type TaskInfoJson } from '@enonic/lib-admin-ui/task/TaskInfoJson';
import { requestJson } from '@enonic/ui-utils/request';
import { AppError } from '@enonic/ui-utils';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

/**
 * Fetch a single task's info by id (HTTP fallback for task-event tracking).
 * Used by: entities/task/task.service.
 */
export function fetchTaskInfo(taskId: TaskId): ResultAsync<TaskInfo, AppError> {
    const url = getCmsRestUri(`tasks/${encodeURIComponent(taskId.toString())}`);
    return requestJson<TaskInfoJson>(url).map(TaskInfo.fromJson);
}
