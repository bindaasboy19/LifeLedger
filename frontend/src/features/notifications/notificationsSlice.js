import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0
  },
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((item) => !item.read).length;
    }
  }
});

export const { setNotifications } = notificationsSlice.actions;

export default notificationsSlice.reducer;
