import {cn} from '@enonic/ui';
import type {LucideIcon, LucideProps} from 'lucide-react';
import {forwardRef, useId} from 'react';

const JUKE_ICON_NAME = 'JukeIcon';

export const JukeIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
    ({size = 24, strokeWidth = 1, className, ...props}, ref) => {
        const id = useId();
        const buttonFace = `${id}-buttonFace`;
        const outerRim = `${id}-outerRim`;
        const rimGlow = `${id}-rimGlow`;
        const greenRing = `${id}-greenRing`;
        const eyeWhite = `${id}-eyeWhite`;
        const lidFace = `${id}-lidFace`;
        const lidEdge = `${id}-lidEdge`;
        const pupil = `${id}-pupil`;
        const pupilRim = `${id}-pupilRim`;
        const softDrop = `${id}-softDrop`;
        const eyeShadow = `${id}-eyeShadow`;
        const lidShadow = `${id}-lidShadow`;
        const innerSoft = `${id}-innerSoft`;
        const buttonClip = `${id}-buttonClip`;
        const visibleEyeClip = `${id}-visibleEyeClip`;

        return (
            <svg
                ref={ref}
                data-component={JUKE_ICON_NAME}
                xmlns='http://www.w3.org/2000/svg'
                width={size}
                height={size}
                viewBox='0 0 1254 1254'
                fill='none'
                aria-hidden='true'
                className={cn('lucide lucide-juke', className)}
                {...props}
            >
                <defs>
                    <radialGradient id={buttonFace} cx='34%' cy='28%' r='78%'>
                        <stop offset={0} stopColor='#d867e5' />
                        <stop offset={0.32} stopColor='#a536d2' />
                        <stop offset={0.68} stopColor='#9438cc' />
                        <stop offset={1} stopColor='#6f1eaa' />
                    </radialGradient>
                    <linearGradient id={outerRim} x1={199} y1={88} x2={1065} y2={1185} gradientUnits='userSpaceOnUse'>
                        <stop offset={0} stopColor='#531187' />
                        <stop offset={0.38} stopColor='#30095f' />
                        <stop offset={0.72} stopColor='#6d1caf' />
                        <stop offset={1} stopColor='#21043e' />
                    </linearGradient>
                    <linearGradient id={rimGlow} x1={147} y1={141} x2={988} y2={1105} gradientUnits='userSpaceOnUse'>
                        <stop offset={0} stopColor='#ffb6ff' stopOpacity={0.95} />
                        <stop offset={0.22} stopColor='#e480f2' stopOpacity={0.4} />
                        <stop offset={0.58} stopColor='#6511a3' stopOpacity={0.22} />
                        <stop offset={1} stopColor='#1b0532' stopOpacity={0.25} />
                    </linearGradient>
                    <radialGradient id={greenRing} cx='41%' cy='25%' r='76%'>
                        <stop offset={0} stopColor='#9cf05a' />
                        <stop offset={0.26} stopColor='#63cf32' />
                        <stop offset={0.58} stopColor='#0e911e' />
                        <stop offset={0.86} stopColor='#056711' />
                        <stop offset={1} stopColor='#013a08' />
                    </radialGradient>
                    <radialGradient id={eyeWhite} cx='32%' cy='22%' r='75%'>
                        <stop offset={0} stopColor='#ffffff' />
                        <stop offset={0.28} stopColor='#e8ffd9' />
                        <stop offset={0.64} stopColor='#baefb5' />
                        <stop offset={1} stopColor='#7ec97d' />
                    </radialGradient>
                    <radialGradient id={lidFace} cx='48%' cy='20%' r='92%'>
                        <stop offset={0} stopColor='#b852e6' />
                        <stop offset={0.3} stopColor='#7926b4' />
                        <stop offset={0.66} stopColor='#5a1a87' />
                        <stop offset={1} stopColor='#320541' />
                    </radialGradient>
                    <linearGradient id={lidEdge} x1={327} y1={381} x2={997} y2={352} gradientUnits='userSpaceOnUse'>
                        <stop offset={0} stopColor='#7a28bf' />
                        <stop offset={0.33} stopColor='#e08aff' />
                        <stop offset={0.66} stopColor='#8e33d8' />
                        <stop offset={1} stopColor='#260130' />
                    </linearGradient>
                    <radialGradient id={pupil} cx='35%' cy='24%' r='84%'>
                        <stop offset={0} stopColor='#df8aff' />
                        <stop offset={0.18} stopColor='#8f31c7' />
                        <stop offset={0.62} stopColor='#4c127e' />
                        <stop offset={1} stopColor='#13001f' />
                    </radialGradient>
                    <linearGradient id={pupilRim} x1={712} y1={645} x2={850} y2={796} gradientUnits='userSpaceOnUse'>
                        <stop offset={0} stopColor='#902bc8' />
                        <stop offset={1} stopColor='#05000c' />
                    </linearGradient>
                    <filter id={softDrop} x='-20%' y='-20%' width='140%' height='140%'>
                        <feDropShadow dx={0} dy={18} stdDeviation={16} floodColor='#08000f' floodOpacity={0.58} />
                    </filter>
                    <filter id={eyeShadow} x='-25%' y='-25%' width='150%' height='150%'>
                        <feDropShadow dx={0} dy={18} stdDeviation={14} floodColor='#040006' floodOpacity={0.55} />
                    </filter>
                    <filter id={lidShadow} x='-20%' y='-30%' width='140%' height='160%'>
                        <feDropShadow dx={0} dy={15} stdDeviation={12} floodColor='#050008' floodOpacity={0.65} />
                    </filter>
                    <filter id={innerSoft} x='-20%' y='-20%' width='140%' height='140%'>
                        <feGaussianBlur in='SourceAlpha' stdDeviation={8} result='blur' />
                        <feOffset dy={10} result='off' />
                        <feComposite in='off' in2='SourceAlpha' operator='arithmetic' k2={-1} k3={1} result='inner' />
                        <feColorMatrix
                            in='inner'
                            type='matrix'
                            values='0 0 0 0 0.03 0 0 0 0 0 0 0 0 0 0.07 0 0 0 0.4 0'
                            result='innerDark'
                        />
                        <feComposite in='SourceGraphic' in2='innerDark' operator='over' />
                    </filter>
                    <clipPath id={buttonClip}>
                        <circle cx={627} cy={627} r={583} />
                    </clipPath>
                    <clipPath id={visibleEyeClip}>
                        <path d='M0 1254V410c92-12 188-15 283-24 112 137 253 197 395 177 129-18 247-101 333-220 83-5 164-4 243 3v908H0z' />
                    </clipPath>
                </defs>
                <circle cx={627} cy={627} r={620} fill='currentColor' stroke='currentColor' />
                <g filter={`url(#${softDrop})`}>
                    <circle cx={627} cy={627} r={606} fill={`url(#${outerRim})`} />
                    <circle cx={627} cy={627} r={583} fill={`url(#${buttonFace})`} />
                    <circle
                        cx={627}
                        cy={627}
                        r={569}
                        fill='none'
                        stroke={`url(#${rimGlow})`}
                        strokeWidth={18}
                        opacity={0.72}
                    />
                </g>
                <g clipPath={`url(#${buttonClip})`}>
                    <path
                        d='M77 604c-4-191 88-359 237-457C423 74 548 47 681 57c193 15 353 119 451 274'
                        fill='none'
                        stroke='#ffc2ff'
                        strokeWidth={9}
                        strokeLinecap='round'
                        opacity={0.82}
                    />
                    <path
                        d='M74 605C69 419 157 254 303 156 414 82 540 52 675 61c188 13 350 108 453 260'
                        fill='none'
                        stroke='#ffffff'
                        strokeWidth={3}
                        strokeLinecap='round'
                        opacity={0.34}
                    />
                    <ellipse
                        cx={433}
                        cy={321}
                        rx={397}
                        ry={310}
                        fill='#ffffff'
                        opacity={0.055}
                        transform='rotate(-18 433 321)'
                    />
                    <ellipse
                        cx={872}
                        cy={945}
                        rx={356}
                        ry={233}
                        fill='#19002f'
                        opacity={0.17}
                        transform='rotate(-17 872 945)'
                    />
                </g>
                <g filter={`url(#${eyeShadow})`} clipPath={`url(#${visibleEyeClip})`}>
                    <circle
                        cx={628}
                        cy={716}
                        r={357}
                        fill='#032c05'
                        opacity={0.72}
                        transform='translate(0 13)'
                    />
                    <circle cx={628} cy={707} r={348} fill={`url(#${greenRing})`} />
                    <circle
                        cx={628}
                        cy={707}
                        r={323}
                        fill='none'
                        stroke='#93fc5f'
                        strokeWidth={11}
                        opacity={0.74}
                    />
                    <circle
                        cx={628}
                        cy={707}
                        r={305}
                        fill='none'
                        stroke='#00280a'
                        strokeWidth={23}
                        opacity={0.72}
                    />
                    <circle
                        cx={628}
                        cy={707}
                        r={265}
                        fill={`url(#${eyeWhite})`}
                        filter={`url(#${innerSoft})`}
                    />
                    <path
                        d='M387 602c47-99 140-160 252-160 118 0 216 71 258 177'
                        fill='none'
                        stroke='#ffffff'
                        strokeWidth={9}
                        strokeLinecap='round'
                        opacity={0.72}
                    />
                    <path
                        d='M375 624c44-127 139-202 266-202 124 0 224 73 270 191'
                        fill='none'
                        stroke='#b9ffb7'
                        strokeWidth={17}
                        strokeLinecap='round'
                        opacity={0.26}
                    />
                    <path
                        d='M381 824c66 92 151 135 257 135 91 0 174-34 238-103'
                        fill='none'
                        stroke='#ffffff'
                        strokeWidth={5}
                        strokeLinecap='round'
                        opacity={0.22}
                    />
                </g>
                <g filter={`url(#${lidShadow})`}>
                    <path
                        d='M284 379C435 418 551 442 681 440c136-2 256-44 328-124 9-10 23-3 20 10-2 8-8 17-17 29-87 121-207 203-336 222-143 20-282-42-397-180-9-11-6-22 5-18z'
                        fill='#160019'
                        opacity={0.44}
                        transform='translate(0 12)'
                    />
                    <path
                        d='M284 379C438 418 554 442 684 440c136-2 255-44 325-124 9-10 23-3 20 10-2 8-8 17-17 29-87 121-207 203-336 222-143 20-282-42-397-180-9-11-6-22 5-18z'
                        fill={`url(#${lidFace})`}
                        stroke='#170026'
                        strokeWidth={5}
                        strokeLinejoin='round'
                    />
                    <path
                        d='M291 385c154 39 266 60 391 58 133-2 255-44 323-122'
                        fill='none'
                        stroke={`url(#${lidEdge})`}
                        strokeWidth={8}
                        strokeLinecap='round'
                        opacity={0.9}
                    />
                    <path
                        d='M308 392c141 36 251 55 374 53 116-2 224-34 293-92'
                        fill='none'
                        stroke='#e893ff'
                        strokeWidth={4}
                        strokeLinecap='round'
                        opacity={0.44}
                    />
                    <path
                        d='M383 441c81 78 173 116 279 116 102 0 196-40 281-119-83 87-178 135-283 139-114 5-211-42-277-136z'
                        fill='#110018'
                        opacity={0.27}
                    />
                    <ellipse
                        cx={568}
                        cy={478}
                        rx={285}
                        ry={43}
                        fill='#ffffff'
                        opacity={0.055}
                        transform='rotate(3 568 478)'
                    />
                </g>
                <g filter={`url(#${eyeShadow})`} transform='translate(-80 0)'>
                    <circle cx={776} cy={708} r={83} fill={`url(#${pupilRim})`} />
                    <circle cx={776} cy={708} r={70} fill={`url(#${pupil})`} />
                    <ellipse
                        cx={743}
                        cy={666}
                        rx={32}
                        ry={47}
                        fill='#ffffff'
                        opacity={0.24}
                        transform='rotate(31 743 666)'
                    />
                    <path
                        d='M719 738c18 40 55 55 80 38'
                        fill='none'
                        stroke='#060008'
                        strokeWidth={8}
                        strokeLinecap='round'
                        opacity={0.56}
                    />
                </g>
                <g opacity={0.28}>
                    <path
                        d='M814 492c87-26 158-73 206-151'
                        fill='none'
                        stroke='#1d0028'
                        strokeWidth={18}
                        strokeLinecap='round'
                        opacity={0.35}
                    />
                    <path
                        d='M291 685c9-95 39-174 91-232'
                        fill='none'
                        stroke='#ffffff'
                        strokeWidth={10}
                        strokeLinecap='round'
                        opacity={0.34}
                    />
                    <path
                        d='M302 685c9-88 37-161 85-215'
                        fill='none'
                        stroke='#a7ff86'
                        strokeWidth={5}
                        strokeLinecap='round'
                        opacity={0.58}
                    />
                </g>
            </svg>
        );
    },
);
JukeIcon.displayName = JUKE_ICON_NAME;
