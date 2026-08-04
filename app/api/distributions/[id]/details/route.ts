import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      
      if (isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID format' },
          { status: 400 }
        )
      }

      // Ambil data utama distribution report
      const distributionReport = await sql`
        SELECT 
          dr.*,
          to_char(dr.event_date, 'YYYY-MM-DD') as event_date,
          v.full_name as volunteer_name,
          v.email as volunteer_email,
          v.phone_number as volunteer_phone,
          d.name as disaster_name,
          vill.name as village_name,
          dist.name as district_name,
          reg.name as regency_name,
          prov.name as province_name
        FROM distribution_reports dr
        LEFT JOIN volunteers v ON v.id = dr.pic_volunteer_id
        LEFT JOIN disaster_types d ON d.id = dr.disaster_type_id
        LEFT JOIN villages vill ON vill.id = dr.village_id
        LEFT JOIN districts dist ON dist.id = vill.district_id
        LEFT JOIN regencies reg ON reg.id = dist.regency_id
        LEFT JOIN provinces prov ON prov.id = reg.province_id
        WHERE dr.id = ${distributionId}
      `

      if (distributionReport.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Distribution report not found' },
          { status: 404 }
        )
      }

      // Ambil semua detail dalam satu query menggunakan UNION
      const details = await sql`
        -- Clusters
        SELECT 
          'cluster' as type,
          id,
          cluster_name as name,
          program_name as program,
          quantity as count,
          unit,
          description
        FROM dr_clusters 
        WHERE distribution_report_id = ${distributionId}
        
        UNION ALL
        
        -- Partners
        SELECT 
          'partner' as type,
          id,
          partner_name as name,
          NULL as program,
          NULL as count,
          NULL as unit,
          description
        FROM dr_partners 
        WHERE distribution_report_id = ${distributionId}
        
        ORDER BY type, id
      `

      // Ambil documents terpisah karena strukturnya berbeda
      const documents = await sql`
        SELECT id, file_url, description
        FROM dr_documentations
        WHERE distribution_report_id = ${distributionId}
        ORDER BY id ASC
      `

      // Group details berdasarkan type
      const groupedDetails = {
        clusters: details.filter(d => d.type === 'cluster'),
        partners: details.filter(d => d.type === 'partner')
      }

      return NextResponse.json({
        success: true,
        data: {
          distributionReport: distributionReport[0],
          details: groupedDetails,
          documents: documents
        }
      })
    } catch (error) {
      console.error('Error fetching distribution report details:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch distribution report details' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})