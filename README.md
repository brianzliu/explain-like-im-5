## Explain it to me like I'm 5

Next.js (App Router) + Tailwind. An educational voice-activated teaching app where you choose a character (SpongeBob, Peter Griffin, or Dora) and ask questions using your voice. The AI teacher responds with character-appropriate explanations grounded in real web data.

### Features

- **Voice-to-Voice Interaction**: Ask questions using your microphone and get spoken responses
- **AI-Powered Answers**: Uses Claude AI with web grounding via Parallel Search API
- **Character Voices**: SpongeBob has a custom ElevenLabs voice clone
- **Real-time Web Context**: Answers are grounded in fresh web data

### Setup

1. Install dependencies:
```bash
pnpm i    # or npm i / yarn
```

2. Configure API keys in `.env.local`:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
PARALLEL_API_KEY=your_parallel_api_key
```

3. Run the dev server:
```bash
pnpm dev
```

### Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Voice**: ElevenLabs (Speech-to-Text & Text-to-Speech)
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Web Search**: Parallel Search API

