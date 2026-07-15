import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  actor: null, // { type: 'USER'|'ADMIN', id, fullName, email, adminType?, ... }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { accessToken, actor } = action.payload;
      if (accessToken !== undefined) state.accessToken = accessToken;
      if (actor !== undefined) state.actor = actor;
    },
    logout(state) {
      state.accessToken = null;
      state.actor = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentActor = (state) => state.auth.actor;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
