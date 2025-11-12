import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface TextInputProps {
  onTextSubmit: (text: string) => void;
  placeholder?: string;
}

export const CaregiverTextInput: React.FC<TextInputProps> = ({
  onTextSubmit,
  placeholder = 'Escribe aquí...',
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <RNTextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={[styles.button, !text.trim() && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

