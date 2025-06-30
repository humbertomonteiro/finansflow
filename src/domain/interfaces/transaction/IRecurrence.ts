export type ExcludedFixeds = {
  year: number;
  month: number;
};

export interface IRecurrence {
  endDate?: Date;
  installmentsCount?: number;
  excludedInstallments?: number[];
  excludedFixeds?: ExcludedFixeds[];
}
