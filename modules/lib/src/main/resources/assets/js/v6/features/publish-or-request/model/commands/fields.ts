// Commands that change what the user entered in the fields of the publish or request
// dialog's second step. They only keep the values; nothing is checked or sent here.

import { $publishOrRequestFields } from '../publishOrRequestFields.store';

/** Keeps whether the user ticked "Assign to". The assignees stay as they are. */
export function setPublishOrRequestAssignChecked(checked: boolean): void {
    $publishOrRequestFields.setKey('assignChecked', checked);
}

/** Replaces the assignees with the given principal keys. */
export function setPublishOrRequestAssignees(assigneeIds: readonly string[]): void {
    $publishOrRequestFields.setKey('assigneeIds', [...assigneeIds]);
}

/** Keeps whether the user ticked "Scheduled publish". The dates stay as they are. */
export function setPublishOrRequestScheduleChecked(checked: boolean): void {
    $publishOrRequestFields.setKey('scheduleChecked', checked);
}

/** Sets the moment the items go online, or clears it. */
export function setPublishOrRequestScheduleFrom(from: Date | undefined): void {
    $publishOrRequestFields.setKey('scheduleFrom', from);
}

/** Sets the moment the items go offline, or clears it. */
export function setPublishOrRequestScheduleTo(to: Date | undefined): void {
    $publishOrRequestFields.setKey('scheduleTo', to);
}

/** Keeps what the "online from" input reports about the text typed in it. */
export function setPublishOrRequestScheduleFromError(error: string | undefined): void {
    $publishOrRequestFields.setKey('scheduleFromError', error);
}

/** Keeps what the "online to" input reports about the text typed in it. */
export function setPublishOrRequestScheduleToError(error: string | undefined): void {
    $publishOrRequestFields.setKey('scheduleToError', error);
}

/** Sets the title, as typed. */
export function setPublishOrRequestTitle(title: string): void {
    $publishOrRequestFields.setKey('title', title);
}

/** Sets the comment, as typed. */
export function setPublishOrRequestComment(comment: string): void {
    $publishOrRequestFields.setKey('comment', comment);
}
