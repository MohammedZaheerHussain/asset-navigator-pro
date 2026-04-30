import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import materialsReducer from "./materialsSlice";
import categoriesReducer from "./categoriesSlice";
import assetsReducer from "./assetsSlice";

/* ──────────────────────────────────────────────
   SNHRC Redux Store
   ────────────────────────────────────────────── */

export const store = configureStore({
  reducer: {
    materials: materialsReducer,
    categories: categoriesReducer,
    assets: assetsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Typed hooks — use these instead of plain useSelector / useDispatch */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
