import { SentenceType } from '../screens/SentenceTypeScreen';

/**
 * Definición de tipos para los parámetros de navegación
 * Esto mejora el autocompletado y la seguridad de tipos en TypeScript
 */
export type RootStackParamList = {
  Welcome: undefined;
  SentenceType: undefined;
  TopicSelection: {
    sentenceType: SentenceType;
    selectedColor?: string;
  };
  PCS: {
    sentenceType?: SentenceType;
    topic?: string;
  };
  PhraseSelection: {
    phrases: string[];
    words: string[];
    sentenceType: SentenceType;
    topic: string;
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

