import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { Task, TaskCategory, TaskPriority, CATEGORY_CONFIG } from '../../utils/types';
import { useFirestoreTasks } from '../../hooks/useFirestoreTasks';
import { OfflineStatus } from '../../components/common/OfflineStatus';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskListSkeleton } from '../../components/common/LoadingSkeleton';
import { CategoryBadge } from '../../components/tasks/CategoryBadge';
import { haptics } from '../../utils/haptics';
import { formatDateTime } from '../../utils/storage';

const taskTemplates: Array<{
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  notes: string;
  icon: string;
}> = [
  {
    title: 'Plan today\'s top 3 priorities',
    category: 'work',
    priority: 'high',
    notes: 'Choose the most important tasks before starting focus time.',
    icon: 'flag-outline',
  },
  {
    title: 'Review lecture notes',
    category: 'study',
    priority: 'medium',
    notes: 'Summarize key points and prepare questions.',
    icon: 'school-outline',
  },
  {
    title: 'Take a wellness break',
    category: 'health',
    priority: 'low',
    notes: 'Drink water, stretch, and check in with your mood.',
    icon: 'heart-outline',
  },
];

export default function TaskListScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { tasks, loading, isOnline, addTask, updateTask, deleteTask } = useFirestoreTasks();

  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('work');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scrollY = useState(new Animated.Value(0))[0];

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterCategory !== 'all' && task.category !== filterCategory) {
        return false;
      }
      if (filterPriority !== 'all') {
        if (!task.priority || task.priority !== filterPriority) {
          return false;
        }
      }
      if (filterStatus === 'completed' && !task.done) return false;
      if (filterStatus === 'pending' && task.done) return false;
      return true;
    });
  }, [tasks, searchQuery, filterCategory, filterPriority, filterStatus]);

  const completedCount = useMemo(
    () => filteredTasks.filter((t) => t.done).length,
    [filteredTasks]
  );

  const resetForm = () => {
    setNewTaskTitle('');
    setSelectedCategory('work');
    setSelectedPriority('medium');
    setDueDate(null);
    setReminder(false);
    setReminderTime(null);
    setNotes('');
  };

  const formatPickerDate = (date: Date) =>
    date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  const formatPickerTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const mergeReminderWithDueDate = (timeValue: Date, dateValue?: Date | null) => {
    const next = new Date(dateValue || new Date());
    next.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
    return next;
  };

  const setQuickDueDate = (offsetDays: number) => {
    const next = new Date();
    next.setHours(12, 0, 0, 0);
    next.setDate(next.getDate() + offsetDays);
    setDueDate(next);
    if (reminderTime) {
      setReminderTime(mergeReminderWithDueDate(reminderTime, next));
    }
    setShowDatePicker(false);
    haptics.light();
  };

  const setQuickReminderTime = (hour: number, minute: number) => {
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    setReminder(true);
    setReminderTime(mergeReminderWithDueDate(next, dueDate));
    setShowTimePicker(false);
    haptics.light();
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      haptics.error();
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    const result = await addTask({
      title: newTaskTitle.trim(),
      done: false,
      category: selectedCategory,
      priority: selectedPriority,
      dueDate: dueDate?.getTime() || null,
      reminder,
      reminderTime: reminderTime?.getTime() || null,
      notes: notes.trim() || '',
    });

    if (result) {
      resetForm();
      setModalVisible(false);
      haptics.success();
      Alert.alert('Success', 'Task added');
    } else {
      haptics.error();
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleToggleTask = async (task: Task) => {
    haptics.medium();
    const updated = await updateTask(task.id, { done: !task.done });
    if (updated && !task.done) {
      haptics.taskComplete();
    }
  };

  const handleDeleteTask = (id: string) => {
    haptics.heavy();
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteTask(id);
          if (success) {
            haptics.success();
          } else {
            haptics.error();
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const applyTemplate = (template: (typeof taskTemplates)[number]) => {
    haptics.light();
    setNewTaskTitle(template.title);
    setSelectedCategory(template.category);
    setSelectedPriority(template.priority);
    setNotes(template.notes);
    setReminder(false);
    setDueDate(null);
    setReminderTime(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setModalVisible(true);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: Spacing.lg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    title: { ...Typography.h1, fontSize: 34, color: colors.text },
    sub: { ...Typography.caption, color: colors.textSecondary, marginTop: Spacing.xs },
    syncInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    headerButtons: { flexDirection: 'row', gap: Spacing.sm },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      gap: Spacing.xs,
      ...Shadows.small,
    },
    addText: { color: colors.text, fontWeight: '600', fontSize: 16 },
    filterBtn: {
      backgroundColor: colors.card,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      marginLeft: Spacing.sm,
      fontSize: 16,
      paddingVertical: Spacing.sm,
    },
    templateSection: {
      marginBottom: Spacing.md,
    },
    templateTitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    templateRow: {
      gap: Spacing.sm,
    },
    templateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: Spacing.sm,
    },
    templateChipText: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: '600',
    },
    list: { paddingBottom: Spacing.xl },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      ...Shadows.small,
    },
    taskLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checked: { backgroundColor: colors.primary, borderColor: colors.primary },
    taskContent: { flex: 1 },
    taskTitle: { ...Typography.body, color: colors.text, marginBottom: Spacing.xs },
    taskDone: { textDecorationLine: 'line-through', color: colors.textMuted },
    taskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    metaText: { ...Typography.caption, color: colors.textSecondary, fontSize: 12 },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.xxxl,
      paddingBottom: Spacing.md,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      width: '100%',
      maxHeight: '88%',
      ...Shadows.medium,
    },
    modalScrollContent: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
    modalPanelContent: {
      padding: Spacing.xl,
    },
    modalTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
    modalInput: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      color: colors.text,
      fontSize: 16,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    label: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    categoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.xs,
    },
    categoryBtnSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryText: { color: colors.textSecondary, fontSize: 14 },
    categoryTextSelected: { color: colors.text },
    priorityContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    priorityBtn: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      borderWidth: 2,
      alignItems: 'center',
    },
    priorityBtnSelected: {
      borderWidth: 2,
    },
    priorityText: { fontSize: 14, fontWeight: '600' },
    dateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    dateBtnText: { color: colors.text, fontSize: 14, flex: 1 },
    reminderContainer: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    reminderLabel: { ...Typography.body, flex: 1, color: colors.text },
    timeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.sm,
      gap: Spacing.md,
    },
    timeBtnText: { color: colors.text, fontSize: 14 },
    pickerInlineWrap: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickPickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    pickerChip: {
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerChipText: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveBtn: { backgroundColor: colors.primary },
    cancelText: { color: colors.textSecondary, fontWeight: '600' },
    saveText: { color: colors.text, fontWeight: '600' },

    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    filterOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { color: colors.textSecondary },
    filterTextSelected: { color: colors.text },
  });

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskItem, { borderLeftColor: getPriorityColor(item.priority) }]}
      onPress={() => handleToggleTask(item)}
      onLongPress={() => {
        haptics.longPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.taskLeft}>
        <View style={[styles.checkbox, item.done && styles.checked]}>
          {item.done && <Ionicons name="checkmark" size={16} color={colors.text} />}
        </View>

        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, item.done && styles.taskDone]}>{item.title}</Text>

          <View style={styles.taskMeta}>
            <CategoryBadge category={item.category || 'other'} size="small" showLabel={false} />

            {item.priority && (
              <>
                <Ionicons name="flag-outline" size={14} color={getPriorityColor(item.priority)} />
                <Text style={[styles.metaText, { color: getPriorityColor(item.priority) }]}>
                  {item.priority}
                </Text>
              </>
            )}

            {item.dueDate ? (
              <>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{formatDateTime(item.dueDate)}</Text>
              </>
            ) : null}

            {item.reminder ? (
              <Ionicons name="notifications-outline" size={14} color={colors.primary} />
            ) : null}
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.bg}>
        <View style={styles.container}>
          <TaskListSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.bg}>
      <OfflineStatus />

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('tasks')}</Text>

            <View style={styles.syncInfo}>
              <Text style={styles.sub}>
                {completedCount}/{filteredTasks.length} completed
              </Text>

              {!isOnline ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
                  <Text style={[styles.sub, { color: colors.warning }]}> Offline</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => {
                haptics.light();
                setFilterModalVisible(true);
              }}
            >
              <Ionicons name="filter" size={22} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                haptics.medium();
                setModalVisible(true);
              }}
            >
              <Ionicons name="add" size={24} color={colors.text} />
              <Text style={styles.addText}>{t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_tasks')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.templateSection}>
          <Text style={styles.templateTitle}>{t('task_templates')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateRow}
          >
            {taskTemplates.map((template) => (
              <TouchableOpacity
                key={template.title}
                style={styles.templateChip}
                onPress={() => applyTemplate(template)}
                activeOpacity={0.85}
              >
                <Ionicons name={template.icon as any} size={16} color={colors.primary} />
                <Text style={styles.templateChipText}>{template.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredTasks.length === 0 ? (
          <EmptyState
            icon="checkbox-outline"
            title={t('no_data_yet')}
            message="Tap the + button to create your first task"
            buttonText={t('add_new_task')}
            onButtonPress={() => setModalVisible(true)}
          />
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        )}

        {/* Add Task Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setShowDatePicker(false);
            setShowTimePicker(false);
            resetForm();
          }}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>{t('add_new_task')}</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Task title *"
                placeholderTextColor={colors.textSecondary}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />

              <Text style={styles.label}>{t('category')}</Text>
              <View style={styles.categoryContainer}>
                {(['work', 'personal', 'study', 'health', 'other'] as TaskCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      selectedCategory === cat && styles.categoryBtnSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Ionicons
                      name={CATEGORY_CONFIG[cat].icon as any}
                      size={16}
                      color={selectedCategory === cat ? colors.text : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === cat && styles.categoryTextSelected,
                      ]}
                    >
                      {CATEGORY_CONFIG[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('priority')}</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityBtn,
                      { borderColor: getPriorityColor(priority) },
                      selectedPriority === priority && styles.priorityBtnSelected,
                      selectedPriority === priority && {
                        backgroundColor: getPriorityColor(priority) + '20',
                      },
                    ]}
                    onPress={() => setSelectedPriority(priority)}
                  >
                    <Text style={[styles.priorityText, { color: getPriorityColor(priority) }]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => {
                  setShowTimePicker(false);
                  setShowDatePicker((visible) => !visible);
                }}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.dateBtnText}>
                  {dueDate ? formatPickerDate(dueDate) : t('set_due_date')}
                </Text>
              </TouchableOpacity>
              <View style={styles.quickPickerRow}>
                <TouchableOpacity
                  style={styles.pickerChip}
                  onPress={() => setQuickDueDate(0)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pickerChipText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerChip}
                  onPress={() => setQuickDueDate(1)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pickerChipText}>Tomorrow</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reminderContainer}>
                <View style={styles.reminderRow}>
                  <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                  <Text style={styles.reminderLabel}>{t('set_reminder')}</Text>
                  <Switch
                    value={reminder}
                    onValueChange={(value) => {
                      haptics.switch();
                      setReminder(value);
                      if (!value) {
                        setShowTimePicker(false);
                        setReminderTime(null);
                      } else if (!reminderTime) {
                        setReminderTime(mergeReminderWithDueDate(new Date(), dueDate));
                      }
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.text}
                    ios_backgroundColor={colors.border}
                  />
                </View>

                {reminder ? (
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => {
                      setShowDatePicker(false);
                      setShowTimePicker((visible) => !visible);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <Text style={styles.timeBtnText}>
                      {reminderTime
                        ? formatPickerTime(reminderTime)
                        : t('select_reminder_time')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {reminder ? (
                  <View style={[styles.quickPickerRow, { marginTop: Spacing.sm, marginBottom: 0 }]}>
                    <TouchableOpacity
                      style={styles.pickerChip}
                      onPress={() => setQuickReminderTime(9, 0)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.pickerChipText}>9:00 AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickerChip}
                      onPress={() => setQuickReminderTime(13, 0)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.pickerChipText}>1:00 PM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickerChip}
                      onPress={() => setQuickReminderTime(20, 0)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.pickerChipText}>8:00 PM</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                placeholder={t('notes_optional')}
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              {showDatePicker ? (
                <View style={styles.pickerInlineWrap}>
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    minimumDate={new Date()}
                    onChange={(_, selectedDate) => {
                      if (Platform.OS !== 'ios') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setDueDate(selectedDate);
                        if (reminderTime) {
                          setReminderTime(mergeReminderWithDueDate(reminderTime, selectedDate));
                        }
                      }
                    }}
                  />
                </View>
              ) : null}

              {showTimePicker ? (
                <View style={styles.pickerInlineWrap}>
                  <DateTimePicker
                    value={reminderTime || mergeReminderWithDueDate(new Date(), dueDate)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={(_, selectedDate) => {
                      if (Platform.OS !== 'ios') {
                        setShowTimePicker(false);
                      }
                      if (selectedDate) {
                        setReminderTime(mergeReminderWithDueDate(selectedDate, dueDate));
                      }
                    }}
                  />
                </View>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => {
                    haptics.light();
                    setModalVisible(false);
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleAddTask}
                >
                  <Text style={styles.saveText}>{t('add_new_task')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Filter Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={filterModalVisible}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalPanelContent]}>
              <Text style={styles.modalTitle}>{t('tasks')}</Text>

              <Text style={styles.label}>{t('category')}</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterCategory === 'all' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilterCategory('all')}
                >
                  <Text
                    style={filterCategory === 'all' ? styles.filterTextSelected : styles.filterText}
                  >
                    {t('all')}
                  </Text>
                </TouchableOpacity>

                {(['work', 'personal', 'study', 'health', 'other'] as TaskCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterOption,
                      filterCategory === cat && styles.filterOptionSelected,
                    ]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text
                      style={filterCategory === cat ? styles.filterTextSelected : styles.filterText}
                    >
                      {CATEGORY_CONFIG[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('priority')}</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterPriority === 'all' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilterPriority('all')}
                >
                  <Text
                    style={filterPriority === 'all' ? styles.filterTextSelected : styles.filterText}
                  >
                    {t('all')}
                  </Text>
                </TouchableOpacity>

                {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.filterOption,
                      filterPriority === priority && styles.filterOptionSelected,
                    ]}
                    onPress={() => setFilterPriority(priority)}
                  >
                    <Text
                      style={
                        filterPriority === priority ? styles.filterTextSelected : styles.filterText
                      }
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterStatus === 'all' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text
                    style={filterStatus === 'all' ? styles.filterTextSelected : styles.filterText}
                  >
                    {t('all')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterStatus === 'pending' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilterStatus('pending')}
                >
                  <Text
                    style={
                      filterStatus === 'pending' ? styles.filterTextSelected : styles.filterText
                    }
                  >
                    {t('pending')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterStatus === 'completed' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilterStatus('completed')}
                >
                  <Text
                    style={
                      filterStatus === 'completed' ? styles.filterTextSelected : styles.filterText
                    }
                  >
                    {t('completed')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => {
                    haptics.light();
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelText}>{t('close')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={() => {
                    haptics.success();
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.saveText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
