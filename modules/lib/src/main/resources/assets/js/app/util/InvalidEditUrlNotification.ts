import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {showError, showFeedback, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';

interface Notification {
    message: string;
    type: ExceptionType;
}

function createNotification(reason: unknown): Notification {
    if (ObjectHelper.iFrameSafeInstanceOf(reason, Exception)) {
        const exception = reason as Exception;

        return {
            message: exception.getMessage(),
            type: exception.getType(),
        };
    }

    return {
        message: String(reason).replace(/^Error: /, ''),
        type: ExceptionType.ERROR,
    };
}

export function showInvalidEditUrlNotification(reason: unknown): void {
    const notification = createNotification(reason);

    switch (notification.type) {
    case ExceptionType.INFO:
        showFeedback(notification.message);
        break;
    case ExceptionType.WARNING:
        showWarning(notification.message);
        break;
    case ExceptionType.ERROR:
    default:
        showError(notification.message);
        break;
    }
}
