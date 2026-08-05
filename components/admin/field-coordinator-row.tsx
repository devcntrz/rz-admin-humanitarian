"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableRow, DataTableTd } from "@/components/ui/data-table"

type FieldCoordinator = {
  id: number
  full_name: string
  phone_number: string | null
  created_at: string
}

type FieldCoordinatorRowProps = {
  coordinator: FieldCoordinator
  updateAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

export default function FieldCoordinatorRow({
  coordinator,
  updateAction,
  deleteAction,
}: FieldCoordinatorRowProps) {
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(coordinator.full_name)
  const [phoneNumber, setPhoneNumber] = useState(coordinator.phone_number || "")

  return (
    <DataTableRow>
      <DataTableTd className="w-[60px]">{coordinator.id}</DataTableTd>
      <DataTableTd>
        {editing ? (
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-8 text-xs" />
        ) : (
          coordinator.full_name
        )}
      </DataTableTd>
      <DataTableTd>
        {editing ? (
          <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-8 text-xs" />
        ) : (
          coordinator.phone_number || "-"
        )}
      </DataTableTd>
      <DataTableTd className="w-[140px]">{coordinator.created_at}</DataTableTd>
      <DataTableTd className="w-[180px]">
        <div className="flex gap-2">
          {editing ? (
            <form
              action={async (formData: FormData) => {
                await updateAction(formData)
                setEditing(false)
              }}
              className="flex gap-2"
            >
              <input type="hidden" name="id" value={coordinator.id} />
              <input type="hidden" name="full_name" value={fullName} />
              <input type="hidden" name="phone_number" value={phoneNumber} />
              <Button type="submit" size="sm">Simpan</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                Batal
              </Button>
            </form>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <form
                action={deleteAction}
                onSubmit={(e) => !confirm("Hapus koordinator lapangan ini?") && e.preventDefault()}
              >
                <input type="hidden" name="id" value={coordinator.id} />
                <Button type="submit" size="sm" variant="outline">
                  Hapus
                </Button>
              </form>
            </>
          )}
        </div>
      </DataTableTd>
    </DataTableRow>
  )
}
