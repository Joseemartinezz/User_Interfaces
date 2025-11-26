# Environment Variables Configuration

This guide explains all environment variables used in the AAC app and how to configure them.

## Backend Environment Variables

Location: `backend/.env`

### Required Variables

#### GEMINI_API_KEY
Google Gemini API key for natural language generation.

**How to get:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in and create a new API key
3. Copy the key

**Example:**
```env
GEMINI_API_KEY=AIzaSyExample123456789
```

### Optional Variables

#### OPENAI_API_KEY
OpenAI API key for alternative AI features (text-to-PCS, PCS-to-text).

**How to get:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in and create a new API key
3. Copy the key (starts with `sk-`)

**Example:**
```env
OPENAI_API_KEY=sk-example123456789
```

**Note:** This is optional. The app works with just Gemini, but OpenAI provides additional features.

#### AZURE_OPENAI_URL
Azure OpenAI endpoint URL.

**How to get:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Go to "Keys and Endpoint" section
4. Copy the endpoint URL

**Example:**
```env
AZURE_OPENAI_URL=https://your-resource-name.openai.azure.com
```

#### AZURE_OPENAI_KEY
Azure OpenAI API key.

**How to get:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Go to "Keys and Endpoint" section
4. Copy one of the API keys

**Example:**
```env
AZURE_OPENAI_KEY=your_azure_api_key_here
```

#### AZURE_OPENAI_DEPLOYMENT
Azure OpenAI deployment name. Defaults to `gpt-4o-mini` if not specified.

**Example:**
```env
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

**Note:** Azure OpenAI is optional. The app works with just Gemini, but Azure OpenAI provides an alternative option.

#### PORT
Server port number. Defaults to 3000 if not specified.

**Example:**
```env
PORT=3000
```

**Note:** If port 3000 is already in use, change to another port (e.g., 3001).

### Complete Backend .env Example

```env
# Required
GEMINI_API_KEY=AIzaSyExample123456789

# Optional
OPENAI_API_KEY=sk-example123456789
AZURE_OPENAI_URL=https://your-resource-name.openai.azure.com
AZURE_OPENAI_KEY=your_azure_api_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
PORT=3000
```

## Frontend Environment Variables

Location: `.env` (in project root) or `frontend/.env`

### Required Variables

#### EXPO_PUBLIC_API_URL
Backend API URL. This must be set according to your platform.

**Platform-specific values:**

**Web / iOS Simulator:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Android Emulator:**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**Physical Device:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

**Note:** Replace `192.168.1.100` with your computer's local IP address.

### Optional Variables

#### EXPO_PUBLIC_GEMINI_API_KEY
Direct Gemini API key for frontend (if needed). Usually not required since backend handles API calls.

**Example:**
```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyExample123456789
```

#### EXPO_PUBLIC_OPENAI_API_KEY
Direct OpenAI API key for frontend (if needed). Usually not required since backend handles API calls.

**Example:**
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-example123456789
```

### Complete Frontend .env Example

```env
# Required - Change based on platform
EXPO_PUBLIC_API_URL=http://localhost:3000

# Optional - Usually not needed
# EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyExample123456789
# EXPO_PUBLIC_OPENAI_API_KEY=sk-example123456789
```

## Finding Your Local IP Address

To use the app on a physical device, you need your computer's local IP address.

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### macOS / Linux
```bash
ifconfig
# or
ip addr
```
Look for "inet" address (usually starts with 192.168.x.x or 10.0.x.x).

## Environment File Setup

### Step 1: Create Backend .env

```bash
cd backend
touch .env
```

Add your configuration:
```env
GEMINI_API_KEY=your_key_here
PORT=3000
```

### Step 2: Create Frontend .env

```bash
# In project root
touch .env
```

Add your configuration:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Step 3: Verify .gitignore

Make sure `.env` files are in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
backend/.env
frontend/.env
```

## Security Best Practices

1. **Never commit .env files** - They contain sensitive API keys
2. **Use different keys for development and production** - Rotate keys regularly
3. **Don't share API keys** - Keep them private
4. **Use environment-specific files** - `.env.development`, `.env.production`
5. **Set up API key rotation** - Change keys periodically

## Troubleshooting

### "API Key not configured" Error
- Verify the key is in the correct `.env` file
- Check for typos or extra spaces
- Restart the server after adding the key
- Ensure the `.env` file is in the correct location

### "Cannot connect to backend" Error
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Check if backend server is running
- Verify the URL matches your platform (localhost vs 10.0.2.2 vs IP)
- Check firewall settings

### "Port already in use" Error
- Change `PORT` in `backend/.env` to a different port
- Update `EXPO_PUBLIC_API_URL` in frontend `.env` to match
- Kill the process using the port if needed

### Environment Variables Not Loading
- Restart the development server
- Clear Expo cache: `expo start -c`
- Verify variable names start with `EXPO_PUBLIC_` for frontend
- Check file location (root vs frontend folder)

## Platform-Specific Notes

### Web
- Use `http://localhost:3000`
- No special configuration needed

### iOS Simulator
- Use `http://localhost:3000`
- Works the same as web

### Android Emulator
- Must use `http://10.0.2.2:3000`
- `10.0.2.2` is the special IP that maps to host machine's localhost

### Physical Device
- Must use your computer's local IP address
- Both devices must be on the same network
- Example: `http://192.168.1.100:3000`

## Example .env Files

### Development Setup

**backend/.env:**
```env
GEMINI_API_KEY=dev_key_here
OPENAI_API_KEY=dev_key_here
PORT=3000
```

**frontend/.env (Web/iOS):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**frontend/.env (Android):**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**frontend/.env (Physical Device):**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## Additional Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Google Gemini API Setup](../api-setup.md)
- [OpenAI API Setup](../api-setup.md)

