import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  phrasesContainer: {
    flex: 1,
    padding: 12,
  },
  phrasesContent: {
    paddingBottom: 20,
  },
  phraseButton: {
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  phraseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phraseIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  phraseText: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  actionButtons: {
    padding: 12,
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
  homeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

