import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Mission {
  _id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  maxStudents: number;
  totalStudents?: number;
  totalMentors?: number;
  batchId?: {
    _id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  batchId?: {
    _id: string;
    code: string;
  };
  enrollmentDate: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
}

export interface Mentor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  assignedStudents: string[];
  totalStudents: number;
  status: 'active' | 'inactive';
}

export interface MentorshipGroup {
  _id: string;
  name: string;
  mentorId: string;
  studentIds: string[];
  meetingSchedule: string;
  status: 'active' | 'completed';
}

export interface MissionHubState {
  // Missions
  missions: Mission[];
  selectedMission: Mission | null;
  missionsLoading: boolean;
  missionsError: string | null;
  
  // Students
  students: Student[];
  studentsLoading: boolean;
  studentsError: string | null;
  
  // Mentors
  mentors: Mentor[];
  mentorsLoading: boolean;
  mentorsError: string | null;
  
  // Groups
  groups: MentorshipGroup[];
  groupsLoading: boolean;
  groupsError: string | null;
  
  // UI State
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'students' | 'mentors' | 'groups' | 'analytics';
  filters: {
    missionStatus: string;
    studentStatus: string;
    mentorStatus: string;
    searchQuery: string;
  };
}

// Helper function to load selected mission from localStorage
function loadSelectedMissionFromStorage(): Mission | null {
  // Always return null during SSR to prevent hydration mismatch
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem('selectedMission');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the mission structure
      if (parsed && typeof parsed === 'object' && parsed._id && parsed.code && parsed.title) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load selected mission from localStorage:', error);
    localStorage.removeItem('selectedMission'); // Clear invalid data
  }
  
  return null;
}

// Helper function to save selected mission to localStorage
function saveSelectedMissionToStorage(mission: Mission | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (mission) {
      localStorage.setItem('selectedMission', JSON.stringify(mission));
    } else {
      localStorage.removeItem('selectedMission');
    }
  } catch (error) {
    console.error('Failed to save selected mission to localStorage:', error);
  }
}

const initialState: MissionHubState = {
  // Missions
  missions: [],
  selectedMission: null, // Always start with null to prevent hydration mismatch
  missionsLoading: false,
  missionsError: null,
  
  // Students
  students: [],
  studentsLoading: false,
  studentsError: null,
  
  // Mentors
  mentors: [],
  mentorsLoading: false,
  mentorsError: null,
  
  // Groups
  groups: [],
  groupsLoading: false,
  groupsError: null,
  
  // UI State
  sidebarOpen: false,
  currentView: 'dashboard',
  filters: {
    missionStatus: '',
    studentStatus: '',
    mentorStatus: '',
    searchQuery: '',
  },
};

