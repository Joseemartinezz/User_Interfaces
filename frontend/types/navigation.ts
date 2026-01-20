/**
 * Type definitions for navigation parameters
 * This improves autocomplete and type safety in TypeScript
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

// Export types for use throughout the application
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
