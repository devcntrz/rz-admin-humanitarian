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
import FieldCoordinatorRow from "@/components/admin/field-coordinator-row"

type FieldCoordinator = {
  id: number
  full_name: string
  phone_number: string | null
  created_at: string
}

async function getFieldCoordinators(q?: string) {
  if (q && q.trim() !== "") {
    const like = `%${q.trim()}%`
    return sql<FieldCoordinator>`
      select id, full_name, phone_number,
        to_char(created_at, 'YYYY-MM-DD') as created_at
      from field_coordinators
      where full_name ilike ${like}
         or coalesce(phone_number, '') ilike ${like}
      order by id desc
      limit 100
    `
  }
  return sql<FieldCoordinator>`
    select id, full_name, phone_number,
      to_char(created_at, 'YYYY-MM-DD') as created_at
    from field_coordinators
    order by id desc
    limit 100
  `
}

async function createFieldCoordinator(formData: FormData) {
  "use server"
  const fullName = (formData.get("full_name") as string)?.trim()
  const phoneNumber = (formData.get("phone_number") as string)?.trim()
  if (!fullName) return
  await sql`
    insert into field_coordinators (full_name, phone_number)
    values (${fullName}, ${phoneNumber || null})
  `
  revalidatePath("/admin/config/field-coordinators")
}

async function updateFieldCoordinator(formData: FormData) {
  "use server"
  const id = Number(formData.get("id"))
  const fullName = (formData.get("full_name") as string)?.trim()
  const phoneNumber = (formData.get("phone_number") as string)?.trim()
  if (!id || !fullName) return
  await sql`
    update field_coordinators
    set full_name = ${fullName}, phone_number = ${phoneNumber || null}
    where id = ${id}
  `
  revalidatePath("/admin/config/field-coordinators")
}

async function deleteFieldCoordinator(formData: FormData) {
  "use server"
  const id = Number(formData.get("id"))
  if (!id) return
  await sql`delete from field_coordinators where id = ${id}`
  revalidatePath("/admin/config/field-coordinators")
}

export default async function FieldCoordinatorsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q
  const data = await getFieldCoordinators(q)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Koordinator Lapangan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFieldCoordinator} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input name="full_name" placeholder="Nama Lengkap" required />
            <Input name="phone_number" placeholder="No. Telepon" />
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Koordinator Lapangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex gap-2" method="get">
            <Input name="q" defaultValue={q} placeholder="Cari nama/telepon..." />
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
                  <DataTableTh>Telepon</DataTableTh>
                  <DataTableTh>Dibuat</DataTableTh>
                  <DataTableTh>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {data.map((c) => (
                  <FieldCoordinatorRow
                    key={c.id}
                    coordinator={c}
                    updateAction={updateFieldCoordinator}
                    deleteAction={deleteFieldCoordinator}
                  />
                ))}
                {data.length === 0 && <DataTableEmpty colSpan={5} />}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </CardContent>
      </Card>
    </div>
  )
}
