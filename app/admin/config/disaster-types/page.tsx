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
  DataTableRow,
  DataTableShell,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/data-table"
import { revalidatePath } from "next/cache"

type DisasterType = { id: number; name: string }

async function getDisasterTypes(q?: string) {
  if (q && q.trim() !== "") {
    const like = `%${q.trim()}%`
    return sql<DisasterType>`select id, name from disaster_types where name ilike ${like} order by name`
  }
  return sql<DisasterType>`select id, name from disaster_types order by name`
}

async function createDisasterType(formData: FormData) {
  "use server"
  const name = (formData.get("name") as string)?.trim()
  if (!name) return
  await sql`insert into disaster_types (name) values (${name})`
  revalidatePath("/admin/config/disaster-types")
}

export default async function DisasterTypesPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q
  const data = await getDisasterTypes(q)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Jenis Bencana</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDisasterType} className="flex gap-3">
            <Input name="name" placeholder="Nama Jenis Bencana" required />
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Jenis Bencana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex gap-2" method="get">
            <Input name="q" defaultValue={q} placeholder="Cari nama..." />
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
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {data.map((d) => (
                  <DataTableRow key={d.id}>
                    <DataTableTd>{d.id}</DataTableTd>
                    <DataTableTd>{d.name}</DataTableTd>
                  </DataTableRow>
                ))}
                {data.length === 0 && <DataTableEmpty colSpan={2} />}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </CardContent>
      </Card>
    </div>
  )
}
