# Interview Prep RN

React Native port of the Swift `interview-prep` app.

## Included

- Home overview
- Question browser with filters, search, and bookmarks
- Quiz mode with saved quiz history
- Listen mode powered by `expo-speech`
- Supabase-backed data loading

## Run

```bash
cd interview-prep-rn
npm install
npm start
```

## Notes

- This uses Expo for the React Native runtime.
- Listen mode uses platform text-to-speech rather than the Swift app's custom audio pipeline.
- The package versions may need a normal dependency refresh if your local Expo toolchain is on a newer SDK.
