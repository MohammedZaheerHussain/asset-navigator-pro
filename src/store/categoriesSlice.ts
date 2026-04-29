import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ──────────────────────────────────────────────
   Category Slice — single source of truth for
   the category catalog across the entire app
   ────────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
}

interface CategoriesState {
  items: Category[];
}

const initialState: CategoriesState = {
  items: [
    { id: "CAT-001", name: "Biomedical",          description: "Medical devices and life-support equipment",    status: "active" },
    { id: "CAT-002", name: "IT Equipment",        description: "Computers, scanners, and networking devices",   status: "active" },
    { id: "CAT-003", name: "Furniture",            description: "Beds, tables, chairs, and wheelchairs",         status: "active" },
    { id: "CAT-004", name: "Surgical Instrument", description: "Operating room tools and machines",              status: "active" },
    { id: "CAT-005", name: "Diagnostic",          description: "Imaging and diagnostic equipment",              status: "active" },
    { id: "CAT-006", name: "Other",               description: "Miscellaneous items",                           status: "active" },
  ],
};

/** Generate the next CAT-XXX ID from the current list */
function nextId(items: Category[]): string {
  const nums = items.map((c) => parseInt(c.id.replace("CAT-", ""), 10)).filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `CAT-${String(next).padStart(3, "0")}`;
}

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    addCategory(state, action: PayloadAction<Omit<Category, "id">>) {
      const id = nextId(state.items);
      state.items.push({ id, ...action.payload });
    },
    updateCategory(state, action: PayloadAction<Category>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    deleteCategory(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addCategory, updateCategory, deleteCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;
