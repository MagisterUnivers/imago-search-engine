export const SCORE = {
  BILDNUMMER_EXACT: 100, // e.g. query "0059987730"
  FOTOGRAFEN_TOKEN: 8, // e.g. query "teutopress"
  TOKEN_EXACT: 4, // e.g. query "manchester" → matches tokens[]
  TOKEN_PREFIX: 2, // e.g. query "manch" → prefix of a token
} as const;