// Async Thunks
export const fetchMissions = createAsyncThunk(
  'missionHub/fetchMissions',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching missions from /api/v2/missions...');
      const response = await fetch('/api/v2/missions');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API response not ok:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📡 API Response:', data);
      
      // The API returns { success: true, data: missions[], pagination: {...} }
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Successfully fetched ${data.data.length} missions:`, data.data);
        return data.data;
      } else {
        console.error('❌ Invalid API response format:', data);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('❌ Error in fetchMissions:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch missions');
    }
  }
);

export const fetchStudents = createAsyncThunk(
  'missionHub/fetchStudents',
  async (missionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v2/missions/${missionId}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      return data.students || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch students');
    }
  }
);

export const fetchMentors = createAsyncThunk(
  'missionHub/fetchMentors',
  async (missionId: string, { rejectWithValue, getState }) => {
    try {
      // Try V2 mission mentors endpoint with query param
      let response = await fetch(`/api/v2/mission-mentors?missionId=${encodeURIComponent(missionId)}&page=1&limit=500&sortBy=currentStudents&sortOrder=desc`);
      if (response.ok) {
        const data = await response.json();
        const list = (data?.data ?? []) as any[];
        // Normalize to Mentor[] shape expected by UI
        return list.map((item) => ({
          _id: item?.mentorId?._id || item?._id,
          name: item?.mentorId?.name ?? item?.name ?? 'Mentor',
          email: item?.mentorId?.email ?? item?.email ?? '',
          specialization: Array.isArray(item?.specialization) ? item.specialization.join(', ') : (item?.specialization ?? ''),
          assignedStudents: item?.assignedStudents ?? [],
          totalStudents: (typeof item?.currentStudents === 'number' ? item.currentStudents : (item?.assignedStudents?.length ?? 0)),
          status: item?.status ?? 'active',
        }));
      }

      // Fallback attempt: query by batchId if available
      const state = getState() as { missionHub: MissionHubState };
      const batchId = state?.missionHub?.selectedMission?.batchId?._id;
      if (batchId) {
        response = await fetch(`/api/v2/mission-mentors?batchId=${encodeURIComponent(batchId)}&page=1&limit=500&sortBy=currentStudents&sortOrder=desc`);
        if (response.ok) {
          const data = await response.json();
          const list = (data?.data ?? []) as any[];
          return list.map((item) => ({
            _id: item?.mentorId?._id || item?._id,
            name: item?.mentorId?.name ?? item?.name ?? 'Mentor',
            email: item?.mentorId?.email ?? item?.email ?? '',
            specialization: Array.isArray(item?.specialization) ? item.specialization.join(', ') : (item?.specialization ?? ''),
            assignedStudents: item?.assignedStudents ?? [],
            totalStudents: (typeof item?.currentStudents === 'number' ? item.currentStudents : (item?.assignedStudents?.length ?? 0)),
            status: item?.status ?? 'active',
          }));
        }
      }

      // Fallback to legacy mission mentors route
      response = await fetch(`/api/mission-mentors/mission/${encodeURIComponent(missionId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }
      const legacy = await response.json();
      const mentors = (legacy?.data?.mentors ?? legacy?.mentors ?? []) as any[];
      return mentors.map((item) => ({
        _id: item?.mentorId?._id || item?._id,
        name: item?.mentorId?.name ?? item?.name ?? 'Mentor',
        email: item?.mentorId?.email ?? item?.email ?? '',
        specialization: Array.isArray(item?.specialization) ? item.specialization.join(', ') : (item?.specialization ?? ''),
        assignedStudents: item?.assignedStudents ?? [],
        totalStudents: (typeof item?.currentStudents === 'number' ? item.currentStudents : (item?.assignedStudents?.length ?? 0)),
        status: item?.status ?? 'active',
      }));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch mentors');
    }
  }
);

