export type AssetStatus = "active" | "maintenance" | "transfer" | "retired";
export type WarrantyStatus = "valid" | "expiring" | "expired";

export interface Branch {
  id: string;
  code: string;
  name: string;
  alias: string;
}

export interface Department {
  id: string;
  branchId: string;
  code: string;
  name: string;
  alias: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  branchId: string;
  departmentId: string;
  room: string;
  make: string;
  model: string;
  serial: string;
  value: number;
  purchaseDate: string;
  warrantyExpiry: string;
  status: AssetStatus;
  warrantyStatus: WarrantyStatus;
  alertEnabled: boolean;
}

export interface Transfer {
  id: string;
  assetId: string;
  assetName: string;
  fromBranch: string;
  fromDept: string;
  toBranch: string;
  toDept: string;
  date: string;
  status: "completed" | "in_transit" | "pending";
}

export type MaterialStatus = "active" | "inactive";

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  status: MaterialStatus;
}

export const units = ["Pcs", "Set", "Box", "Pair", "Roll", "Kit", "Bottle"];

export const branches: Branch[] = [
  { id: "b1", code: "SNHRC-MN", name: "SNHRC Main Hospital", alias: "Main" },
  { id: "b2", code: "SNHRC-NW", name: "SNHRC North Wing", alias: "North" },
  { id: "b3", code: "SNHRC-SC", name: "SNHRC Specialty Center", alias: "Specialty" },
];

export const departments: Department[] = [
  { id: "d1", branchId: "b1", code: "ICU", name: "Intensive Care Unit", alias: "ICU" },
  { id: "d2", branchId: "b1", code: "CARD", name: "Cardiology", alias: "Cardio" },
  { id: "d3", branchId: "b1", code: "RAD", name: "Radiology", alias: "Rad" },
  { id: "d4", branchId: "b2", code: "ER", name: "Emergency", alias: "ER" },
  { id: "d5", branchId: "b2", code: "PED", name: "Pediatrics", alias: "Peds" },
  { id: "d6", branchId: "b3", code: "ONC", name: "Oncology", alias: "Onc" },
  { id: "d7", branchId: "b3", code: "ORT", name: "Orthopedics", alias: "Ortho" },
];

export const roomsByDept: Record<string, string[]> = {
  d1: ["ICU-101", "ICU-102", "ICU-103"],
  d2: ["CR-201", "CR-202"],
  d3: ["RD-301", "RD-302", "RD-303"],
  d4: ["ER-401", "ER-402"],
  d5: ["PD-501"],
  d6: ["ON-601", "ON-602"],
  d7: ["OR-701", "OR-702"],
};

export const categories = [
  "Biomedical",
  "IT Equipment",
  "Furniture",
  "Surgical Instrument",
  "Diagnostic",
  "Other",
];

export const itemsByCategory: Record<string, string[]> = {
  Biomedical: ["Patient Monitor", "Ventilator", "Defibrillator", "Infusion Pump", "ECG Machine"],
  "IT Equipment": ["Workstation PC", "Barcode Scanner", "Label Printer", "Tablet"],
  Furniture: ["Hospital Bed", "Bedside Table", "Wheelchair"],
  "Surgical Instrument": ["Surgical Light", "Anesthesia Machine"],
  Diagnostic: ["Ultrasound", "X-Ray Machine", "MRI Coil"],
  Other: ["Misc Equipment"],
};

export const materials: Material[] = [
  { id: "MAT-0001", name: "Patient Monitor",    category: "Biomedical",          unit: "Pcs", description: "Multi-parameter bedside monitor for ICU",      status: "active" },
  { id: "MAT-0002", name: "Ventilator",          category: "Biomedical",          unit: "Pcs", description: "Mechanical ventilation system",               status: "active" },
  { id: "MAT-0003", name: "Defibrillator",       category: "Biomedical",          unit: "Pcs", description: "Automated external defibrillator",            status: "active" },
  { id: "MAT-0004", name: "Infusion Pump",       category: "Biomedical",          unit: "Pcs", description: "Portable infusion pump for IV therapy",      status: "active" },
  { id: "MAT-0005", name: "ECG Machine",         category: "Biomedical",          unit: "Pcs", description: "12-lead electrocardiogram device",           status: "active" },
  { id: "MAT-0006", name: "Workstation PC",      category: "IT Equipment",        unit: "Pcs", description: "Desktop workstation for clinical use",      status: "active" },
  { id: "MAT-0007", name: "Barcode Scanner",     category: "IT Equipment",        unit: "Pcs", description: "Handheld barcode reader for asset tagging",  status: "active" },
  { id: "MAT-0008", name: "Hospital Bed",        category: "Furniture",           unit: "Pcs", description: "Electric adjustable hospital bed",          status: "active" },
  { id: "MAT-0009", name: "Wheelchair",          category: "Furniture",           unit: "Pcs", description: "Standard folding wheelchair",               status: "active" },
  { id: "MAT-0010", name: "Surgical Light",      category: "Surgical Instrument", unit: "Set", description: "Ceiling-mounted LED surgical light",        status: "active" },
  { id: "MAT-0011", name: "Ultrasound",          category: "Diagnostic",          unit: "Pcs", description: "Portable diagnostic ultrasound system",     status: "active" },
  { id: "MAT-0012", name: "X-Ray Machine",       category: "Diagnostic",          unit: "Pcs", description: "Digital radiography system",               status: "active" },
];

