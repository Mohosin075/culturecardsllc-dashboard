import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import overviewReducer from "./slices/overviewSlice";
import usersReducer from "./slices/usersSlice";
import sellerVerificationReducer from "./slices/sellerVerificationSlice";
import listingsReducer from "./slices/listingsSlice";
import liveStreamsReducer from "./slices/liveStreamsSlice";
import tradesReducer from "./slices/tradesSlice";
import ordersReducer from "./slices/ordersSlice";
import disputesReducer from "./slices/disputesSlice";
import paymentsReducer from "./slices/paymentsSlice";
import boostedListingsReducer from "./slices/boostedListingsSlice";
import categoriesReducer from "./slices/categoriesSlice";
import notificationsReducer from "./slices/notificationsSlice";
import reportsReducer from "./slices/reportsSlice";
import settingsReducer from "./slices/settingsSlice";
import giveawayReducer from "./slices/giveawaySlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      overview: overviewReducer,
      users: usersReducer,
      sellerVerification: sellerVerificationReducer,
      listings: listingsReducer,
      liveStreams: liveStreamsReducer,
      trades: tradesReducer,
      orders: ordersReducer,
      disputes: disputesReducer,
      payments: paymentsReducer,
      boostedListings: boostedListingsReducer,
      categories: categoriesReducer,
      notifications: notificationsReducer,
      reports: reportsReducer,
      settings: settingsReducer,
      giveaway: giveawayReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
