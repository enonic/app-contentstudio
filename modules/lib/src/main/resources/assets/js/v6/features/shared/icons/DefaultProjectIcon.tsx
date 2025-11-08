import type {ComponentPropsWithoutRef, ReactElement} from 'react';

export const DefaultProjectIcon = (props: ComponentPropsWithoutRef<'svg'>): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="-1 -1 36 36"
        strokeWidth="1"
        stroke="currentColor"
        aria-hidden="true"
        focusable="false"
        {...props}
    >
        <path d="M5.18674 14.1949C6.28684 7.95978 11.2728 3.21868 17.082 3.21868C22.8894 3.21868 27.8718 7.95978 28.972 14.1949H32.164C31.0231 6.26702 24.7614 0 17.082 0C9.46116 0 3.14801 6.26702 2 14.1949H5.18674Z"/>
        <path d="M28.979 19.8123C27.9251 26.0367 22.9249 30.7459 17.0838 30.7459C11.2391 30.7459 6.23539 26.0367 5.18496 19.8123H2C3.09477 27.7224 9.42744 34 17.0838 34C24.7951 34 31.0799 27.7224 32.164 19.8123H28.979Z"/>
    </svg>
);

DefaultProjectIcon.displayName = 'DefaultProjectIcon';
