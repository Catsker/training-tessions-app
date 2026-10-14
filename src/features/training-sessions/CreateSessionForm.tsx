import { useId, useRef, useState, type FormEvent } from 'react'
import { ApiError } from './api/http.ts'
import { createSession } from './api/sessionsApi.ts'
import { toDateTimeLocalValue } from './format.ts'
import type { Session } from './types.ts'
import {
  hasErrors,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  toCreateSessionInput,
  validateCreateSession,
  type CreateSessionErrors,
} from './validation.ts'

const FALLBACK_ERROR_MESSAGE = 'Couldn’t create the session. Please try again.'

interface CreateSessionFormProps {
  onCreated: (session: Session) => void
  onCancel: () => void
  /** Reports when a create request starts and when it fails; on success the parent closes the form. */
  onPendingChange: (isPending: boolean) => void
}

export function CreateSessionForm({ onCreated, onCancel, onPendingChange }: CreateSessionFormProps) {
  const id = useId()
  const titleId = `${id}-title`
  const startsAtId = `${id}-starts-at`

  const [title, setTitle] = useState('')
  const [startsAtLocal, setStartsAtLocal] = useState('')
  const [errors, setErrors] = useState<CreateSessionErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Browser hint only; validation compares against the time of submit.
  const [minStartsAt] = useState(() => toDateTimeLocalValue(new Date()))

  // Guards against a second submit before the disabled state renders.
  const isSubmittingRef = useRef(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const startsAtInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmittingRef.current) return

    const values = { title, startsAtLocal }
    const nextErrors = validateCreateSession(values, new Date())
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      const firstInvalid = nextErrors.title ? titleInputRef.current : startsAtInputRef.current
      firstInvalid?.focus()
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    onPendingChange(true)

    try {
      const session = await createSession(toCreateSessionInput(values))
      onCreated(session)
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : FALLBACK_ERROR_MESSAGE)
      isSubmittingRef.current = false
      setIsSubmitting(false)
      onPendingChange(false)
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit} noValidate aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`}>New session</h3>

      <div className="field">
        <label htmlFor={titleId}>Title</label>
        <input
          ref={titleInputRef}
          id={titleId}
          name="title"
          type="text"
          autoComplete="off"
          autoFocus
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setErrors((current) => ({ ...current, title: undefined }))
          }}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${titleId}-hint ${titleId}-error` : `${titleId}-hint`}
        />
        <p id={`${titleId}-hint`} className="field-hint">
          {TITLE_MIN_LENGTH}–{TITLE_MAX_LENGTH} characters.
        </p>
        {errors.title ? (
          <p id={`${titleId}-error`} className="field-error">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor={startsAtId}>Start date and time</label>
        <input
          ref={startsAtInputRef}
          id={startsAtId}
          name="startsAt"
          type="datetime-local"
          min={minStartsAt}
          value={startsAtLocal}
          onChange={(event) => {
            setStartsAtLocal(event.target.value)
            setErrors((current) => ({ ...current, startsAt: undefined }))
          }}
          aria-invalid={errors.startsAt ? true : undefined}
          aria-describedby={errors.startsAt ? `${startsAtId}-error` : undefined}
        />
        {errors.startsAt ? (
          <p id={`${startsAtId}-error`} className="field-error">
            {errors.startsAt}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
