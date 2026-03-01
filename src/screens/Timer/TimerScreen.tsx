// src/screens/Timer/TimerScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Spacing, BorderRadius, Typography, Shadows } from "../../theme/worktwinTheme";
import { 
  addFocusSession, 
  loadTasks,
  formatDuration,
  loadProductivityTrends,
  Task
} from "../../utils/storage";

interface ProductivityTrend {
  date: string;
  productivityScore: number;
  totalFocus: number;
}

export default function TimerScreen() {
  const { colors } = useTheme();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(25);
  const [interruptions, setInterruptions] = useState(0);
  const [focusScore, setFocusScore] = useState(10);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [productivityScore, setProductivityScore] = useState(5);
  const [trends, setTrends] = useState<ProductivityTrend[]>([]);
  const [showTrends, setShowTrends] = useState(false);

  useEffect(() => {
    loadTasksData();
    loadTrendsData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0 && running) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [running, seconds]);

  const loadTasksData = async () => {
    try {
      const loadedTasks = await loadTasks();
      setTasks(loadedTasks.filter((t: Task) => !t.done));
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadTrendsData = async () => {
    try {
      const loadedTrends = await loadProductivityTrends();
      setTrends(loadedTrends.slice(0, 7));
    } catch (error) {
      console.error("Error loading trends:", error);
    }
  };

  const handleStart = () => {
    setRunning(true);
    setInterruptions(0);
    setFocusScore(10);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(selectedTime * 60);
    setInterruptions(0);
    setFocusScore(10);
  };

  const handleInterruption = () => {
    setInterruptions(prev => prev + 1);
    setFocusScore(prev => Math.max(1, prev - 1));
    Vibration.vibrate(100);
  };

  const handleSessionComplete = () => {
    setRunning(false);
    Vibration.vibrate(500);
    
    const calculatedProductivity = Math.max(1, Math.min(10, 
      Math.round((focusScore / 10) * (1 - interruptions / 10) * 10)
    ));
    
    const session = {
      seconds: selectedTime * 60,
      endedAt: Date.now(),
      taskId: selectedTaskId,
      interruptions,
      focusScore,
      productivity: calculatedProductivity,
    };
    
    setCurrentSession(session);
    setProductivityScore(calculatedProductivity);
    setShowCompletionModal(true);
  };

  const handleSaveSession = async (productivityRating: number) => {
    try {
      if (currentSession) {
        await addFocusSession({
          ...currentSession,
          productivity: productivityRating,
        });
        setShowCompletionModal(false);
        handleReset();
        loadTrendsData();
        Alert.alert("Success", "Session saved! Check insights for trends.");
      }
    } catch (error) {
      console.error("Error saving session:", error);
      Alert.alert("Error", "Failed to save session");
    }
  };

  const handleTimeSelect = (minutes: number) => {
    setSelectedTime(minutes);
    setSeconds(minutes * 60);
    setRunning(false);
    setInterruptions(0);
    setFocusScore(10);
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const progress = ((selectedTime * 60 - seconds) / (selectedTime * 60)) * 100;

  const getProductivityColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 5) return colors.warning;
    return colors.danger;
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg, alignItems: "center" },
    title: { ...Typography.h1, color: colors.text, marginTop: Spacing.md, marginBottom: Spacing.xl },
    timerCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.xl,
      alignItems: "center",
      ...Shadows.medium,
      marginBottom: Spacing.xl,
    },
    progressCircle: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
      borderWidth: 4,
      borderColor: colors.primary + "40",
      overflow: "hidden",
    },
    progressRing: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.primary + "20",
      width: "0%",
    },
    time: { ...Typography.h1, fontSize: 48, color: colors.text, zIndex: 1 },
    liveStats: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginTop: Spacing.sm,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    statText: { ...Typography.caption, color: colors.textSecondary },
    taskSelector: {
      width: "100%",
      marginBottom: Spacing.lg,
    },
    sectionLabel: { 
      ...Typography.body, 
      fontWeight: '600', 
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'left',
      alignSelf: 'flex-start',
    },
    taskList: {
      flexDirection: 'row',
      maxHeight: 50,
    },
    taskChip: {
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      marginRight: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    taskChipText: { color: colors.textMuted, fontSize: 14 },
    taskChipTextSelected: { color: colors.text },
    timeSelector: {
      flexDirection: "row",
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    timeBtn: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeBtnSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeBtnText: { ...Typography.body, color: colors.textSecondary },
    timeBtnTextSelected: { color: colors.text },
    interruptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.warning,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
      ...Shadows.small,
    },
    interruptionText: { color: colors.text, fontSize: 16, fontWeight: "600" },
    controls: {
      flexDirection: "row",
      gap: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.secondary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      gap: Spacing.sm,
      ...Shadows.small,
    },
    pauseBtn: { backgroundColor: colors.warning },
    btnText: { color: colors.text, fontSize: 18, fontWeight: "600" },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.sm,
    },
    secondaryBtnText: { color: colors.textSecondary, fontSize: 16 },
    disabled: { opacity: 0.5 },
    trendsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
    },
    trendsBtnText: { color: colors.primary, fontSize: 16, fontWeight: "500" },
    trendsContainer: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginTop: Spacing.md,
      ...Shadows.small,
    },
    trendsTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.md },
    trendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    trendDate: { ...Typography.caption, color: colors.textSecondary, width: 70, fontSize: 11 },
    trendBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      marginHorizontal: Spacing.sm,
      overflow: "hidden",
    },
    trendFill: {
      height: "100%",
      borderRadius: BorderRadius.round,
    },
    trendScore: { ...Typography.caption, color: colors.textSecondary, width: 35, textAlign: "right" },
    noTrendsText: { ...Typography.caption, color: colors.textMuted, textAlign: 'center', marginVertical: Spacing.md },
    trendStats: { ...Typography.body, color: colors.text, marginTop: Spacing.md, textAlign: "center" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: "90%",
      alignItems: "center",
      ...Shadows.medium,
    },
    modalTitle: { ...Typography.h2, color: colors.text, marginVertical: Spacing.md },
    sessionStats: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    statLabel: { ...Typography.body, color: colors.text, marginBottom: Spacing.xs },
    modalSubtitle: { ...Typography.body, fontWeight: "600", color: colors.text, marginBottom: Spacing.md },
    ratingContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    ratingBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    ratingBtnSelected: {
      backgroundColor: colors.primary,
    },
    ratingText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
    ratingTextSelected: { color: colors.text },
    modalButtons: {
      flexDirection: "row",
      gap: Spacing.md,
      width: "100%",
    },
    modalBtn: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
    },
    cancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    saveBtn: { backgroundColor: colors.primary },
    cancelText: { color: colors.textSecondary, fontWeight: "600" },
    saveText: { color: colors.text, fontWeight: "600" },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Focus Timer</Text>

          <View style={styles.timerCard}>
            <View style={styles.progressCircle}>
              <View style={[styles.progressRing, { width: `${progress}%` }]} />
              <Text style={styles.time}>
                {String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
              </Text>
            </View>
            
            {running && (
              <View style={styles.liveStats}>
                <View style={styles.statItem}>
                  <Ionicons name="alert-circle" size={16} color={colors.warning} />
                  <Text style={styles.statText}>Interruptions: {interruptions}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <Text style={styles.statText}>Focus: {focusScore}/10</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.taskSelector}>
            <Text style={styles.sectionLabel}>Link to Task (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskList}>
              <TouchableOpacity
                style={[styles.taskChip, !selectedTaskId && styles.taskChipSelected]}
                onPress={() => setSelectedTaskId(null)}
              >
                <Text style={!selectedTaskId ? styles.taskChipTextSelected : styles.taskChipText}>
                  None
                </Text>
              </TouchableOpacity>
              {tasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskChip,
                    selectedTaskId === task.id && styles.taskChipSelected
                  ]}
                  onPress={() => setSelectedTaskId(task.id)}
                >
                  <Text style={selectedTaskId === task.id ? styles.taskChipTextSelected : styles.taskChipText}>
                    {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timeSelector}>
            {[15, 25, 45].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeBtn,
                  selectedTime === time && styles.timeBtnSelected,
                ]}
                onPress={() => handleTimeSelect(time)}
              >
                <Text style={[
                  styles.timeBtnText,
                  selectedTime === time && styles.timeBtnTextSelected
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {running && (
            <TouchableOpacity style={styles.interruptionBtn} onPress={handleInterruption}>
              <Ionicons name="warning" size={20} color={colors.text} />
              <Text style={styles.interruptionText}>Log Interruption</Text>
            </TouchableOpacity>
          )}

          <View style={styles.controls}>
            {!running ? (
              <TouchableOpacity
                style={[styles.primaryBtn, seconds === 0 && styles.disabled]}
                onPress={handleStart}
                disabled={seconds === 0}
              >
                <Ionicons name="play" size={24} color={colors.text} />
                <Text style={styles.btnText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, styles.pauseBtn]} onPress={handlePause}>
                <Ionicons name="pause" size={24} color={colors.text} />
                <Text style={styles.btnText}>Pause</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.trendsBtn} 
            onPress={() => setShowTrends(!showTrends)}
          >
            <Ionicons name="trending-up" size={20} color={colors.primary} />
            <Text style={styles.trendsBtnText}>View Productivity Trends</Text>
          </TouchableOpacity>

          {showTrends && (
            <View style={styles.trendsContainer}>
              <Text style={styles.trendsTitle}>Last 7 Days</Text>
              {trends.length > 0 ? (
                trends.map((trend, index) => (
                  <View key={index} style={styles.trendItem}>
                    <Text style={styles.trendDate}>{trend.date}</Text>
                    <View style={styles.trendBar}>
                      <View 
                        style={[
                          styles.trendFill, 
                          { 
                            width: `${(trend.productivityScore / 10) * 100}%`,
                            backgroundColor: getProductivityColor(trend.productivityScore)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.trendScore}>{trend.productivityScore}/10</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTrendsText}>No trends data yet. Complete some sessions!</Text>
              )}
              {trends.length > 0 && (
                <Text style={styles.trendStats}>
                  Total Focus: {formatDuration(trends.reduce((acc, t) => acc + t.totalFocus, 0))}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Session Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={50} color={colors.warning} />
            <Text style={styles.modalTitle}>Great Focus Session!</Text>
            
            <View style={styles.sessionStats}>
              <Text style={styles.statLabel}>Duration: {formatDuration(selectedTime * 60)}</Text>
              <Text style={styles.statLabel}>Interruptions: {interruptions}</Text>
              <Text style={styles.statLabel}>Focus Score: {focusScore}/10</Text>
            </View>

            <Text style={styles.modalSubtitle}>Rate your productivity:</Text>
            
            <View style={styles.ratingContainer}>
              {[1,2,3,4,5,6,7,8,9,10].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingBtn,
                    productivityScore === rating && styles.ratingBtnSelected,
                    { borderColor: getProductivityColor(rating) }
                  ]}
                  onPress={() => setProductivityScore(rating)}
                >
                  <Text style={[
                    styles.ratingText,
                    productivityScore === rating && styles.ratingTextSelected
                  ]}>
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowCompletionModal(false);
                  handleReset();
                }}
              >
                <Text style={styles.cancelText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={() => handleSaveSession(productivityScore)}
              >
                <Text style={styles.saveText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}