"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <tr className="border-t">
      <td className="p-2 w-[60px]">{admin.id}</td>
      <td className="p-2">
        {editing ? (
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        ) : (
          admin.full_name
        )}
      </td>
      <td className="p-2">
        {editing ? (
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        ) : (
          admin.email
        )}
      </td>
      <td className="p-2">
        {editing ? (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border rounded-md p-2 w-full"
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
      </td>
      <td className="p-2 w-[140px]">{admin.created_at}</td>
      <td className="p-2 w-[180px]">
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
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Batal
              </Button>
            </form>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <form action={deleteAction} onSubmit={(e) => !confirm("Hapus admin ini?") && e.preventDefault()}>
                <input type="hidden" name="id" value={admin.id} />
                <Button type="submit" variant="outline">Hapus</Button>
              </form>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}


