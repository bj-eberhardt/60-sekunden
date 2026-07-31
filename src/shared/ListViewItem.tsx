import type { ReactNode } from 'react';

type ListViewItemProps = {
  id?: string;
  testId?: string;
  contentTestId?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  muted?: boolean;
  onSelect?: () => void;
};

export function ListViewItem({
  id,
  testId,
  contentTestId,
  title,
  subtitle,
  meta,
  actions,
  muted = false,
  onSelect,
}: ListViewItemProps) {
  const content = (
    <>
      <span>{title}</span>
      {subtitle ? <small>{subtitle}</small> : null}
      {meta ? <span className="list-view-item-meta">{meta}</span> : null}
    </>
  );

  return (
    <article
      className={`list-view-item ${muted ? 'list-view-item-muted' : ''}`}
      data-muted={muted ? 'true' : 'false'}
      data-testid={testId}
      id={id}
      role="listitem"
    >
      {onSelect ? (
        <button
          className="list-view-item-content"
          data-testid={contentTestId}
          type="button"
          onClick={onSelect}
        >
          {content}
        </button>
      ) : (
        <div className="list-view-item-content" data-testid={contentTestId}>
          {content}
        </div>
      )}
      {actions ? <div className="list-view-item-actions">{actions}</div> : null}
    </article>
  );
}
