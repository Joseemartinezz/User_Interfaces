# API Setup Guide

This guide covers the setup and configuration of AI APIs used in the AAC app.

## Google Gemini API

### Getting API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

### Configuration

**Backend (`backend/.env`):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Frontend (`.env`):**
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### Available Models

- `gemini-1.5-flash`: Fast and cost-effective (default)
- `gemini-1.5-pro`: More powerful for complex tasks

### Endpoints

- `POST /api/generate-phrases`: Generate natural phrases from words
- `POST /api/generate-more-phrases`: Generate additional phrases

### Usage

The backend automatically tries `gemini-1.5-flash` first, then falls back to `gemini-1.5-pro` if needed.

## OpenAI API

### Getting API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key (starts with `sk-`)

### Configuration

**Backend (`backend/.env`):**
```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**Note:** OpenAI API key is optional. The app works with just Gemini.

### Available Models

- `gpt-4o-mini`: Cost-effective and fast (default)
- `gpt-4o`: More powerful but expensive

### Endpoints

- `POST /api/openai/generate-phrases`: Generate phrases with OpenAI
- `POST /api/openai/generate-more-phrases`: Generate more phrases
- `POST /api/openai/text-to-pcs`: Convert text to PCS symbols
- `POST /api/openai/pcs-to-text`: Convert PCS symbols to text

### Testing Prompts in OpenAI Playground

You can test and refine prompts in [OpenAI Playground](https://platform.openai.com/playground) before implementing them.

#### Example: Generate Phrases

**System Message:**
```
You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.
```

**User Message:**
```
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
I, want, play, football

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
```

**Recommended Settings:**
- Model: `gpt-4o-mini` (cost-effective) or `gpt-4o` (more powerful)
- Temperature: `0.7`
- Max tokens: `200`

#### Example: Text to PCS

**System Message:**
```
You are a helpful assistant that converts natural language text into PCS symbol sequences for AAC devices.
```

**User Message:**
```
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
A caregiver wrote this text: "I want to play football"

Your task is to break down this text into individual words that can be represented by PCS (Picture Communication Symbols).

Return ONLY a comma-separated list of the key words (nouns, verbs, important adjectives/adverbs).
Do not include articles (a, an, the), prepositions, or conjunctions unless they are essential.
Keep the words in their base form (e.g., "play" not "playing", "want" not "wanted").

Example:
Input: "I want to play football"
Output: I, want, play, football

Input: "Do you like pizza?"
Output: you, like, pizza

Now process this text: "I want to play football"
```

**Recommended Settings:**
- Model: `gpt-4o-mini`
- Temperature: `0.3` (more deterministic)
- Max tokens: `100`

## Verifying Configuration

After setting up API keys, restart the backend server:

```bash
npm run server
```

The server will display which API keys are configured:
```
📡 API Keys configuradas:
   - Gemini: ✅ Sí
   - OpenAI: ✅ Sí (or ❌ No)
```

## Troubleshooting

### Error: "API Key not configured"
- Verify the key is in the correct `.env` file
- Check for typos in the key
- Restart the server after adding the key

### Error: "Rate limit exceeded"
- Check your API usage in the provider dashboard
- Consider using a more cost-effective model (gemini-1.5-flash or gpt-4o-mini)
- Implement request throttling if needed

### Error: "Invalid API key"
- Verify the key format (Gemini keys don't have a prefix, OpenAI keys start with `sk-`)
- Check if the key has been revoked
- Generate a new key if necessary

## Cost Considerations

- **Gemini 1.5 Flash**: Most cost-effective option
- **Gemini 1.5 Pro**: More expensive but more capable
- **GPT-4o-mini**: Cost-effective OpenAI option
- **GPT-4o**: Most expensive but most capable

**Recommendation:** Use Gemini 1.5 Flash for development and general use. Use GPT-4o only when you need the highest quality.

## Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Rotate keys regularly** - Especially if exposed
3. **Use environment variables** - Never hardcode keys
4. **Monitor usage** - Set up alerts for unusual activity
5. **Use separate keys** - Different keys for development and production

## Azure OpenAI API

### Getting API Key and Endpoint

1. Go to [Azure Portal](https://portal.azure.com)
2. Create or navigate to your Azure OpenAI resource
3. Go to "Keys and Endpoint" section
4. Copy the endpoint URL and one of the API keys
5. Note the deployment name (e.g., `gpt-4o-mini`)

### Configuration

**Backend (`backend/.env`):**
```env
AZURE_OPENAI_URL=https://your-resource-name.openai.azure.com
AZURE_OPENAI_KEY=your_azure_api_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2023-03-15-preview
```

**Note:** Azure OpenAI is optional. The app works with just Gemini, but Azure OpenAI provides an alternative option.

### Available Models

- `gpt-4o-mini`: Cost-effective (default)
- `gpt-4o`: More powerful but expensive
- Any other model deployed in your Azure OpenAI resource

### Endpoints

- `POST /api/azure/generate-phrases`: Generate phrases with Azure OpenAI
- `POST /api/azure/generate-more-phrases`: Generate more phrases

### Usage

The backend uses Azure OpenAI API directly through the Azure endpoint. Make sure your deployment name matches the model you want to use.

## Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Playground](https://platform.openai.com/playground)
- [OpenAI Pricing](https://openai.com/pricing)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

