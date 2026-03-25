import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  firebaseUser: null,
  token: localStorage.getItem('lifeledger_token') || null,
  profile: null,
  initialized: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setSession(state, action) {
      state.firebaseUser = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      if (action.payload.token) {
        localStorage.setItem('lifeledger_token', action.payload.token);
      }
    },
    clearSession(state) {
      state.firebaseUser = null;
      state.token = null;
      state.profile = null;
      state.error = null;
      localStorage.removeItem('lifeledger_token');
    },
    setProfile(state, action) {
      state.profile = action.payload;
      state.error = null;
    },
    setInitialized(state, action) {
      state.initialized = action.payload;
    },
    setAuthError(state, action) {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setSession,
  clearSession,
  setProfile,
  setInitialized,
  setAuthError
} = authSlice.actions;

export default authSlice.reducer;
