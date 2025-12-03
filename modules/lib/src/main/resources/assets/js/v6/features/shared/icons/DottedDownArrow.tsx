import {type LucideProps} from 'lucide-react';
import type {ReactElement} from 'react';

export const DottedDownArrow = ({width = 18, height = 59, ...props}: Omit<LucideProps, 'size'>): ReactElement => (
    <svg width={width} height={height} viewBox="0 0 18 59" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect x="7.99219" width="2" height="3" rx="1" fill="currentColor" />
        <rect x="7.99219" y="5" width="2" height="6" rx="1" fill="currentColor" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.69357 13.0318C8.43438 13.1164 8.20072 13.3299 8.07693 13.5951L7.9985 13.7631L7.99131 43.6625L7.98411 55.5619L4.77131 52.3539C1.13794 48.7258 1.46109 49.0111 0.984502 49.0111C0.74527 49.0111 0.702037 49.0194 0.554953 49.094C0.344309 49.2007 0.138622 49.4247 0.0611175 49.6319C0.000245526 49.7946 -0.0187665 50.0816 0.0205735 50.2445C0.0863175 50.5168 0.0602503 50.4895 4.28416 54.715C8.93611 59.3687 8.50592 58.9791 8.9925 58.9791C9.47186 58.9791 9.05315 59.3568 13.5522 54.8657C15.7444 52.6775 17.6109 50.8034 17.7001 50.701C17.904 50.467 17.9836 50.2676 17.9836 49.9911C17.9836 49.607 17.7749 49.2687 17.43 49.094C17.283 49.0194 17.2397 49.0111 17.0005 49.0111C16.5239 49.0111 16.8471 48.7258 13.2137 52.3539L10.0009 55.5619L9.9937 43.6625L9.9865 13.7631L9.90603 13.5889C9.81083 13.3828 9.58795 13.1583 9.39153 13.0706C9.22507 12.9963 8.8637 12.9762 8.69357 13.0318Z"
            fill="currentColor"
        />
    </svg>
);

export const DottedDownArrowIcon = DottedDownArrow;
