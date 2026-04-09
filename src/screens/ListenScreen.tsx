import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Audio, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { FilterBar } from "../components/FilterBar";
import { useAppContext } from "../context/AppContext";
import { difficultyColor, theme } from "../theme";
import { Question } from "../types";

const speedOptions = [0.75, 1, 1.25, 1.5, 2];
const ttsBaseURL = "https://web-interview-prep-app.vercel.app/api/tts";

type PendingAction = "answer" | "advance" | null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(buffer);
  let result = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const triplet = (a << 16) | (b << 8) | c;

    result += chars[(triplet >> 18) & 0x3f];
    result += chars[(triplet >> 12) & 0x3f];
    result += index + 1 < bytes.length ? chars[(triplet >> 6) & 0x3f] : "=";
    result += index + 2 < bytes.length ? chars[triplet & 0x3f] : "=";
  }

  return result;
}

export function ListenScreen() {
  const { questions, bookmarks } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(true);
  const [rate, setRate] = useState(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetIndexRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackIdRef = useRef(0);
  const pendingActionRef = useRef<PendingAction>(null);
  const isPlayingRef = useRef(isPlaying);
  const isSpeakingQuestionRef = useRef(isSpeakingQuestion);
  const playlistRef = useRef<Question[]>([]);
  const currentIndexRef = useRef(0);

  const playlist = useMemo(() => {
    let result = questions.filter((question) => {
      if (selectedCategory && question.category !== selectedCategory) {
        return false;
      }
      if (selectedDifficulty && question.difficulty !== selectedDifficulty) {
        return false;
      }
      if (bookmarkedOnly && !bookmarks.has(question.id)) {
        return false;
      }
      return true;
    });

    if (shuffled && shuffledIds.length > 0) {
      const byId = new Map(result.map((item) => [item.id, item]));
      result = shuffledIds.map((id) => byId.get(id)).filter(Boolean) as Question[];
    }

    return result;
  }, [bookmarkedOnly, bookmarks, questions, selectedCategory, selectedDifficulty, shuffled, shuffledIds]);

  const currentQuestion = playlist[currentIndex] ?? null;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isSpeakingQuestionRef.current = isSpeakingQuestion;
  }, [isSpeakingQuestion]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const unloadCurrentSound = async () => {
    const sound = soundRef.current;
    soundRef.current = null;

    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch {
      // Ignore: sound may already be stopped.
    }

    try {
      await sound.unloadAsync();
    } catch {
      // Ignore unload races during navigation and filter changes.
    }
  };

  const stopPlayback = async ({ resetStage = false, keepPendingAction = false } = {}) => {
    playbackIdRef.current += 1;
    clearPendingTimeout();
    if (!keepPendingAction) {
      pendingActionRef.current = null;
    }
    setIsLoadingAudio(false);
    await unloadCurrentSound();

    if (resetStage) {
      setIsSpeakingQuestion(true);
    }
  };

  const autoAdvance = () => {
    setCurrentIndex((current) => {
      if (current + 1 < playlistRef.current.length) {
        setIsSpeakingQuestion(true);
        return current + 1;
      }

      setIsPlaying(false);
      return current;
    });
  };

  const schedulePendingAction = (action: Exclude<PendingAction, null>, callback: () => void, delay: number) => {
    pendingActionRef.current = action;
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (!isPlayingRef.current) {
        return;
      }
      pendingActionRef.current = null;
      callback();
    }, delay);
  };

  const playRemoteAudio = async (text: string, speakingQuestion: boolean, question: Question, playbackId: number) => {
    setIsLoadingAudio(true);

    try {
      const response = await fetch(ttsBaseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`TTS request failed with status ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const fileUri = `${FileSystem.cacheDirectory}tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, arrayBufferToBase64(audioBuffer), {
        encoding: FileSystem.EncodingType.Base64
      });

      if (playbackId !== playbackIdRef.current || !isPlayingRef.current) {
        return;
      }

      await unloadCurrentSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        {
          shouldPlay: true,
          rate,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 250
        },
        (status) => {
          if (!status.isLoaded || !status.didJustFinish || playbackId !== playbackIdRef.current) {
            return;
          }

          soundRef.current = null;
          if (!isPlayingRef.current) {
            return;
          }

          if (speakingQuestion) {
            schedulePendingAction("answer", () => {
              void speakAnswer(question);
            }, 1500);
          } else {
            schedulePendingAction("advance", autoAdvance, 2500);
          }
        }
      );

      soundRef.current = sound;
    } catch (error) {
      console.warn("[Listen] TTS error", error);
      if (playbackId === playbackIdRef.current && isPlayingRef.current) {
        schedulePendingAction("advance", autoAdvance, 1000);
      }
    } finally {
      if (playbackId === playbackIdRef.current) {
        setIsLoadingAudio(false);
      }
    }
  };

  const speakCurrent = async (question: Question) => {
    const playbackId = playbackIdRef.current;
    setIsSpeakingQuestion(true);
    await playRemoteAudio(`Question ${currentIndexRef.current + 1}. ${question.question}`, true, question, playbackId);
  };

  const speakAnswer = async (question: Question) => {
    const playbackId = playbackIdRef.current;
    setIsSpeakingQuestion(false);
    await playRemoteAudio(question.answer, false, question, playbackId);
  };

  const startPlayback = async () => {
    if (!currentQuestion) {
      setIsPlaying(false);
      return;
    }

    playbackIdRef.current += 1;
    pendingActionRef.current = null;
    clearPendingTimeout();

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      staysActiveInBackground: false
    });

    setIsPlaying(true);
    if (isSpeakingQuestionRef.current) {
      await speakCurrent(currentQuestion);
    } else {
      await speakAnswer(currentQuestion);
    }
  };

  const pausePlayback = async () => {
    setIsPlaying(false);
    clearPendingTimeout();

    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
      } catch {
        // Ignore pause failures if the sound is already stopping.
      }
    }
  };

  const resumePlayback = async () => {
    if (!currentQuestion) {
      return;
    }

    setIsPlaying(true);

    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
        return;
      } catch {
        await unloadCurrentSound();
      }
    }

    if (pendingActionRef.current === "answer") {
      pendingActionRef.current = null;
      await speakAnswer(currentQuestion);
      return;
    }

    if (pendingActionRef.current === "advance") {
      pendingActionRef.current = null;
      autoAdvance();
      return;
    }

    if (isSpeakingQuestionRef.current) {
      await speakCurrent(currentQuestion);
    } else {
      await speakAnswer(currentQuestion);
    }
  };

  const syncPlaylistState = async (resetIndex = false) => {
    const shouldRestart = isPlayingRef.current;
    await stopPlayback({ resetStage: true });

    if (playlist.length === 0) {
      setCurrentIndex(0);
      setIsPlaying(false);
      return;
    }

    setCurrentIndex((current) => {
      if (resetIndex) {
        return 0;
      }
      return Math.min(current, playlist.length - 1);
    });
    setIsSpeakingQuestion(true);

    if (shouldRestart) {
      requestAnimationFrame(() => {
        void startPlayback();
      });
    }
  };

  useEffect(() => {
    const shouldResetIndex = resetIndexRef.current;
    resetIndexRef.current = false;
    void syncPlaylistState(shouldResetIndex);
  }, [selectedCategory, selectedDifficulty, bookmarkedOnly, shuffled, shuffledIds, questions.length]);

  useEffect(() => {
    return () => {
      void stopPlayback({ resetStage: true });
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Listen</Text>

        <FilterBar
          selectedCategory={selectedCategory}
          selectedDifficulty={selectedDifficulty}
          onCategoryChange={setSelectedCategory}
          onDifficultyChange={setSelectedDifficulty}
        />

        <View style={styles.toolbar}>
          <Pressable
            onPress={() => {
              setBookmarkedOnly((current) => !current);
            }}
            style={[styles.toolbarChip, bookmarkedOnly && styles.toolbarChipActive]}
          >
            <Text style={[styles.toolbarChipText, bookmarkedOnly && styles.toolbarChipTextActive]}>Bookmarked</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const next = !shuffled;
              resetIndexRef.current = true;
              setShuffled(next);
              if (next) {
                setShuffledIds([...questions].sort(() => Math.random() - 0.5).map((item) => item.id));
              } else {
                setShuffledIds([]);
              }
            }}
            style={[styles.toolbarChip, shuffled && styles.toolbarChipActive]}
          >
            <Text style={[styles.toolbarChipText, shuffled && styles.toolbarChipTextActive]}>Shuffle</Text>
          </Pressable>

          <Text style={styles.meta}>{playlist.length} Qs</Text>
        </View>

        {currentQuestion ? (
          <Card style={styles.listenCard}>
            <View style={styles.listenMeta}>
              <Text style={styles.meta}>
                {currentIndex + 1} / {playlist.length}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${difficultyColor(currentQuestion.difficulty)}22` }
                ]}
              >
                <Text style={[styles.badgeText, { color: difficultyColor(currentQuestion.difficulty) }]}>
                  {currentQuestion.difficulty}
                </Text>
              </View>
            </View>

            <Text style={styles.category}>{currentQuestion.category}</Text>

            <View style={styles.segment}>
              <View style={[styles.dot, isSpeakingQuestion ? styles.dotActive : null]} />
              <View style={styles.segmentBody}>
                <Text style={styles.segmentLabel}>Q</Text>
                <Text style={styles.segmentText}>{currentQuestion.question}</Text>
              </View>
            </View>

            <View style={styles.segment}>
              <View style={[styles.dot, !isSpeakingQuestion ? styles.dotActive : null]} />
              <View style={styles.segmentBody}>
                <Text style={styles.segmentLabel}>A</Text>
                <Text style={styles.segmentText}>{currentQuestion.answer}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={styles.sectionTitle}>No Questions</Text>
            <Text style={styles.meta}>Adjust filters or wait for content to load.</Text>
          </Card>
        )}

        <Card style={styles.controlsCard}>
          <View style={styles.controls}>
            <Pressable
              onPress={() => {
                void (async () => {
                  await stopPlayback({ resetStage: true });
                  if (playlist.length === 0) {
                    setCurrentIndex(0);
                    return;
                  }
                  setCurrentIndex((current) => Math.max(0, current - 1));
                  if (isPlayingRef.current) {
                    requestAnimationFrame(() => {
                      void startPlayback();
                    });
                  }
                })();
              }}
              style={styles.transport}
            >
              <Text style={styles.transportLabel}>Prev</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void (async () => {
                  if (playlist.length === 0) {
                    setIsPlaying(false);
                    return;
                  }

                  if (isPlayingRef.current) {
                    await pausePlayback();
                  } else {
                    await resumePlayback();
                  }
                })();
              }}
              style={[styles.transport, styles.primaryTransport]}
            >
              <Text style={styles.primaryTransportLabel}>{isPlaying ? "Pause" : isLoadingAudio ? "Loading" : "Play"}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void (async () => {
                  await stopPlayback({ resetStage: true });
                  if (playlist.length === 0) {
                    setCurrentIndex(0);
                    return;
                  }
                  setCurrentIndex((current) => Math.min(playlist.length - 1, current + 1));
                  if (isPlayingRef.current) {
                    requestAnimationFrame(() => {
                      void startPlayback();
                    });
                  }
                })();
              }}
              style={styles.transport}
            >
              <Text style={styles.transportLabel}>Next</Text>
            </Pressable>
          </View>

          <View style={styles.speedRow}>
            {speedOptions.map((option) => {
              const active = option === rate;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setRate(option);
                    if (isPlayingRef.current) {
                      void (async () => {
                        await stopPlayback({ resetStage: false });
                        requestAnimationFrame(() => {
                          void startPlayback();
                        });
                      })();
                    }
                  }}
                  style={[styles.speedChip, active && styles.speedChipActive]}
                >
                  <Text style={[styles.speedChipText, active && styles.speedChipTextActive]}>{option}x</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
    paddingBottom: 24
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  toolbarChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.indigo,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  toolbarChipActive: {
    backgroundColor: theme.colors.indigo,
    borderColor: theme.colors.indigo
  },
  toolbarChipText: {
    color: theme.colors.indigo,
    fontWeight: "700"
  },
  toolbarChipTextActive: {
    color: "#ffffff",
    fontWeight: "800"
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 13
  },
  listenCard: {
    backgroundColor: theme.colors.card
  },
  controlsCard: {
    backgroundColor: theme.colors.surfaceMuted
  },
  listenMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  badge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  category: {
    marginTop: 8,
    color: theme.colors.muted
  },
  segment: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: "#d1d5db"
  },
  dotActive: {
    backgroundColor: theme.colors.indigo
  },
  segmentBody: {
    flex: 1
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.indigo
  },
  segmentText: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 23,
    color: theme.colors.text
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  transport: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    alignItems: "center"
  },
  primaryTransport: {
    backgroundColor: theme.colors.indigo,
    borderColor: theme.colors.indigo
  },
  transportLabel: {
    color: theme.colors.text,
    fontWeight: "700"
  },
  primaryTransportLabel: {
    color: "#ffffff",
    fontWeight: "800"
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14
  },
  speedChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  speedChipActive: {
    backgroundColor: theme.colors.indigo,
    borderColor: theme.colors.indigo
  },
  speedChipText: {
    color: theme.colors.text,
    fontWeight: "600"
  },
  speedChipTextActive: {
    color: "#ffffff",
    fontWeight: "700"
  }
});
