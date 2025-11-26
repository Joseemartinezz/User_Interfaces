import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  languageButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  languageButtonTextActive: {
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pictogramsScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  pictogramCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  pictogramImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  pictogramId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pictogramKeyword: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  pictogramDownloads: {
    fontSize: 12,
    color: '#666',
  },
  phraseResultContainer: {
    marginTop: 16,
  },
  phraseResultScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  phraseItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
    marginRight: 8,
  },
  phraseItemImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  phraseItemNoImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phraseItemNoImageText: {
    fontSize: 32,
  },
  phraseItemWord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

