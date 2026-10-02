export type CodeStatus = "reanimacao_plena" | "onr" | "conforto";

export const CODE_STATUS_OPTIONS: {
  value: CodeStatus;
  label: string;
  emoji: string;
  restricted: boolean;
}[] = [
  { value: "reanimacao_plena", label: "Reanimação plena", emoji: "🫀", restricted: false },
  { value: "onr", label: "Não reanimar (ONR)", emoji: "🔴", restricted: true },
  {
    value: "conforto",
    label: "Cuidados de conforto exclusivos",
    emoji: "🔴",
    restricted: true,
  },
];

export function codeStatusLabel(status: CodeStatus): string {
  return CODE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function isRestrictedCodeStatus(status: CodeStatus): boolean {
  return status !== "reanimacao_plena";
}
