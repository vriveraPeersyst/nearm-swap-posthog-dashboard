interface PeriodSelectorProps<T extends string> {
  periods: T[];
  selected: T;
  onChange: (period: T) => void;
  labels?: Partial<Record<T, string>>;
}

export function PeriodSelector<T extends string>({
  periods,
  selected,
  onChange,
  labels,
}: PeriodSelectorProps<T>) {
  return (
    <div className="inline-flex bg-nm-border rounded-full p-1">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
            selected === period
              ? 'bg-white font-medium text-nm-text shadow-nm'
              : 'font-normal text-nm-text hover:text-nm-text/80'
          }`}
        >
          {labels?.[period] ?? period}
        </button>
      ))}
    </div>
  );
}
