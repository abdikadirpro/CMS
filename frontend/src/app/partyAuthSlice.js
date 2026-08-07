import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  actor: null, // { type: 'PARTY_ADMIN'|'MEMBER', id, fullName, email, ... } — one shared session
  // for both Xisbiga Barwaaqo actor types, same as the main app's authSlice covers USER|ADMIN.
};

const partyAuthSlice = createSlice({
  name: "partyAuth",
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

export const { setCredentials, logout } = partyAuthSlice.actions;
export default partyAuthSlice.reducer;

export const selectCurrentPartyAdmin = (state) => state.partyAuth.actor;
export const selectPartyAccessToken = (state) => state.partyAuth.accessToken;
export const selectIsPartyAuthenticated = (state) => Boolean(state.partyAuth.accessToken);
