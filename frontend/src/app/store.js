import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import { partyBaseApi } from "./api/partyBaseApi";
import authReducer from "./authSlice";
import partyAuthReducer from "./partyAuthSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    partyAuth: partyAuthReducer,
    theme: themeReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [partyBaseApi.reducerPath]: partyBaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware, partyBaseApi.middleware),
});
