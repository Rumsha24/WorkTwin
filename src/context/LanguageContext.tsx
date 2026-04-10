import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage =
  | 'English'
  | 'French'
  | 'Spanish'
  | 'Hindi'
  | 'Italian'
  | 'Urdu'
  | 'Chinese';

type TranslationKey =
  | 'home'
  | 'tasks'
  | 'focus'
  | 'insights'
  | 'settings'
  | 'profile'
  | 'change_password'
  | 'login'
  | 'register'
  | 'create_account'
  | 'logout'
  | 'back'
  | 'add'
  | 'cancel'
  | 'close'
  | 'save'
  | 'search_tasks'
  | 'task_templates'
  | 'add_new_task'
  | 'category'
  | 'priority'
  | 'set_due_date'
  | 'set_reminder'
  | 'select_reminder_time'
  | 'notes_optional'
  | 'all'
  | 'pending'
  | 'completed'
  | 'week'
  | 'month'
  | 'year'
  | 'summary'
  | 'recommendation'
  | 'wellness'
  | 'hydrate'
  | 'break'
  | 'breathing'
  | 'session_duration'
  | 'link_to_task'
  | 'quick_presets'
  | 'custom'
  | 'none'
  | 'total_focus'
  | 'total_sessions'
  | 'avg_productivity'
  | 'tasks_done'
  | 'view_productivity_trends'
  | 'hide_productivity_trends'
  | 'last_7_days'
  | 'no_data_yet';

