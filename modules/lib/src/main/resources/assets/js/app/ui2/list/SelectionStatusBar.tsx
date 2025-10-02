import {cn} from "@enonic/ui";
import {StatusIcon} from "../icons/StatusIcon";
import {LoaderCircle} from "lucide-react";

type StatusEntryProps = {
    className?: string;
    children: React.ReactNode;
};

type Props = {
    className?: string;
    loading?: boolean;
    editing?: boolean;
};

export const StatusEntry = ({className, children}: StatusEntryProps): React.ReactElement => {
    return <div className={cn('flex gap-2 min-h-19 p-5 rounded-lg', className)}>
        {children}
    </div>;
};

export const SelectionStatusBar = ({className, loading, editing}: Props): React.ReactElement => {
    return (
        <div className={cn('flex flex-col gap-2.5', className)}>
            {loading && <StatusEntry>
                <LoaderCircle className="w-7 h-7 animate-spin" />
            </StatusEntry>}
            {editing && <StatusEntry>
                <StatusIcon status='info'/>
            </StatusEntry>}
        </div>
    );
};
