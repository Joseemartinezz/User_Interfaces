import os
import re
from google import genai
from google.genai import types,Client
from gtts import gTTS



###################################### SETTING UP THE CLIENT #####################################
# Make sure to set your GEMINI_API_KEY environment variable before running the script
client = genai.Client(api_key='GEMINI_API_KEY')
generation_config = {"temperature": 0.7, "top_p":1,"top_k":1, "max_output_tokens": 256}

client = Client()

###################################### INPUT PROCESSING #####################################

def collect_words():
    words = []
    print("Type words to add. Type 'run' when done. and q to quit\n")

    while True:
        user_input = input("> ").strip()
        if user_input.lower() == "run":
            break
        if user_input =="q":
            exit()      
        if user_input:
            words.append(user_input)

    return words

words_for_prompt = collect_words()
###################################### GENERATE RESPONSE #####################################

prompt = f"""
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
{', '.join(words_for_prompt)}

Guidelines:
- The phrases must be short but contain ALL information provided, use the words or synonyms of these as long as information is not lost
- They should sound natural when spoken aloud
- They must be grammatically correct and easy for a child to understand
- If only one natural phrase makes sense, return just one
- When the phrase is more complex or leaves more space for interpretation, return multiple options (up to 5)
- Return one phrase per line, if more than one are returned, order them starting from one.

Now generate the phrases.
"""

#Check gemini documentation, there are ways to sent text in streams rather than all at once, so main opctions can be shown inmediately while more complex ones are still being generated.
response = client.models.generate_content(
    model="gemini-2.5-flash",
    
    contents=prompt,
)

client.close()

#Here i only leave the lines that start with a number followed by a dot, to show the user the options generated and not the introductoy text.
lines = response.text.strip().splitlines()
phrases_indexed = '\n'.join([line for line in lines if re.match(r'^\d+\.', line.strip())])
print(phrases_indexed)


##################################### AUDIO OUTPUT #####################################
def speak(phrase):
    # Create speech
    text = phrase
    tts = gTTS(text=text, lang='en')

    # Save to file
    tts.save("output.mp3")

    # Play the file
    os.system("start output.mp3") 

def clean_phrase(phrase):
    # Remove leading numbers with dots (e.g., "1. ", "2. ")
    cleaned = re.sub(r'^\d+\.\s*', '', phrase.strip())
    return cleaned


options = [clean_phrase(line) for line in response.text.splitlines() if line.strip()]


if len(options) > 1:
    phrase_choice=input("Multiple phrases detected. enter the number of the phrase you want to hear. If you don't want to hear any, type 'n': ")
    if phrase_choice.lower() !='n':
        try:
            choice = int(phrase_choice)
            if 1 <= choice <= len(options):
                speak(options[choice-1])
            else:
                print("Invalid choice.")
        except ValueError:
            print("Please enter a valid number.")
else :
    play = input("Do you want to hear the generated phrase? (y/n): ")
    if play.lower() == 'y':
        speak(options[0] if options else response.text)

print("Done.")