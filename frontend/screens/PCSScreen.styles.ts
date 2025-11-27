import { StyleSheet, Dimensions } from 'react-native';

export const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  outputArea: {
    padding: 16,
    margin: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedWordsWrapper: {
    minHeight: 90, // CRÍTICO: Altura mínima fija para evitar layout shift
    justifyContent: 'center',
  },
  selectedWordsScrollView: {
    maxHeight: 90,
  },
  selectedWordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingVertical: 4,
  },
  selectedWordItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    marginRight: 12,
  },
  selectedWordImage: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  selectedWordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptySelectionText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 12,
    flex: 1,
    minHeight: 0, // Importante para que el ScrollView funcione dentro de flex
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryGridContainer: {
    width: Dimensions.get('window').width - 24, // Ancho de pantalla menos márgenes del section (12*2)
    paddingHorizontal: 8,
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700',
  },
  categoryScrollView: {
    flex: 1,
    minHeight: 0, // Importante para que el ScrollView funcione dentro de flex
  },
  grid4x4Container: {
    paddingBottom: 10,
  },
  grid4x4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  symbolButton: {
    width: '23%', // 4 columnas con espacio entre ellas (100% / 4 - espacio)
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    marginBottom: 10,
  },
  emptyCategoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCategoryText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  symbolImage: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 12,
    paddingBottom: 35,
    gap: 10,
  },
  generateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clearButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 30,
    color: '#999',
  },
  errorSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  loadingMoreContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

