import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...rest }: P) {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <Svg {...p}><path d='M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' /></Svg>
);
export const IconStore = (p: P) => (
  <Svg {...p}><path d='M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M10 20v-5h4v5' /></Svg>
);
export const IconBag = (p: P) => (
  <Svg {...p}><path d='M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2' /></Svg>
);
export const IconUser = (p: P) => (
  <Svg {...p}><circle cx='12' cy='8' r='4' /><path d='M4 21c0-4 3.6-7 8-7s8 3 8 7' /></Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx='11' cy='11' r='7' /><path d='M20 20l-4-4' /></Svg>
);
export const IconMenu = (p: P) => (
  <Svg {...p}><path d='M4 7h16M4 12h16M4 17h16' /></Svg>
);
export const IconHeart = (p: P) => (
  <Svg {...p}><path d='M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z' /></Svg>
);
export const IconTruck = (p: P) => (
  <Svg {...p}><path d='M3 6h11v10H3zM14 10h4l3 3v3h-7' /><circle cx='7' cy='18' r='1.6' /><circle cx='17' cy='18' r='1.6' /></Svg>
);
export const IconShield = (p: P) => (
  <Svg {...p}><path d='M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' /><path d='M8.5 12l2.5 2.5L16 9.5' /></Svg>
);
export const IconChat = (p: P) => (
  <Svg {...p}><path d='M4 5h16v11H9l-5 4z' /></Svg>
);
export const IconReturn = (p: P) => (
  <Svg {...p}><path d='M4 12a8 8 0 1 0 3-6.2M4 4v4h4' /></Svg>
);