export const assets: Asset[] = [
  { id: "AST-1001", name: "Patient Monitor PM-X", category: "Biomedical", branchId: "b1", departmentId: "d1", room: "ICU-101", make: "Philips", model: "MX450", serial: "PHL-948271", value: 8500, purchaseDate: "2023-03-12", warrantyExpiry: "2026-03-12", status: "active", warrantyStatus: "valid", alertEnabled: true },
  { id: "AST-1002", name: "Ventilator V60", category: "Biomedical", branchId: "b1", departmentId: "d1", room: "ICU-102", make: "Philips", model: "V60", serial: "PHL-553120", value: 21000, purchaseDate: "2021-09-05", warrantyExpiry: "2025-05-15", status: "active", warrantyStatus: "expiring", alertEnabled: true },
  { id: "AST-1003", name: "Defibrillator HeartStart", category: "Biomedical", branchId: "b2", departmentId: "d4", room: "ER-401", make: "Philips", model: "HS1", serial: "PHL-771234", value: 3200, purchaseDate: "2020-06-20", warrantyExpiry: "2024-06-20", status: "maintenance", warrantyStatus: "expired", alertEnabled: true },
  { id: "AST-1004", name: "Ultrasound Affiniti", category: "Diagnostic", branchId: "b1", departmentId: "d3", room: "RD-301", make: "Philips", model: "Affiniti 70", serial: "PHL-110984", value: 45000, purchaseDate: "2022-11-02", warrantyExpiry: "2027-11-02", status: "active", warrantyStatus: "valid", alertEnabled: false },
  { id: "AST-1005", name: "Infusion Pump", category: "Biomedical", branchId: "b3", departmentId: "d6", room: "ON-601", make: "BBraun", model: "Infusomat", serial: "BBR-220019", value: 1800, purchaseDate: "2024-01-15", warrantyExpiry: "2026-01-15", status: "transfer", warrantyStatus: "valid", alertEnabled: true },
  { id: "AST-1006", name: "Hospital Bed Electric", category: "Furniture", branchId: "b2", departmentId: "d5", room: "PD-501", make: "Stryker", model: "S3", serial: "STR-451221", value: 4200, purchaseDate: "2019-04-10", warrantyExpiry: "2023-04-10", status: "active", warrantyStatus: "expired", alertEnabled: false },
  { id: "AST-1007", name: "ECG Machine", category: "Biomedical", branchId: "b1", departmentId: "d2", room: "CR-201", make: "GE", model: "MAC 2000", serial: "GE-882210", value: 5600, purchaseDate: "2023-08-21", warrantyExpiry: "2025-08-21", status: "active", warrantyStatus: "expiring", alertEnabled: true },
  { id: "AST-1008", name: "Workstation PC", category: "IT Equipment", branchId: "b3", departmentId: "d7", room: "OR-701", make: "Dell", model: "OptiPlex 7090", serial: "DEL-99021", value: 1200, purchaseDate: "2022-02-14", warrantyExpiry: "2025-02-14", status: "retired", warrantyStatus: "expired", alertEnabled: false },
  { id: "AST-1009", name: "X-Ray Machine", category: "Diagnostic", branchId: "b1", departmentId: "d3", room: "RD-302", make: "Siemens", model: "Multix Impact", serial: "SIE-330128", value: 78000, purchaseDate: "2021-12-01", warrantyExpiry: "2026-12-01", status: "active", warrantyStatus: "valid", alertEnabled: true },
  { id: "AST-1010", name: "Anesthesia Machine", category: "Surgical Instrument", branchId: "b3", departmentId: "d7", room: "OR-702", make: "Drager", model: "Fabius Plus", serial: "DRG-110982", value: 32000, purchaseDate: "2020-10-30", warrantyExpiry: "2025-10-30", status: "active", warrantyStatus: "expiring", alertEnabled: true },
];

export const transfers: Transfer[] = [
  { id: "TRF-501", assetId: "AST-1005", assetName: "Infusion Pump", fromBranch: "SNHRC Specialty Center", fromDept: "Oncology", toBranch: "SNHRC Main Hospital", toDept: "ICU", date: "2025-04-18", status: "in_transit" },
  { id: "TRF-500", assetId: "AST-1003", assetName: "Defibrillator HeartStart", fromBranch: "SNHRC Main Hospital", fromDept: "Cardiology", toBranch: "SNHRC North Wing", toDept: "Emergency", date: "2025-04-10", status: "completed" },
  { id: "TRF-499", assetId: "AST-1007", assetName: "ECG Machine", fromBranch: "SNHRC North Wing", fromDept: "Emergency", toBranch: "SNHRC Main Hospital", toDept: "Cardiology", date: "2025-03-29", status: "completed" },
];

export const recentActivity = [
  { id: 1, action: "Asset Added", target: "X-Ray Machine", user: "Dr. Mehta", time: "2h ago" },
  { id: 2, action: "Warranty Alert", target: "Ventilator V60", user: "System", time: "4h ago" },
  { id: 3, action: "Transfer Initiated", target: "Infusion Pump", user: "Nurse Anita", time: "6h ago" },
  { id: 4, action: "Maintenance Scheduled", target: "Defibrillator HeartStart", user: "Biomed Team", time: "1d ago" },
  { id: 5, action: "Asset Retired", target: "Workstation PC", user: "IT Admin", time: "2d ago" },
];

export const branchById = (id: string) => branches.find((b) => b.id === id);
export const deptById = (id: string) => departments.find((d) => d.id === id);
export const materialById = (id: string) => materials.find((m) => m.id === id);
