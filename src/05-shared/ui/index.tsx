import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: 'primary' | 'secondary' | 'quiet' | 'danger'
}

export function Button({ kind = 'secondary', className = '', ...props }: ButtonProps) {
  return <button className={`button button--${kind} ${className}`} {...props} />
}

export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className={`dialog ${wide ? 'dialog--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="dialog__header">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function FormActions({
  onCancel,
  busy,
  submitLabel,
}: {
  onCancel: () => void
  busy: boolean
  submitLabel: string
}) {
  return (
    <div className="form-actions">
      <Button type="button" onClick={onCancel}>
        Отмена
      </Button>
      <Button kind="primary" type="submit" disabled={busy}>
        {busy ? 'Сохраняем…' : submitLabel}
      </Button>
    </div>
  )
}
