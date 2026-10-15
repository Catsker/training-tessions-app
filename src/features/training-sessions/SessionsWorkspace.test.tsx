import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../test/server.ts'
import { SessionsWorkspace } from './SessionsWorkspace.tsx'

const DAY_MS = 24 * 60 * 60 * 1000

async function findSessionItems() {
  const list = await screen.findByRole('list', { name: 'Sessions' })
  return within(list).getAllByRole('listitem')
}

/** `<input type="datetime-local">` value `offsetMs` from now, in local time. */
function localDateTime(offsetMs: number): string {
  const date = new Date(Date.now() + offsetMs)
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function countPostRequests() {
  const counter = { count: 0 }
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST') counter.count += 1
  })
  return counter
}

async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await findSessionItems()
  await user.click(screen.getByRole('button', { name: 'New session' }))
  return screen.getByRole('form', { name: 'New session' })
}

describe('SessionsWorkspace', () => {
  it('shows a loading state, then the sessions from the API', async () => {
    render(<SessionsWorkspace />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading sessions…')

    const items = await findSessionItems()
    expect(items).toHaveLength(6)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    const yoga = items.find((item) => within(item).queryByText('Yoga for runners'))
    expect(yoga).toBeDefined()
    expect(within(yoga!).getByText('Scheduled')).toBeInTheDocument()
    expect(yoga!.querySelector('time')).toHaveAttribute('datetime')
  })

  it('filters sessions by status and restores the full list with All', async () => {
    const user = userEvent.setup()
    render(<SessionsWorkspace />)
    await findSessionItems()

    await user.selectOptions(screen.getByLabelText('Status'), 'Completed')

    const completed = await findSessionItems()
    expect(completed).toHaveLength(2)
    for (const item of completed) {
      expect(within(item).getByText('Completed')).toBeInTheDocument()
    }

    await user.selectOptions(screen.getByLabelText('Status'), 'All')

    expect(await findSessionItems()).toHaveLength(6)
  })

  it('shows a recoverable error when loading fails and recovers on Retry', async () => {
    server.use(
      http.get('/api/sessions', () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
    )
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Couldn’t load sessions.')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Retry' }))

    expect(await findSessionItems()).toHaveLength(6)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Creating a session', () => {
  it('adds the created session, with a trimmed title, to the visible list', async () => {
    const user = userEvent.setup()
    render(<SessionsWorkspace />)
    await findSessionItems()
    // A filter that would hide a new scheduled session is reset after creation.
    await user.selectOptions(screen.getByLabelText('Status'), 'Completed')

    const form = await openCreateForm(user)
    await user.type(within(form).getByLabelText('Title'), '  Evening stretch  ')
    fireEvent.change(within(form).getByLabelText('Start date and time'), {
      target: { value: localDateTime(2 * DAY_MS) },
    })
    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    const titles = await screen.findAllByText('Evening stretch')
    expect(titles).toHaveLength(1)
    // The text matcher normalizes whitespace, so check the rendered text exactly.
    expect(titles[0].textContent).toBe('Evening stretch')
    expect(await findSessionItems()).toHaveLength(7)
    expect(screen.getByLabelText('Status')).toHaveValue('all')
    expect(screen.queryByRole('form', { name: 'New session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New session' })).toHaveFocus()
  })

  it('shows validation messages and sends nothing for a short title and a past time', async () => {
    const posts = countPostRequests()
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    const form = await openCreateForm(user)
    const titleInput = within(form).getByLabelText('Title')
    await user.type(titleInput, ' ab ')
    fireEvent.change(within(form).getByLabelText('Start date and time'), {
      target: { value: localDateTime(-DAY_MS) },
    })
    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    expect(within(form).getByText('Title must be 3–80 characters.')).toBeInTheDocument()
    expect(within(form).getByText('Choose a date and time in the future.')).toBeInTheDocument()
    expect(titleInput).toHaveAttribute('aria-invalid', 'true')
    expect(titleInput).toHaveFocus()
    expect(posts.count).toBe(0)
    expect(await findSessionItems()).toHaveLength(6)
  })

  it('sends a single request when submit is clicked twice while pending', async () => {
    const posts = countPostRequests()
    let releaseResponse = () => {}
    server.use(
      http.post('/api/sessions', async ({ request }) => {
        const body = (await request.json()) as { title: string; startsAt: string }
        await new Promise<void>((resolve) => {
          releaseResponse = resolve
        })
        return HttpResponse.json(
          { id: 'created-1', title: body.title, status: 'scheduled', startsAt: body.startsAt },
          { status: 201 },
        )
      }),
    )
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    const form = await openCreateForm(user)
    await user.type(within(form).getByLabelText('Title'), 'Hill sprints')
    fireEvent.change(within(form).getByLabelText('Start date and time'), {
      target: { value: localDateTime(DAY_MS) },
    })
    const submit = within(form).getByRole('button', { name: 'Create session' })
    await user.dblClick(submit)
    fireEvent.submit(form)

    expect(await within(form).findByRole('button', { name: 'Creating…' })).toBeDisabled()
    await delay(20)
    expect(posts.count).toBe(1)

    releaseResponse()
    expect(await screen.findByText('Hill sprints')).toBeInTheDocument()
    expect(posts.count).toBe(1)
  })

  it('keeps the form open while a create is pending so a failure is still shown', async () => {
    let failResponse = () => {}
    server.use(
      http.post('/api/sessions', async () => {
        await new Promise<void>((resolve) => {
          failResponse = resolve
        })
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    const form = await openCreateForm(user)
    await user.type(within(form).getByLabelText('Title'), 'Track intervals')
    fireEvent.change(within(form).getByLabelText('Start date and time'), {
      target: { value: localDateTime(DAY_MS) },
    })
    await user.click(within(form).getByRole('button', { name: 'Create session' }))
    await within(form).findByRole('button', { name: 'Creating…' })

    const toggle = screen.getByRole('button', { name: 'New session' })
    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    await user.click(toggle)
    expect(form).toBeInTheDocument()

    failResponse()

    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'Something went wrong on the server. Please try again.',
    )
    expect(within(form).getByLabelText('Title')).toHaveValue('Track intervals')
    expect(toggle).not.toHaveAttribute('aria-disabled')
  })

  it('keeps the entered values and allows resubmitting when creation fails', async () => {
    server.use(
      http.post('/api/sessions', () => new HttpResponse(null, { status: 500 }), { once: true }),
    )
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    const form = await openCreateForm(user)
    await user.type(within(form).getByLabelText('Title'), 'Recovery walk')
    fireEvent.change(within(form).getByLabelText('Start date and time'), {
      target: { value: localDateTime(DAY_MS) },
    })
    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'Something went wrong on the server. Please try again.',
    )
    expect(within(form).getByLabelText('Title')).toHaveValue('Recovery walk')

    await user.click(within(form).getByRole('button', { name: 'Create session' }))

    expect(await screen.findByText('Recovery walk')).toBeInTheDocument()
    expect(await findSessionItems()).toHaveLength(7)
  })
})
