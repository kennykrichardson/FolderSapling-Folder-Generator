
import { Download } from 'lucide-react';

type Props = {
  onDownload: () => void;
  disabled: boolean;
};

export default function DownloadButton({
  onDownload,
  disabled,
}: Props) {
  return (
    <button
      className="download-button"
      onClick={onDownload}
      disabled={disabled}
    >
      <Download size={18} />
      Download ZIP
    </button>
  );
}
