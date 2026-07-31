import type { ReactNode } from 'react';

type BlockProps = {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
};

export function Block({ title, actions, children, ariaLabel }: BlockProps) {
  return (
    <section className="screen-panel catalog-form" aria-label={ariaLabel}>
      {title || actions ? (
        <div className="section-title-row">
          {title ? <h2>{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
