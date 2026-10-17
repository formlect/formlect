import {
  AlignLeftIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  CircleDotIcon,
  ListChecksIcon,
  ToggleLeftIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react"

// Matches the API enum in apps/api/src/api/form/formModel.ts (FormElementSchema.type)
export type FieldType =
  | "shortAnswer"
  | "longAnswer"
  | "multipleChoice"
  | "dropdown"
  | "checkbox"
  | "multiSelect"
  | "switch"

export const FIELD_TYPES: Record<FieldType, { label: string; icon: LucideIcon }> = {
  shortAnswer: { label: "Short answer", icon: TypeIcon },
  longAnswer: { label: "Long answer", icon: AlignLeftIcon },
  multipleChoice: { label: "Multiple choice", icon: CircleDotIcon },
  dropdown: { label: "Dropdown", icon: ChevronDownIcon },
  checkbox: { label: "Checkbox", icon: CheckSquareIcon },
  multiSelect: { label: "Multi select", icon: ListChecksIcon },
  switch: { label: "Switch", icon: ToggleLeftIcon },
}
