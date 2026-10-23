
import { File, Folder, FolderOpen } from 'lucide-react';
import type { TreeNode } from '../lib/parser';

type Props = {
  nodes: TreeNode[];
};

function TreeItem({ node, depth = 0 }: {
  node: TreeNode;
  depth?: number;
}) {
  const isDirectory = node.type === 'directory';

  return (
    <div>
      <div
        className="tree-item"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {isDirectory ? (
          node.children.length > 0
            ? <FolderOpen size={17} className="folder-icon" />
            : <Folder size={17} className="folder-icon" />
        ) : (
          <File size={16} className="file-icon" />
        )}

        <span>{node.name}</span>
        {isDirectory && (
          <span className="tree-count">
            {node.children.length || ''}
          </span>
        )}
      </div>

      {node.children.map((child, index) => (
        <TreeItem
          key={`${child.name}-${index}`}
          node={child}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function TreePreview({ nodes }: Props) {
  const count = (items: TreeNode[]): number =>
    items.reduce(
      (total, node) =>
        total + 1 + count(node.children),
      0
    );

  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">02 / PREVIEW</span>
          <h2>Your little forest</h2>
        </div>
        <span className="file-count">
          {count(nodes)} items
        </span>
      </div>

      {nodes.length === 0 ? (
        <div className="empty-state">
          <SproutPlaceholder />
          <p>Your project tree will appear here.</p>
        </div>
      ) : (
        <div className="tree-list">
          {nodes.map((node, index) => (
            <TreeItem
              key={`${node.name}-${index}`}
              node={node}
            />
          ))}
        </div>
      )}

      <div className="preview-footer">
        <span className="status-dot" />
        <span>Ready to grow</span>
      </div>
    </section>
  );
}

function SproutPlaceholder() {
  return (
    <div className="empty-sprout">
      <Folder size={30} />
    </div>
  );
}
