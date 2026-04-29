import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { materials as seedMaterials, type Material, type MaterialStatus } from "@/lib/mock-data";

/* ──────────────────────────────────────────────
   Material Slice — single source of truth for
   the material catalog across the entire app
   ────────────────────────────────────────────── */

interface MaterialsState {
  items: Material[];
}

const initialState: MaterialsState = {
  items: seedMaterials,
};

/** Generate the next MAT-XXXX ID from the current list */
function nextId(items: Material[]): string {
  const nums = items.map((m) => parseInt(m.id.replace("MAT-", ""), 10)).filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `MAT-${String(next).padStart(4, "0")}`;
}

const materialsSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {
    addMaterial(state, action: PayloadAction<Omit<Material, "id">>) {
      const id = nextId(state.items);
      state.items.push({ id, ...action.payload });
    },
    updateMaterial(state, action: PayloadAction<Material>) {
      const idx = state.items.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    deleteMaterial(state, action: PayloadAction<string>) {
      state.items = state.items.filter((m) => m.id !== action.payload);
    },
  },
});

export const { addMaterial, updateMaterial, deleteMaterial } = materialsSlice.actions;
export default materialsSlice.reducer;
