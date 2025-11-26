import os
import requests
from pathlib import Path

def build_aac_image_prompt(phrase: str) -> str:
    """Build a prompt optimized for AAC device illustrations."""
    return f"""
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create a simple, natural, child-friendly illustration that represents the phrase.
Guidelines:
- Simple, clean, friendly illustration
- One clear, easy-to-recognize subject
- Flat colors, minimal detail, bold outlines
- No text or letters inside the image
- Safe for young children
Phrase to illustrate:
"{phrase}"
"""

def generate_aac_image_azure(phrase: str, save_path: str = None) -> str:
    """
    Generate an AAC image using Azure OpenAI DALL-E.
    
    Args:
        phrase: The phrase to illustrate
        save_path: Optional path to save the image
        
    Returns:
        URL of the generated image
    """
    prompt = build_aac_image_prompt(phrase)
    
    print(f"Generating image for: '{phrase}'")
    
    # Clean endpoint and build URL
    endpoint = AZURE_OPENAI_ENDPOINT.rstrip('/').replace('/models', '')
    url = f"{endpoint}/openai/deployments/{AZURE_DEPLOYMENT_NAME}/images/generations?api-version={API_VERSION}"
    
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY
    }
    
    body = {
        "prompt": prompt,
        "size": "1024x1024",
        "n": 1
    }
    
    response = requests.post(url, headers=headers, json=body)
    response.raise_for_status()
    
    result = response.json()
    image_url = result["data"][0]["url"]
    
    # Save image if path provided
    if save_path:
        image_data = requests.get(image_url).content
        with open(save_path, 'wb') as f:
            f.write(image_data)
        print(f"✓ Saved to: {save_path}")
    
    return image_url

def test_aac_generation():
    """Test the AAC image generation with multiple phrases."""
    
    # Validate configuration
    if not all([AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_DEPLOYMENT_NAME]):
        print("Error: Missing Azure OpenAI configuration!")
        print("Required environment variables:")
        print("  - AZURE_OPENAI_ENDPOINT")
        print("  - AZURE_OPENAI_API_KEY")
        print("  - AZURE_DEPLOYMENT_NAME")
        return
    
    print(f"Using Azure endpoint: {AZURE_OPENAI_ENDPOINT}")
    print(f"Deployment: {AZURE_DEPLOYMENT_NAME}\n")
    
    # Create output directory
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    # Test phrases typical for AAC devices
    test_phrases = [
        "I want water",
        "I am happy",
        "help me please"
    ]
    
    print("Starting AAC image generation tests...\n")
    
    results = []
    
    for phrase in test_phrases:
        try:
            # Create safe filename
            filename = phrase.replace(" ", "_").lower() + ".png"
            filepath = output_dir / filename
            
            # Generate and save image
            url = generate_aac_image_azure(phrase, str(filepath))
            
            # Get file size
            size_kb = filepath.stat().st_size / 1024
            print(f"  Size: {size_kb:.2f} KB")
            print(f"  URL: {url}\n")
            
            results.append({
                "phrase": phrase,
                "url": url,
                "file": str(filepath),
                "success": True
            })
            
        except requests.exceptions.HTTPError as e:
            print(f"✗ HTTP Error for '{phrase}'")
            print(f"  Status: {e.response.status_code}")
            print(f"  Error: {e.response.text}\n")
            results.append({
                "phrase": phrase,
                "success": False,
                "error": str(e)
            })
        except Exception as e:
            print(f"✗ Failed to generate image for '{phrase}'")
            print(f"  Error: {str(e)}\n")
            results.append({
                "phrase": phrase,
                "success": False,
                "error": str(e)
            })
    
    # Summary
    print("\n" + "="*50)
    print("Test Summary:")
    print("="*50)
    successful = sum(1 for r in results if r["success"])
    print(f"Successful: {successful}/{len(results)}")
    
    for result in results:
        status = "✓" if result["success"] else "✗"
        print(f"{status} {result['phrase']}")
    
    return results

if __name__ == "__main__":
    test_aac_generation()