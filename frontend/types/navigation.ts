/**
 * Definición de tipos para los parámetros de navegación
 * Esto mejora el autocompletado y la seguridad de tipos en TypeScript
 */
export type RootStackParamList = {
  Categories: {
    selectedColor?: string;
  };
  CategoryDetail: {
    categoryId: string;
    categoryName: string;
    categoryEmoji: string;
    isCustom: boolean;
    selectedColor?: string;
  };
  PCS: {
    topic?: string;
  };
  PhraseSelection: {
    phrases: string[];
    words: string[];
    topic?: string;
  };
  Settings: undefined;
  ParentMenu: undefined;
  Profile: undefined;
};

// Exportar tipos para uso en toda la aplicación
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

