import os
import re
import time
from google import genai
from google.genai import Client
from gtts import gTTS
import PySimpleGUI as sg

######################################
# SETTING UP CLIENT
######################################
client = Client()

######################################
# GUI STUFF
######################################
IMAGE_PATH = r"C:\Users\Usuario\Desktop\informatica\User_interfaces\placeholder.png"

def show_loading_window():
    layout = [
        [sg.Text("Generating phrases...", font=("Arial", 16))],
        [sg.Image(IMAGE_PATH, size=(100,100))],
    ]
    return sg.Window("Loading", layout, modal=True, finalize=True)

######################################
# GUI WORD COLLECTION
######################################
all_phrases = []

def collect_words_gui():

    layout = [
        [sg.Text("Selected Words:")],
        [sg.Text("", key="-SELECTED-", size=(40,1), font=("Arial", 14))],

        [
            sg.Button("I", image_filename=IMAGE_PATH, image_size=(60,60)),
            sg.Button("You", image_filename=IMAGE_PATH, image_size=(60,60)),
            sg.Button("Not", image_filename=IMAGE_PATH, image_size=(60,60))
        ],

        [
            sg.Button("Like", image_filename=IMAGE_PATH, image_size=(60,60)),
            sg.Button("Want", image_filename=IMAGE_PATH, image_size=(60,60)),
            sg.Button("Play", image_filename=IMAGE_PATH, image_size=(60,60))
        ],
        [
            sg.Button("Football", image_filename=IMAGE_PATH, image_size=(60,60)),
            sg.Button("Pizza", image_filename=IMAGE_PATH, image_size=(60,60)),
            sg.Button("School", image_filename=IMAGE_PATH, image_size=(60,60))
        ],

        [sg.Button("Create Phrases", size=(15,1), font=("Arial", 14)),
         sg.Button("Quit", size=(10,1), font=("Arial", 14))],
    ]

    window = sg.Window("AAC Prototype - Word Input", layout)
    words = []

    while True:
        event, values = window.read()

        if event in (sg.WIN_CLOSED, "Quit"):
            window.close()
            exit()

        if event == "Create Phrases":
            break

        if event not in ["Finish", "Quit"]:
            words.append(event)
            window["-SELECTED-"].update(", ".join(words))


    window.close()
    
    return words

words_for_prompt = collect_words_gui()

######################################
# GEMINI PROMPT
######################################
base_prompt = f"""
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
{', '.join(words_for_prompt)}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
"""

######################################
# STREAM RESPONSE
######################################
def stream_response(prompt_text):
    buffer = ""
    full_response = ""

    for chunk in client.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=prompt_text
    ):
        if not chunk.text:
            continue

        buffer += chunk.text
        full_response += chunk.text

        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)

    return full_response

initial_loading = show_loading_window()
response = stream_response(base_prompt)
initial_loading.close()
######################################
# GET MORE PHRASES
######################################
def generate_more_phrases(existing_phrases):

    loading = show_loading_window()

    prompt_more = base_prompt + "\nDo NOT repeat any of these phrases:\n" + "\n".join(existing_phrases)
    result = stream_response(prompt_more)

    loading.close()
    return result

######################################
# EXTRACT NUMBERED PHRASES
######################################
def clean_phrase(phrase):
    return re.sub(r'^\d+\.\s*', '', phrase.strip())

def extract_phrases(text):
    numbered_lines = [
        line.strip()
        for line in text.splitlines()
        if re.match(r'^\d+\.', line.strip())
    ]
    return [clean_phrase(l) for l in numbered_lines]

cleaned_phrases = extract_phrases(response)
for p in cleaned_phrases:
    all_phrases.append(p)

######################################
# TEXT-TO-SPEECH
######################################
def speak(phrase):
    tts = gTTS(text=phrase, lang='en')
    tts.save("output.mp3")
    os.system("start output.mp3")

######################################
# PHRASE SELECTION GUI
######################################
def show_phrases_gui(phrases):

    layout = [[sg.Text("Choose a phrase to speak:", font=("Arial", 16))]]

    for p in phrases:
        layout.append([
            sg.Button(
                p,
                key=p,
                pad=(5,5),
                size=(25,5),                
                font=("Arial", 14)
            )
        ])

    layout.append([sg.Button("Show more phrases", font=("Arial", 14))])
    layout.append([sg.Button("Exit", font=("Arial", 14))])

    window = sg.Window("AAC Output", layout, finalize=True)

    while True:
        event, _ = window.read()

        if event == "Show more phrases":
            window.close()           
            more_text = generate_more_phrases(all_phrases)
            more_clean = extract_phrases(more_text)
            for p in more_clean:
                all_phrases.append(p)
            show_phrases_gui(more_clean)
            return

        if event in (sg.WIN_CLOSED, "Exit"):
            break

        if event in phrases:
            speak(event)
            break

    window.close()


######################################
# LAUNCH PHRASE GUI
######################################

if cleaned_phrases:
    show_phrases_gui(cleaned_phrases)
else:
    sg.popup("No valid phrases were generated.")

client.close()
print("Done.")
