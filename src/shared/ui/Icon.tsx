const paths = {
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  play: 'm8 4 13 8-13 8V4Z',
  check: 'm5 12 4 4L20 5',
  terminal: 'm4 5 6 6-6 6m9 0h7',
  file: 'M14 2H5v20h14V7l-5-5Zm0 0v5h5M8 12h8m-8 4h6',
  reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
  help: 'M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01',
  close: 'm6 6 12 12M6 18 18 6',
  clock: 'M12 7v5l3 2',
  copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
  flask: 'M9 3h6m-5 0v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 15h10',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  bolt: 'm13 2-9 12h7l-1 8L21 9h-8l1-7',
};
export function Icon({ name, className = '' }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {['help', 'clock'].includes(name) && <circle cx="12" cy="12" r="9" />}
      <path d={paths[name]} />
    </svg>
  );
}
