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
    paddingTop: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  mainButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  comingSoonLabel: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

