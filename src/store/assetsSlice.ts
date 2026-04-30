import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { assets as seedAssets, type Asset, type AssetStatus, type WarrantyStatus } from "@/lib/mock-data";

/* ──────────────────────────────────────────────
   Assets Slice — single source of truth for
   the asset registry across the entire app
   ────────────────────────────────────────────── */

interface AssetsState {
  items: Asset[];
  lastCreatedId: string | null;
}

const initialState: AssetsState = {
  items: seedAssets,
  lastCreatedId: null,
};

/** Generate the next AST-XXXX ID from the current list */
function nextId(items: Asset[]): string {
  const nums = items.map((a) => parseInt(a.id.replace("AST-", ""), 10)).filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
  return `AST-${String(next).padStart(4, "0")}`;
}

const assetsSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    addAsset(state, action: PayloadAction<Omit<Asset, "id">>) {
      const id = nextId(state.items);
      state.items.push({ id, ...action.payload });
      state.lastCreatedId = id;
    },
    updateAsset(state, action: PayloadAction<Asset>) {
      const idx = state.items.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    deleteAsset(state, action: PayloadAction<string>) {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
    clearLastCreatedId(state) {
      state.lastCreatedId = null;
    },
  },
});

export const { addAsset, updateAsset, deleteAsset, clearLastCreatedId } = assetsSlice.actions;
export default assetsSlice.reducer;