const translations: Record<AppLanguage, Partial<Record<TranslationKey, string>>> = {
  English: {
    home: 'Home',
    tasks: 'Tasks',
    focus: 'Focus',
    insights: 'Insights',
    settings: 'Settings',
    profile: 'Profile',
    change_password: 'Change Password',
    login: 'Login',
    register: 'Register',
    create_account: 'Create Account',
    logout: 'Logout',
    back: 'Back',
    add: 'Add',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    search_tasks: 'Search tasks...',
    task_templates: 'Task Templates',
    add_new_task: 'Add New Task',
    category: 'Category',
    priority: 'Priority',
    set_due_date: 'Set Due Date',
    set_reminder: 'Set Reminder',
    select_reminder_time: 'Select Reminder Time',
    notes_optional: 'Notes (optional)',
    all: 'All',
    pending: 'Pending',
    completed: 'Completed',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    summary: 'Summary',
    recommendation: 'Recommendation',
    wellness: 'Wellness',
    hydrate: 'Hydrate',
    break: 'Break',
    breathing: 'Breathing',
    session_duration: 'Session Duration',
    link_to_task: 'Link to Task',
    quick_presets: 'Quick Presets',
    custom: 'Custom',
    none: 'None',
    total_focus: 'Total Focus',
    total_sessions: 'Total Sessions',
    avg_productivity: 'Avg Productivity',
    tasks_done: 'Tasks Done',
    view_productivity_trends: 'View Productivity Trends',
    hide_productivity_trends: 'Hide Productivity Trends',
    last_7_days: 'Last 7 Days',
    no_data_yet: 'No Data Yet',
  },
  French: {
    home: 'Accueil',
    tasks: 'Taches',
    focus: 'Focus',
    insights: 'Analyses',
    settings: 'Parametres',
    profile: 'Profil',
    change_password: 'Changer le mot de passe',
    login: 'Connexion',
    register: 'Inscription',
    create_account: 'Creer un compte',
    logout: 'Deconnexion',
    back: 'Retour',
    add: 'Ajouter',
    cancel: 'Annuler',
    close: 'Fermer',
    save: 'Enregistrer',
    search_tasks: 'Rechercher des taches...',
    task_templates: 'Modeles de taches',
    add_new_task: 'Ajouter une tache',
    category: 'Categorie',
    priority: 'Priorite',
    set_due_date: 'Definir la date',
    set_reminder: 'Definir un rappel',
    select_reminder_time: 'Choisir l heure du rappel',
    notes_optional: 'Notes (optionnel)',
    all: 'Tout',
    pending: 'En attente',
    completed: 'Termine',
    week: 'Semaine',
    month: 'Mois',
    year: 'Annee',
    summary: 'Resume',
    recommendation: 'Conseil',
    wellness: 'Bien-etre',
    hydrate: 'Hydratation',
    break: 'Pause',
    breathing: 'Respiration',
    session_duration: 'Duree',
    link_to_task: 'Lier a une tache',
    quick_presets: 'Presets rapides',
    custom: 'Personnalise',
    none: 'Aucun',
    total_focus: 'Focus total',
    total_sessions: 'Sessions totales',
    avg_productivity: 'Prod moyenne',
    tasks_done: 'Taches faites',
    view_productivity_trends: 'Voir les tendances',
    hide_productivity_trends: 'Masquer les tendances',
    last_7_days: '7 derniers jours',
    no_data_yet: 'Pas encore de donnees',
  },
  Spanish: {
    home: 'Inicio',
    tasks: 'Tareas',
    focus: 'Enfoque',
    insights: 'Analisis',
    settings: 'Ajustes',
    profile: 'Perfil',
    change_password: 'Cambiar contrasena',
    login: 'Iniciar sesion',
    register: 'Registrarse',
    create_account: 'Crear cuenta',
    logout: 'Cerrar sesion',
    back: 'Atras',
    add: 'Agregar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    save: 'Guardar',
    search_tasks: 'Buscar tareas...',
    task_templates: 'Plantillas de tareas',
    add_new_task: 'Agregar tarea',
    category: 'Categoria',
    priority: 'Prioridad',
    set_due_date: 'Definir fecha',
    set_reminder: 'Definir recordatorio',
    select_reminder_time: 'Elegir hora',
    notes_optional: 'Notas (opcional)',
    all: 'Todo',
    pending: 'Pendiente',
    completed: 'Completado',
    week: 'Semana',
    month: 'Mes',
    year: 'Ano',
    summary: 'Resumen',
    recommendation: 'Recomendacion',
    wellness: 'Bienestar',
    hydrate: 'Hidratar',
    break: 'Descanso',
    breathing: 'Respiracion',
    session_duration: 'Duracion',
    link_to_task: 'Vincular tarea',
    quick_presets: 'Presets rapidos',
    custom: 'Personalizado',
    none: 'Ninguno',
    total_focus: 'Enfoque total',
    total_sessions: 'Sesiones totales',
    avg_productivity: 'Prod media',
    tasks_done: 'Tareas hechas',
    view_productivity_trends: 'Ver tendencias',
    hide_productivity_trends: 'Ocultar tendencias',
    last_7_days: 'Ultimos 7 dias',
    no_data_yet: 'Aun sin datos',
  },
  Hindi: {
    home: 'होम',
    tasks: 'टास्क',
    focus: 'फोकस',
    insights: 'इनसाइट्स',
    settings: 'सेटिंग्स',
    profile: 'प्रोफाइल',
    change_password: 'पासवर्ड बदलें',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    create_account: 'अकाउंट बनाएं',
    logout: 'लॉगआउट',
    back: 'वापस',
  },
  Italian: {
    home: 'Home',
    tasks: 'Attivita',
    focus: 'Focus',
    insights: 'Analisi',
    settings: 'Impostazioni',
    profile: 'Profilo',
    change_password: 'Cambia password',
    login: 'Accedi',
    register: 'Registrati',
    create_account: 'Crea account',
    logout: 'Esci',
    back: 'Indietro',
  },
  Urdu: {
    home: 'ہوم',
    tasks: 'ٹاسکس',
    focus: 'فوکس',
    insights: 'انسائٹس',
    settings: 'سیٹنگز',
    profile: 'پروفائل',
    change_password: 'پاس ورڈ تبدیل کریں',
    login: 'لاگ ان',
    register: 'رجسٹر',
    create_account: 'اکاؤنٹ بنائیں',
    logout: 'لاگ آؤٹ',
    back: 'واپس',
  },
  Chinese: {
    home: '首页',
    tasks: '任务',
    focus: '专注',
    insights: '洞察',
    settings: '设置',
    profile: '个人资料',
    change_password: '更改密码',
    login: '登录',
    register: '注册',
    create_account: '创建账户',
    logout: '退出登录',
    back: '返回',
  },
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (nextLanguage: AppLanguage) => Promise<void>;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('English');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (
          savedLanguage === 'English' ||
          savedLanguage === 'French' ||
          savedLanguage === 'Spanish' ||
          savedLanguage === 'Hindi' ||
          savedLanguage === 'Italian' ||
          savedLanguage === 'Urdu' ||
          savedLanguage === 'Chinese'
        ) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem('app_language', nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key] || translations.English[key] || key,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
