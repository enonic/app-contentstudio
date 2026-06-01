import {cn} from '@enonic/ui';

const JUKE_ICON_NAME = 'JukeIcon';

export type JukeIconProps = {
    className?: string;
};

export const JukeIcon = ({className}: JukeIconProps): React.ReactNode => {
    return (
        <svg
            data-component={JUKE_ICON_NAME}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            aria-hidden="true"
            className={cn(JUKE_ICON_NAME, 'size-16', className)}
        >
            <g transform="scale(5.33333)">
                <circle cx={48} cy={48} r={46.918} fill="#8e50ae" stroke="#3d2065" />
                <g transform="translate(5 22)">
                    <path
                        d="M41.54 55.64c21.02 0 32.245-20.958 32.245-37.009 0-14.55-5.511-7.076-24.252-5.5-1.933.163-34.839-10.55-34.839 5.5s5.827 37.01 26.846 37.01"
                        fill="#076f00"
                    />
                    <path
                        d="M43.013 48.4c15.747 0 25.707-12.283 25.707-24.97s-9.96-7.33-25.707-7.33-22.316-5.356-22.316 7.33S27.265 48.4 43.013 48.4"
                        fill="#a2ffbd"
                    />
                    <ellipse cx={47.523} cy={29.461} rx={6.003} ry={5.942} fill="#550072" />
                </g>
                <path
                    d="M50.338 28.714c20.764 1.023 32.95-7.89 32.95-7.89S70.985 42.247 47.175 40.601 9.002 25.912 9.002 25.912s20.548 1.778 41.336 2.802"
                    fill="#3d2065"
                />
            </g>
        </svg>
    );
};

JukeIcon.displayName = JUKE_ICON_NAME;
