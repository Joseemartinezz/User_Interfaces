import { StyleSheet } from 'react-native';

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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  symbolGrid: {
    maxHeight: 400,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10,
  },
  symbolButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    marginRight: 10,
    marginBottom: 10,
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
});