export const fetchGroups = createAsyncThunk(
  'missionHub/fetchGroups',
  async (missionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v2/missions/${missionId}/groups`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch groups');
    }
  }
);

// Slice
const missionHubSlice = createSlice({
  name: 'missionHub',
  initialState,
  reducers: {
    // UI Actions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    setCurrentView: (state, action: PayloadAction<MissionHubState['currentView']>) => {
      state.currentView = action.payload;
    },
    
    setSelectedMission: (state, action: PayloadAction<Mission | null>) => {
      state.selectedMission = action.payload;
      // Persist to localStorage
      saveSelectedMissionToStorage(action.payload);
    },
    
    // Filter Actions
    setFilter: (state, action: PayloadAction<{ key: keyof MissionHubState['filters']; value: string }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    
    clearFilters: (state) => {
      state.filters = {
        missionStatus: '',
        studentStatus: '',
        mentorStatus: '',
        searchQuery: '',
      };
    },
    
    // Local State Updates
    addMission: (state, action: PayloadAction<Mission>) => {
      state.missions.push(action.payload);
    },
    
    updateMission: (state, action: PayloadAction<{ id: string; updates: Partial<Mission> }>) => {
      const index = state.missions.findIndex(m => m._id === action.payload.id);
      if (index !== -1) {
        state.missions[index] = { ...state.missions[index], ...action.payload.updates };
      }
    },
    
    removeMission: (state, action: PayloadAction<string>) => {
      state.missions = state.missions.filter(m => m._id !== action.payload);
      if (state.selectedMission?._id === action.payload) {
        state.selectedMission = null;
      }
    },
    
    addStudent: (state, action: PayloadAction<Student>) => {
      state.students.push(action.payload);
    },
    
    updateStudent: (state, action: PayloadAction<{ id: string; updates: Partial<Student> }>) => {
      const index = state.students.findIndex(s => s._id === action.payload.id);
      if (index !== -1) {
        state.students[index] = { ...state.students[index], ...action.payload.updates };
      }
    },
    
    removeStudent: (state, action: PayloadAction<string>) => {
      state.students = state.students.filter(s => s._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Missions
    builder
      .addCase(fetchMissions.pending, (state) => {
        state.missionsLoading = true;
        state.missionsError = null;
      })
      .addCase(fetchMissions.fulfilled, (state, action) => {
        state.missionsLoading = false;
        state.missions = action.payload;
        
        // Only restore from localStorage if no mission is currently selected
        if (!state.selectedMission) {
          // Validate and restore selected mission from localStorage
          const savedMission = loadSelectedMissionFromStorage();
          if (savedMission) {
            // Check if the saved mission still exists in the fetched missions
            const missionExists = action.payload.find(m => m._id === savedMission._id);
            if (missionExists) {
              // Check if the mission is still active (not archived or completed)
              if (missionExists.status === 'active' || missionExists.status === 'draft') {
                // Update the saved mission with fresh data
                state.selectedMission = missionExists;
                saveSelectedMissionToStorage(missionExists);
              } else {
                // Mission is archived/completed, clear it and select first active mission
                console.warn(`Mission ${missionExists.code} is ${missionExists.status}, clearing selection`);
                state.selectedMission = null;
                saveSelectedMissionToStorage(null);
              }
            } else {
              // Saved mission no longer exists, clear it
              console.warn(`Saved mission ${savedMission.code} no longer exists, clearing selection`);
              state.selectedMission = null;
              saveSelectedMissionToStorage(null);
            }
          }
          
          // Auto-select the first active mission if no mission is currently selected
          if (action.payload.length > 0 && !state.selectedMission) {
            // Prefer active missions, then draft missions
            const activeMission = action.payload.find(m => m.status === 'active') || 
                                 action.payload.find(m => m.status === 'draft') || 
                                 action.payload[0];
            
            state.selectedMission = activeMission;
            saveSelectedMissionToStorage(activeMission);
          }
        }
      })
      .addCase(fetchMissions.rejected, (state, action) => {
        state.missionsLoading = false;
        state.missionsError = action.payload as string;
      });
    
    // Students
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.studentsLoading = true;
        state.studentsError = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.studentsError = action.payload as string;
      });
    
    // Mentors
    builder
      .addCase(fetchMentors.pending, (state) => {
        state.mentorsLoading = true;
        state.mentorsError = null;
      })
      .addCase(fetchMentors.fulfilled, (state, action) => {
        state.mentorsLoading = false;
        state.mentors = action.payload;
      })
      .addCase(fetchMentors.rejected, (state, action) => {
        state.mentorsLoading = false;
        state.mentorsError = action.payload as string;
      });
    
    // Groups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.groupsLoading = true;
        state.groupsError = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.groupsLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.groupsLoading = false;
        state.groupsError = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSidebarOpen,
  setCurrentView,
  setSelectedMission,
  setFilter,
  clearFilters,
  addMission,
  updateMission,
  removeMission,
  addStudent,
  updateStudent,
  removeStudent,
} = missionHubSlice.actions;

// Export selectors
export const selectMissions = (state: { missionHub: MissionHubState }) => state.missionHub.missions;
export const selectSelectedMission = (state: { missionHub: MissionHubState }) => state.missionHub.selectedMission;
export const selectMissionsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.missionsLoading;
export const selectMissionsError = (state: { missionHub: MissionHubState }) => state.missionHub.missionsError;

export const selectStudents = (state: { missionHub: MissionHubState }) => state.missionHub.students;
export const selectStudentsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.studentsLoading;
export const selectStudentsError = (state: { missionHub: MissionHubState }) => state.missionHub.studentsError;

export const selectMentors = (state: { missionHub: MissionHubState }) => state.missionHub.mentors;
export const selectMentorsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.mentorsLoading;
export const selectMentorsError = (state: { missionHub: MissionHubState }) => state.missionHub.mentorsError;

export const selectGroups = (state: { missionHub: MissionHubState }) => state.missionHub.groups;
export const selectGroupsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.groupsLoading;
export const selectGroupsError = (state: { missionHub: MissionHubState }) => state.missionHub.groupsError;

export const selectSidebarOpen = (state: { missionHub: MissionHubState }) => state.missionHub.sidebarOpen;
export const selectCurrentView = (state: { missionHub: MissionHubState }) => state.missionHub.currentView;
export const selectFilters = (state: { missionHub: MissionHubState }) => state.missionHub.filters;

export default missionHubSlice.reducer;
