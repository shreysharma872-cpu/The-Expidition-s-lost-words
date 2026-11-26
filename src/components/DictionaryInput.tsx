type Props = {
  value: string;
  onChange: (value: string) => void;
  count: number;
};

export default function DictionaryInput({ value, onChange, count }: Props) {
  return (
    <div className="field">
      <label htmlFor="dictionary">
        Dictionary <span className="muted">({count.toLocaleString()} unique words)</span>
      </label>
      <textarea
        id="dictionary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        spellCheck={false}
        placeholder={"One word per line, or separated by commas or spaces"}
      />
    </div>
  );
}
