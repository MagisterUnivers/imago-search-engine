export type SortOrder = "asc" | "desc" | "none";

export type SearchParams = {
  q?: string;
  credit?: string;
  from?: string;
  to?: string;
  r?: string;
  sort?: SortOrder;
  page?: string;
  pageSize?: string;
};

export interface ProcessedMediaItem {
  id: number;
  bildnummer: string;
  fotografen: string; // original casing — for display
  fotografenNorm: string; // lowercase — for filtering/search
  suchtext: string; // original — for display / snippet highlighting
  suchtextNorm: string; // lowercase — for search
  tokens: string[]; // normalized keywords extracted from suchtext
  restrictions: string[]; // e.g. ["PUBLICATIONxINxGERxSUIxAUTxONLY"]
  archiveRef: string | null; // e.g. "UnitedArchives00421716"
  datum: string; // ISO "YYYY-MM-DD" — for sorting and date range filter
  datumRaw: string; // "DD.MM.YYYY" — for display
  aspectRatio: number; // breite / hoehe — useful for grid layout
}
