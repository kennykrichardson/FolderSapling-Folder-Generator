
import { Sprout } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
      <a className="brand" href="/" aria-label="Sapling home">
        <span className="brand-icon">
          <Sprout size={22} />
        </span>
        <span>Sapling<span className="brand-period">.</span></span>
      </a>

      <span className="header-label">
        From structure to starter project
      </span>
    </header>
  );
}
