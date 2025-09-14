import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  
  // Modal and drawer states
  modals: {
    videoForm: boolean;
    channelForm: boolean;
    videoDetail: boolean;
    channelDetail: boolean;
    deleteConfirm: boolean;
  };
  
  // Notification state
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    timestamp: number;
  }>;
  
  // Current page and navigation
  currentPage: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  
  // Search and filters
  globalSearch: string;
  
  // Layout preferences
  videoTableView: 'table' | 'grid';
  channelTableView: 'table' | 'grid';
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Modal actions
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Navigation actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void;
  
  // Search actions
  setGlobalSearch: (search: string) => void;
  
  // View preferences
  setVideoTableView: (view: 'table' | 'grid') => void;
  setChannelTableView: (view: 'table' | 'grid') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: 'system',
        sidebarCollapsed: false,
        modals: {
          videoForm: false,
          channelForm: false,
          videoDetail: false,
          channelDetail: false,
          deleteConfirm: false,
        },
        notifications: [],
        currentPage: '',
        breadcrumbs: [],
        globalSearch: '',
        videoTableView: 'table',
        channelTableView: 'table',
        
        // Theme actions
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        // Modal actions
        openModal: (modal) => 
          set((state) => ({
            modals: { ...state.modals, [modal]: true }
          })),
        closeModal: (modal) =>
          set((state) => ({
            modals: { ...state.modals, [modal]: false }
          })),
        closeAllModals: () =>
          set(() => ({
            modals: {
              videoForm: false,
              channelForm: false,
              videoDetail: false,
              channelDetail: false,
              deleteConfirm: false,
            }
          })),
        
        // Notification actions
        addNotification: (notification) => {
          const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newNotification = {
            ...notification,
            id,
            timestamp: Date.now(),
            duration: notification.duration || (notification.type === 'error' ? 8000 : 5000),
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications]
          }));
          
          // Auto-remove notification after duration
          if (newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
        },
        
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          })),
          
        clearNotifications: () => set({ notifications: [] }),
        
        // Navigation actions
        setCurrentPage: (page) => set({ currentPage: page }),
        setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
        
        // Search actions
        setGlobalSearch: (search) => set({ globalSearch: search }),
        
        // View preferences
        setVideoTableView: (view) => set({ videoTableView: view }),
        setChannelTableView: (view) => set({ channelTableView: view }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          videoTableView: state.videoTableView,
          channelTableView: state.channelTableView,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);

// Stable selector functions to prevent infinite loops
const selectSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;
const selectToggleSidebar = (state: UIState) => state.toggleSidebar;
const selectSetSidebarCollapsed = (state: UIState) => state.setSidebarCollapsed;

// Convenience hooks for specific UI state
export const useTheme = () => useUIStore((state) => state.theme);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useModals = () => useUIStore((state) => state.modals);

// Use separate selectors to avoid object creation on every render
export const useSidebarCollapsed = () => useUIStore(selectSidebarCollapsed);
export const useSidebarToggle = () => useUIStore(selectToggleSidebar);
export const useSidebarSetCollapsed = () => useUIStore(selectSetSidebarCollapsed);

// Combined sidebar hook with stable selectors
export const useSidebar = () => {
  const collapsed = useUIStore(selectSidebarCollapsed);
  const toggle = useUIStore(selectToggleSidebar);
  const setCollapsed = useUIStore(selectSetSidebarCollapsed);
  
  return { collapsed, toggle, setCollapsed };
};