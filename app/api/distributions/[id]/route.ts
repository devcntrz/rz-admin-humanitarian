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
      const id = parseInt(resolvedParams.id)
      
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }
      
      // Get all distribution data in one optimized query
      const result = await sql`
        SELECT 
          dr.id,
          dr.spk_number,
          dr.event_name,
          to_char(dr.event_date, 'YYYY-MM-DD') as event_date,
          to_char(dr.event_date, 'YYYY-MM-DD') as distribution_date,
          'completed' as status,
          dr.event_name as recipient_name,
          '' as recipient_phone,
          'Bantuan' as items,
          COALESCE(dr.beneficiary_count, 1) as quantity,
          dr.beneficiary_count,
          dr.volunteer_count,
          dr.full_address,
          dr.latitude,
          dr.longitude,
          dr.disaster_type_id,
          dr.pic_volunteer_id,
          dr.pic_volunteer_id as volunteer_id,
          dr.village_id,
          dr.district_id,
          dr.regency_id,
          dr.province_id,
          COALESCE(v.full_name, '') as volunteer_name,
          COALESCE(v.full_name, '') as volunteer,
          COALESCE(v.email, '') as volunteer_email,
          '' as volunteer_phone,
          COALESCE(vill.name, '') as village_name,
          COALESCE(dist.name, '') as district_name,
          COALESCE(reg.name, '') as regency_name,
          COALESCE(prov.name, '') as province_name
        FROM distribution_reports dr
        LEFT JOIN volunteers v ON v.id = dr.pic_volunteer_id
        LEFT JOIN villages vill ON vill.id = dr.village_id
        LEFT JOIN districts dist ON dist.id = vill.district_id
        LEFT JOIN regencies reg ON reg.id = dist.regency_id
        LEFT JOIN provinces prov ON prov.id = reg.province_id
        WHERE dr.id = ${id}
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Distribution not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0]
      })
    } catch (error) {
      console.error('Error fetching distribution:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch distribution' },
        { status: 500 }
      )
    }
  })(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)
      const body = await req.json()
      
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }
      
      const { 
        spk_number,
        event_name,
        event_date,
        disaster_type_id,
        volunteer_id,
        pic_volunteer_id,
        full_address,
        latitude,
        longitude,
        beneficiary_count,
        volunteer_count,
        province_id,
        regency_id,
        district_id,
        village_id
      } = body
      
      // Gunakan volunteer_id atau pic_volunteer_id (prioritas pada pic_volunteer_id)
      const finalVolunteerId = pic_volunteer_id || volunteer_id
      
      console.log('API received volunteer data:', { volunteer_id, pic_volunteer_id, finalVolunteerId })
      
      // Validasi field wajib berdasarkan struktur database
      if (!event_name || event_name.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Event name is required' },
          { status: 400 }
        )
      }
      
      if (!event_date) {
        return NextResponse.json(
          { success: false, error: 'Event date is required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE distribution_reports 
        SET 
          spk_number = ${spk_number || null},
          event_name = ${event_name},
          event_date = ${event_date},
          disaster_type_id = ${disaster_type_id ? parseInt(disaster_type_id) : null},
          pic_volunteer_id = ${finalVolunteerId ? parseInt(finalVolunteerId) : null},
          full_address = ${full_address || null},
          latitude = ${latitude ? parseFloat(latitude) : null},
          longitude = ${longitude ? parseFloat(longitude) : null},
          beneficiary_count = ${beneficiary_count ? parseInt(beneficiary_count) : null},
          volunteer_count = ${volunteer_count ? parseInt(volunteer_count) : null},
          province_id = ${province_id || null},
          regency_id = ${regency_id || null},
          district_id = ${district_id || null},
          village_id = ${village_id || null}
        WHERE id = ${id}
        RETURNING id, spk_number, event_name, event_date, disaster_type_id,
                  pic_volunteer_id, full_address, latitude, longitude,
                  beneficiary_count, volunteer_count, province_id, regency_id,
                  district_id, village_id, created_at
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Distribution not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Distribution updated successfully'
      })
    } catch (error) {
      console.error('Error updating distribution:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update distribution' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)
      
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM distribution_reports 
        WHERE id = ${id}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Distribution not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Distribution deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting distribution:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete distribution' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})