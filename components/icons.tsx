
import React from 'react';

export const SearchIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 mr-1 inline"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const PlusIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

export const MinusIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

export const FullscreenIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 mr-1 inline"}) => (
 <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5 5" />
  </svg>
);

export const ExitFullscreenIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 mr-1 inline"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 4H4v6m0 0l6 6m-6-6h6m6 10h6v-6m0 0l-6-6m6 6h-6" />
  </svg>
);


export const CenterIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 mr-1 inline"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75L12 15m0 0l2.25-2.25M12 15V7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const CloseIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export const FitViewIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 sm:mr-1 inline"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11 1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11-5v4m0 0h-4m4 0l-5 5" transform="scale(0.8) translate(2.5,2.5)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4"/>
  </svg>
);

export const EditModeIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 sm:mr-1 inline"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

export const ReadOnlyModeIcon: React.FC<{className?: string}> = ({className = "h-4 w-4 sm:mr-1 inline"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.293.982-.725 1.888-1.259 2.713m-11.025-.13A6.002 6.002 0 0012 17c2.252 0 4.29-.984 5.728-2.557M15 12a3 3 0 01-3 3m0 0v2.754" />
  </svg>
);