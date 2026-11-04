import { useState, type FormEvent } from 'react'
import type { Site } from '../../../../04-entities/object/model/types'
import { saveObject } from '../../../../04-entities/object/api/objects'
import { errorMessage } from '../../../../05-shared/lib/format'
import { Dialog, FormActions } from '../../../../05-shared/ui'

export function ObjectFormDialog({
  object,
  onClose,
  onSaved,
}: {
  object?: Site
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(object?.name ?? '')
  const [address, setAddress] = useState(object?.address ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveObject({ name: name.trim(), address: address.trim() }, object?.id)
      onSaved()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={object ? 'Изменить объект' : 'Новый объект'} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          <span>Название</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={160}
          />
        </label>
        <label className="field">
          <span>Адрес</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            maxLength={240}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <FormActions
          onCancel={onClose}
          busy={busy}
          submitLabel={object ? 'Сохранить' : 'Создать объект'}
        />
      </form>
    </Dialog>
  )
}
