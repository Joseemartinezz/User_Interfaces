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
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  themeSelector: {
    marginTop: 16,
    gap: 12,
  },
  themeOption: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  themePreview: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  infoBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Nuevos estilos
  optionsList: {
    marginTop: 8,
    gap: 10,
  },
  optionItem: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
