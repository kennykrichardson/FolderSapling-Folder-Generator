
import { useState } from 'react';
import { ArrowRight, Sprout, Github } from 'lucide-react';
import { ParticleField } from './components/ParticleField';
import StructureEditor from './components/StructureEditor';
import TreePreview from './components/TreePreview';
import { parseStructure } from './lib/parser';
import type { TreeNode } from './lib/parser';
import { downloadZip } from './lib/zip';


export default function App() {
  const [structure, setStructure] = useState('');
  const [nodes, setNodes] = useState<TreeNode[]>([]);
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
    <div className="app-shell foldersapling-app">
      <ParticleField />

      <a
        className="sapling-github-link sapling-button-frame sapling-button-frame--compact"
        href="https://github.com/kennykrichardson"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit my GitHub profile"
      >
        <span className="sapling-button">
          <Github size={17} aria-hidden="true" />
          MY GITHUB
        </span>
      </a>

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
            YOUR AI BLUEPRINT MADE REAL, BY            
              <a className="brand" href="/" aria-label="Sapling home">
                <span>SAPLING</span>
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

          <TreePreview
            nodes={nodes}
            onDownload={handleDownload}
            downloadDisabled={nodes.length === 0}
          />
        </section>

        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}

        <footer className="footer">
          Made for builders, one branch at a time,
          By <a href="https://kennykrichardson.onrender.com"
                target="_blank"
                rel="noopener noreferrer">
                KENNY RICHARDSON</a> 🌱.
        </footer>
      </main>
    </div>
  );
}
