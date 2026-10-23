
import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Header from './components/Header';
import StructureEditor from './components/StructureEditor';
import TreePreview from './components/TreePreview';
import DownloadButton from './components/DownloadButton';
import { parseStructure } from './lib/parser';
import type { TreeNode } from './lib/parser';
import { downloadZip } from './lib/zip';

const starter = `my-project/
├── src/
│   ├── main.py
│   └── utils.py
├── tests/
│   └── test_main.py
├── README.md
└── requirements.txt`;

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
      <Header />

      <main className="main-content">
        <section className="hero">
          <div className="hero-tag">
            <span className="status-dot" />
            YOUR AI BLUEPRINT, MADE REAL
          </div>

          <h1>
            Ideas deserve
            <br />
            <span>to take root.</span>
          </h1>

          <p className="hero-description">
            Turn AI-generated folder structures into real
            project files. No tedious setup. Just paste,
            grow, and get building.
          </p>
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

        <section className="action-bar">
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
          Made for builders, one branch at a time. 🌱
        </footer>
      </main>
    </div>
  );
}
