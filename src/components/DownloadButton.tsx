import { Download } from 'lucide-react';
import './SaplingButton.css';

type Props = {
  onDownload: () => void;
  disabled: boolean;
};

export default function DownloadButton({
  onDownload,
  disabled,
}: Props) {
  return (
    <div className="sapling-button-frame sapling-button-frame--compact">
      <button
        className="sapling-button"
        onClick={onDownload}
        disabled={disabled}
      >
        <Download size={18} aria-hidden="true" />
        Download ZIP
      </button>
    </div>
  );
}
