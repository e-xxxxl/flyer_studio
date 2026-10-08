import { Plus } from 'lucide-react'
import { useState } from 'react'
import { FlyerCard } from '../components/cards'
import { startFlyer } from '../components/Shell'
import { Button, ConfirmDialog, EmptyState, PageHeader, useToast } from '../components/ui'
import { deleteFlyer, saveFlyer, useFlyers, getCutout, type FlyerMeta } from '../lib/flyerDb'
import { newId } from '../lib/stores'

export async function duplicateFlyer(f: FlyerMeta): Promise<string> {
  const id = newId()
  const now = Date.now()
  const cut = await getCutout(f.id).catch(() => undefined)
  await saveFlyer(
    { ...f, id, label: `${f.label} copy`, createdAt: now, updatedAt: now },
    cut ? { url: cut.url, aspect: cut.aspect, rect: cut.rect } : null,
  )
  return id
}

export default function FlyersPage() {
  const { flyers, ready } = useFlyers()
  const toast = useToast()
  const [removing, setRemoving] = useState<FlyerMeta | null>(null)

  return (
    <>
      <PageHeader
        title="Flyers"
        subtitle={ready && flyers.length > 0 ? `${flyers.length} saved ${flyers.length === 1 ? 'flyer' : 'flyers'}` : undefined}
        actions={
          flyers.length > 0 ? (
            <Button variant="primary" className="hidden lg:inline-flex" onClick={startFlyer}>
              <Plus className="size-4" aria-hidden /> Create Flyer
            </Button>
          ) : undefined
        }
      />

      {!ready ? null : flyers.length === 0 ? (
        <EmptyState
          title="No saved flyers yet"
          body="Create your first flyer to get started. It is saved here so you can edit and export it again."
          action={
            <Button variant="primary" className="hidden lg:inline-flex" onClick={startFlyer}>
              <Plus className="size-4" aria-hidden /> Create Flyer
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {flyers.map((f) => (
            <li key={f.id}>
              <FlyerCard
                flyer={f}
                onDuplicate={async () => {
                  await duplicateFlyer(f)
                  toast('Flyer duplicated.')
                }}
                onDelete={() => setRemoving(f)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!removing}
        title="Delete this flyer?"
        body={removing ? `"${removing.label}" will be removed from this device. This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) await deleteFlyer(removing.id)
          setRemoving(null)
          toast('Flyer deleted.')
        }}
      />
    </>
  )
}
