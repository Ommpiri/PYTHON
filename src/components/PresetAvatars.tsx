import React from "react";

export const PRESET_AVATARS = [
  { id: "terminal", label: "Terminal", Component: PresetTerminal },
  { id: "snake", label: "Python", Component: PresetSnake },
  { id: "brackets", label: "Code", Component: PresetBrackets },
  { id: "hash", label: "Hash", Component: PresetHash },
  { id: "lambda", label: "Lambda", Component: PresetLambda },
  { id: "bug", label: "Bug", Component: PresetBug },
  { id: "rocket", label: "Rocket", Component: PresetRocket },
  { id: "circuit", label: "Circuit", Component: PresetCircuit },
];

function PresetTerminal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M25 35L40 50L25 65" stroke="oklch(0.76 0.14 75)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="50" y="57" width="25" height="8" fill="oklch(0.66 0.08 175)" />
    </svg>
  );
}

function PresetSnake(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M45 25H35C29.4772 25 25 29.4772 25 35V45C25 50.5228 29.4772 55 35 55H50V65C50 70.5228 45.5228 75 40 75H30" stroke="oklch(0.76 0.14 75)" strokeWidth="8" strokeLinecap="round" />
      <path d="M55 75H65C70.5228 75 75 70.5228 75 65V55C75 49.4772 70.5228 45 65 45H50V35C50 29.4772 54.4772 25 60 25H70" stroke="oklch(0.66 0.08 175)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="35" cy="35" r="4" fill="oklch(0.19 0.02 240)" />
      <circle cx="65" cy="65" r="4" fill="oklch(0.19 0.02 240)" />
    </svg>
  );
}

function PresetBrackets(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M35 25L15 50L35 75" stroke="oklch(0.76 0.14 75)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M65 25L85 50L65 75" stroke="oklch(0.66 0.08 175)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 25L45 75" stroke="oklch(0.72 0.17 25)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function PresetHash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M40 20L30 80" stroke="oklch(0.76 0.14 75)" strokeWidth="8" strokeLinecap="round" />
      <path d="M70 20L60 80" stroke="oklch(0.66 0.08 175)" strokeWidth="8" strokeLinecap="round" />
      <path d="M20 40H80" stroke="oklch(0.72 0.17 25)" strokeWidth="8" strokeLinecap="round" />
      <path d="M20 60H80" stroke="oklch(0.76 0.14 75)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function PresetLambda(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M50 25L25 75" stroke="oklch(0.76 0.14 75)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 40L70 75" stroke="oklch(0.66 0.08 175)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PresetBug(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <rect x="35" y="30" width="30" height="45" rx="15" fill="oklch(0.72 0.17 25)" />
      <path d="M35 40H20" stroke="oklch(0.66 0.08 175)" strokeWidth="6" strokeLinecap="round" />
      <path d="M35 55H20" stroke="oklch(0.66 0.08 175)" strokeWidth="6" strokeLinecap="round" />
      <path d="M65 40H80" stroke="oklch(0.66 0.08 175)" strokeWidth="6" strokeLinecap="round" />
      <path d="M65 55H80" stroke="oklch(0.66 0.08 175)" strokeWidth="6" strokeLinecap="round" />
      <path d="M42 20V30" stroke="oklch(0.76 0.14 75)" strokeWidth="6" strokeLinecap="round" />
      <path d="M58 20V30" stroke="oklch(0.76 0.14 75)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function PresetRocket(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M50 20C50 20 70 35 70 55C70 65 60 75 50 75C40 75 30 65 30 55C30 35 50 20 50 20Z" fill="oklch(0.76 0.14 75)" />
      <circle cx="50" cy="50" r="8" fill="oklch(0.19 0.02 240)" />
      <path d="M35 65L20 80" stroke="oklch(0.66 0.08 175)" strokeWidth="8" strokeLinecap="round" />
      <path d="M65 65L80 80" stroke="oklch(0.66 0.08 175)" strokeWidth="8" strokeLinecap="round" />
      <path d="M50 75V85" stroke="oklch(0.72 0.17 25)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function PresetCircuit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="100" height="100" rx="20" fill="oklch(0.19 0.02 240)" />
      <path d="M20 50H40L50 35H80" stroke="oklch(0.66 0.08 175)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 80V60L50 50H70" stroke="oklch(0.76 0.14 75)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="80" cy="35" r="5" fill="oklch(0.72 0.17 25)" />
      <circle cx="70" cy="50" r="5" fill="oklch(0.72 0.17 25)" />
      <circle cx="20" cy="50" r="5" fill="oklch(0.66 0.08 175)" />
      <circle cx="35" cy="80" r="5" fill="oklch(0.76 0.14 75)" />
    </svg>
  );
}
