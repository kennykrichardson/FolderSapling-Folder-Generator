
import { ClipboardPaste, Sparkles } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  error: string;
};

export default function StructureEditor({
  value,
  onChange,
  onGenerate,
  error,
}: Props) {
  return (
    <section className="panel editor-panel glass">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">01 / INPUT</span>
          <h2>Your structure</h2>
        </div>
        <ClipboardPaste size={19} />
      </div>

      <p className="muted">
      </p>

      <textarea
        className="structure-input glass"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'my-project/\n├── src/\n│   ├── main.py\n│   └── utils.py\n└── README.md'}
        spellCheck={false}
        aria-label="Project folder structure"
      />

      {error && <p className="error-message">{error}</p>}

      <button
        className="primary-button"
        onClick={onGenerate}
        disabled={!value.trim()}
      >
        <Sparkles size={17} />
        Grow my project
      </button>
    </section>
  );
}
