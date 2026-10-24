
import { useState } from 'react';
import { ArrowRight, ShieldCheck, Sprout } from 'lucide-react';
import StructureEditor from './components/StructureEditor';
import TreePreview from './components/TreePreview';
import DownloadButton from './components/DownloadButton';
import { parseStructure } from './lib/parser';
import type { TreeNode } from './lib/parser';
import { downloadZip } from './lib/zip';

const starter = `
my-project/
├── src/
│   ├── main.py
│   └── utils.py
├── tests/
│   └── test_main.py
├── README.md
└── requirements.txt
`;

export default function App() {
  const [structure, setStructure] = useState(starter);
  const [nodes, setNodes] = useState<TreeNode[]>(() =>
    parseStructure(starter)
  );
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function handleGenerate() {
    try {
      const parsed = parseStructure(structure);
      setNodes(parsed);
      setError('');
      setMessage('Your project structure is ready.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while parsing.'
      );
      setMessage('');
    }
  }

  async function handleDownload() {
    try {
      await downloadZip(nodes);
      setMessage('Your ZIP download has started.');
      setError('');
    } catch {
      setError('Could not create the ZIP. Please try again.');
      setMessage('');
    }
  }

  return (
    <div className="app-shell">

      <main className="main-content">

        <section className="hero">
          <h1>
            Ideas deserve...
            <span> to take root.</span>
          </h1>

          <div className="hero-tag glass">
            <span className="brand-icon">
              <Sprout size={22} />
            </span>            
              <a className="brand" href="/" aria-label="Sapling home">
                <span>YOUR AI BLUEPRINT MADE REAL, BY SAPLING</span>
              </a>
          </div>
        </section>

        <section className="workspace">
          <StructureEditor
            value={structure}
            onChange={(value) => {
              setStructure(value);
              setError('');
              setMessage('');
            }}
            onGenerate={handleGenerate}
            error={error}
          />

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <TreePreview nodes={nodes} />
        </section>

        <section className="action-bar glass">
          <div className="action-copy">
            <ShieldCheck size={20} />
            <div>
              <strong>Grown on your device.</strong>
              <p>No account. No upload. No nonsense.</p>
            </div>
          </div>

          <DownloadButton
            onDownload={handleDownload}
            disabled={nodes.length === 0}
          />
        </section>

        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}

        <footer className="footer">
          Made for builders, one branch at a time,
          By <a href="https://github.com/kennykrichardson"
                target="_blank"
                rel="noopener noreferrer">
                KENNY RICHARDSON</a> 🌱.
        </footer>
      </main>
    </div>
  );
}
