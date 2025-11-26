import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  topicsContainer: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  topicButton: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
  },
  topicEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});

