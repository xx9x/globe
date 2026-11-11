/** Shared class recipes so buttons and fields look identical everywhere. */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-fg px-4 font-semibold text-bg " +
  "transition-[background-color,transform,box-shadow] duration-200 ease-out " +
  "hover:bg-[#e6e6e6] hover:shadow-[0_6px_24px_-6px_rgba(255,255,255,0.35)] active:scale-[0.985] " +
  "disabled:cursor-not-allowed disabled:bg-[#9a9a9a] disabled:shadow-none disabled:active:scale-100";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-input px-4 font-medium text-fg " +
  "transition-[background-color,border-color,transform] duration-200 ease-out " +
  "hover:border-[#444] hover:bg-hover active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-3 font-medium text-muted " +
  "transition-colors duration-200 hover:bg-hover hover:text-fg";

export const badge =
  "inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium " +
  "uppercase tracking-[0.1em] text-muted";
