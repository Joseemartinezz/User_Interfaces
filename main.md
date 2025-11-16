# Project Brief

## Overview

We are building a tablet/mobile app that:

- **Translates** PCS (Picture Communication Symbols), text, speech, or image inputs into natural language.  
- **Converts** caregivers’ speech or text into PCS symbol sequences.  
- **Adapts** to each child’s communication profile and privacy constraints.  

---

## Core Technologies

### 1. AAC Symbol System  

- Use **ARASAAC** (open-source pictogram library) to design the complete PCS set.  
  - *If we want to use **official PCS symbols (Boardmaker)**, we must review licensing carefully.*  
- Once we have the pictograms, map **words → symbol IDs → SVG/PNG files → UI components**.

---

### 2. Multimodal Input (Audio, Text, Image)

| Input Type | Tool | Purpose |
|-------------|-------|----------|
| **PCS Symbols (child input)** | **ARASAAC** symbol set with a React Native grid components | The child selects or combines PCS pictograms as input. The app sends these symbols to the backend or LLM for interpretation and translation into text or speech. |
| **Text (caregiver input)** | **React Native TextInput** | Allows caregivers to manually enter text and send it to the backend or LLM to receive the corresponding PCS symbol translation. |
| **Speech (audio input)** | **Whisper (OpenAI)** | Converts caregiver speech to text, which is then translated into PCS symbols.|
| **Image (visual input)** | **GPT-4o**, **Gemini 1.5 Pro**, or **Claude 3 Sonnet/Haiku** | Allows the child or caregiver to capture or upload an image. The AI interprets the image and converts it into PCS symbols in the case of the caregiver or into text for the caregiver. |

---

### 3. Reasoning / Language Understanding (LLM Layer)

- Use a multimodal LLM such as **GPT-4o / mini**, **Gemini 1.5 PRO** or **Claude 3 sonnet**, capable of interpreting image/audio/text inputs.
  - We should considere changing the model depending on the input modality or use case
- Run **Whisper** locally on the device, if possible, for better performance
- Define whether to send only **event data or embeddings** to the LLM, instead of raw audio or images.

#### ML Architecture in case of using embeddings

1. **Unimodal detectors** → output features or labels.  
2. **Fusion layer** → combines them into a unified “intention embedding.” 
3. **LLM input**: `{embedding + context (child profile, PCS set, history)}` → outputs either a **natural language sentence** or a **sequence of PCS symbol IDs**.

---

### 4. Frontend / User Interface

- **Mobile/tablet app** — built with **React Native**:  
  - Large buttons and fonts, high-contrast color themes, simplified navigation, touch input, and symbol-based interaction.  
  - *We should add different modes like this: Only Symbols, Symbols + Text.?*

---

### 5. Backend & Infrastructure

| Component | Recommended Tech | Notes |
|------------|------------------|-------|
| **API** | **Node.js (Express)** | Connects to ML models |
| **Database** | **Firebase (Firestore)** | Stores user profiles and app data. (Firebase is the easiest option: NoSQL database with real-time sync, built-in authentication, and excellent React Native SDK support) |
| **File Storage** | **Firebase Storage** | Used for storing symbol files (SVG/PNG). (Compatible with Firebase database, provides secure file uploads with automatic CDN distribution) |
| **On-device ML** | **TensorFlow.js React Native** (`@tensorflow/tfjs-react-native`) | Enables **local inference** for privacy and offline prediction (e.g., next-word, emotion, intent). *Easiest option: pure JavaScript/TypeScript, no native bridge setup required, works out-of-the-box with React Native*<br><br>**In case of implementing it we may use one of this models as base for easier implementation:**<br>- **Small LSTM model** → for next-word/symbol prediction <br>- **Reduced DistilGPT-2** → for text completion and symbol sequence generation<br>

---

## Implementation Roadmap (Demo, proof-of-concept)

1. **Basic UI with React Native**:  
   - Main screen with large symbol grid (PCS selection).  
   - Text input field for caregiver.  
   - Display area showing translated output (text or PCS sequence).  
   - Simple navigation.

2. **ARASAAC pictograms integration**:  
   - Download and integrate a basic set of ARASAAC symbols (20-30 most common symbols for demo).  
   - Build simple word → symbol ID mapping.

3. **LLM integration (prototype)**:  
   - Connect to LLM API (GPT-4o-mini or Gemini 1.5 Flash for cost efficiency).  
   - Implement basic prompts: text → PCS sequence, PCS sequence → text.  
   - *Optional for demo: image input with vision model.*

4. **Backend setup**:  
   - Simple Node.js/Express API with Firebase integration.  
   - Basic user profile storage (demo data only).

5. **Test scenarios**:  
   - Show 2-3 working examples: child selects symbols → app translates to text, caregiver writes text → app suggests PCS symbols.

---

## System Architecture (Textual Diagram)

[Tablet App]
├─ Whisper STT (caregiver speech)
├─ Text / Symbol / Image Input
↓
[Local Fusion Layer] → creates intention embedding
↓
[LLM Service]
↓
{ Natural Language Phrase + PCS Sequence }
↓
Displayed on tablet

---

## Evaluation Metrics

| Metric | Description |
|---------|-------------|
| **Intent Accuracy** | Correctly interpreted child expressions |
| **Latency** | Time from input to output |
| **Usability (SUS)** | System Usability Scale, measured with therapists |
| **Clinical Value** | Therapist assessment of communicative improvement |

---

## Practical Toolkit Summary

| Purpose | Recommended Tool |
|----------|------------------|
| Speech-to-text | Whisper |
| Multimodal LLM | GPT-4o / GPT-4o-mini / Gemini 1.5 Pro / Claude 3 |
| Mobile App | React Native |
| Backend | Node.js |
| DB + Auth | Firebase (Firestore + Authentication) |
| Storage | Firebase Storage |
| *Analytics* | Prometheus / Grafana / Sentry |

---
