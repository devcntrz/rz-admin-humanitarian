import { sql } from "@/lib/db"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DataTable,
  DataTableBody,
  DataTableEmpty,
  DataTableHead,
  DataTableHeadRow,
  DataTableShell,
  DataTableTh,
} from "@/components/ui/data-table"
import { revalidatePath } from "next/cache"
import AdminRow from "@/components/admin/admin-row"

type Admin = { id: number; full_name: string; email: string; role: string; created_at: string }

async function getAdmins(q?: string) {
  if (q && q.trim() !== "") {
    const like = `%${q.trim()}%`
    return sql<Admin>`
      select id, full_name, email, role, to_char(created_at, 'YYYY-MM-DD') as created_at
      from admins
      where full_name ilike ${like} or email ilike ${like} or role ilike ${like}
      order by id desc limit 100
    `
  }
  return sql<Admin>`
    select id, full_name, email, role, to_char(created_at, 'YYYY-MM-DD') as created_at
    from admins
    order by id desc limit 100
  `
}

async function createAdmin(formData: FormData) {
  "use server"
  const fullName = (formData.get("full_name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const role = (formData.get("role") as string)?.trim()
  if (!fullName || !email || !role) return
  await sql`
    insert into admins (full_name, email, password_hash, role)
    values (${fullName}, ${email}, ${"placeholder_hash"}, ${role})
  `
  revalidatePath("/admin/config/admins")
}

async function updateAdmin(formData: FormData) {
  "use server"
  const id = Number(formData.get("id"))
  const fullName = (formData.get("full_name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const role = (formData.get("role") as string)?.trim()
  if (!id || !fullName || !email || !role) return
  await sql`
    update admins set full_name = ${fullName}, email = ${email}, role = ${role}
    where id = ${id}
  `
  revalidatePath("/admin/config/admins")
}

async function deleteAdmin(formData: FormData) {
  "use server"
  const id = Number(formData.get("id"))
  if (!id) return
  await sql`delete from admins where id = ${id}`
  revalidatePath("/admin/config/admins")
}

export default async function AdminsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q
  const data = await getAdmins(q)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input name="full_name" placeholder="Nama Lengkap" required />
            <Input type="email" name="email" placeholder="Email" required />
            <select name="role" className="border rounded-md p-2" required aria-label="Pilih role admin">
              <option value="">Pilih Role</option>
              <option value="super_admin">Super Admin</option>
              <option value="regional_admin">Regional Admin</option>
              <option value="staff">Staff</option>
            </select>
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex gap-2" method="get">
            <Input name="q" defaultValue={q} placeholder="Cari nama/email/role..." />
            <Button type="submit" variant="secondary">
              Cari
            </Button>
          </form>
          <DataTableShell>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>ID</DataTableTh>
                  <DataTableTh>Nama</DataTableTh>
                  <DataTableTh>Email</DataTableTh>
                  <DataTableTh>Role</DataTableTh>
                  <DataTableTh>Dibuat</DataTableTh>
                  <DataTableTh>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {data.map((a) => (
                  <AdminRow key={a.id} admin={a} updateAction={updateAdmin} deleteAction={deleteAdmin} />
                ))}
                {data.length === 0 && <DataTableEmpty colSpan={6} />}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </CardContent>
      </Card>
    </div>
  )
}
