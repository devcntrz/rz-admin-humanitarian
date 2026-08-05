"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableRow, DataTableTd } from "@/components/ui/data-table"

type Admin = { id: number; full_name: string; email: string; role: string; created_at: string }

type AdminRowProps = {
  admin: Admin
  updateAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

export default function AdminRow({ admin, updateAction, deleteAction }: AdminRowProps) {
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(admin.full_name)
  const [email, setEmail] = useState(admin.email)
  const [role, setRole] = useState(admin.role)

  return (
    <DataTableRow>
      <DataTableTd className="w-[60px]">{admin.id}</DataTableTd>
      <DataTableTd>
        {editing ? (
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-8 text-xs" />
        ) : (
          admin.full_name
        )}
      </DataTableTd>
      <DataTableTd>
        {editing ? (
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-8 text-xs" />
        ) : (
          admin.email
        )}
      </DataTableTd>
      <DataTableTd>
        {editing ? (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border rounded-md px-2 py-1.5 w-full text-xs"
            required
            aria-label="Pilih role admin"
          >
            <option value="super_admin">Super Admin</option>
            <option value="regional_admin">Regional Admin</option>
            <option value="staff">Staff</option>
          </select>
        ) : (
          admin.role
        )}
      </DataTableTd>
      <DataTableTd className="w-[140px]">{admin.created_at}</DataTableTd>
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
              <input type="hidden" name="id" value={admin.id} />
              <input type="hidden" name="full_name" value={fullName} />
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="role" value={role} />
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
              <form action={deleteAction} onSubmit={(e) => !confirm("Hapus admin ini?") && e.preventDefault()}>
                <input type="hidden" name="id" value={admin.id} />
                <Button type="submit" size="sm" variant="outline">Hapus</Button>
              </form>
            </>
          )}
        </div>
      </DataTableTd>
    </DataTableRow>
  )
}
