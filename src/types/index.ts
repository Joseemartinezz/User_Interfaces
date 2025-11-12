export interface Symbol {
  id: number;
  word: string;
  imageUrl: string;
}

export interface SelectedSymbol {
  symbol: Symbol;
  timestamp: number;
}

