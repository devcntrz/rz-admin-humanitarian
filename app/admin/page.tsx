import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sql } from "@/lib/db"

async function getCounts() {
  const [v, s, d] = await Promise.all([
    sql<{ count: number }>`select count(*)::int as count from volunteers`,
    sql<{ count: number }>`select count(*)::int as count from site_reports`,
    sql<{ count: number }>`select count(*)::int as count from distribution_reports`,
  ])
  return {
    volunteers: v[0]?.count ?? 0,
    siteReports: s[0]?.count ?? 0,
    distributions: d[0]?.count ?? 0,
  }
}

export default async function AdminDashboardPage() {
  const counts = await getCounts()
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.volunteers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Situation Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.siteReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.distributions}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
