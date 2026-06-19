/** Standard height for text inputs (40px) — matches cbp-frontend. */
export const FIELD_HEIGHT = "h-10";

/** Admin accent: indigo (customer app uses teal). */
export const fieldControlBase =
  `border border-slate-200 rounded-lg px-3 ${FIELD_HEIGHT} w-full text-sm outline-none transition-all ` +
  `focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ` +
  `placeholder:text-slate-400 text-slate-900 bg-white ` +
  `disabled:bg-slate-50 disabled:cursor-not-allowed`;

export const fieldControlError =
  "border-red-400 focus:ring-2 focus:ring-red-400/20 focus:border-red-400";

export const adminButtonPrimary =
  "cursor-pointer w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2";

export const adminLink =
  "text-indigo-600 hover:text-indigo-700 font-medium hover:underline";
