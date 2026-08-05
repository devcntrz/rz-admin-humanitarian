import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    
    try {
      let distributions
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        distributions = await sql`
          SELECT * FROM (
            SELECT dr.id,
              to_char(dr.event_date, 'YYYY-MM-DD') as distribution_date,
              'completed' as status,
              dr.event_name as recipient_name,
              '' as recipient_phone,
              'Bantuan' as items,
              COALESCE(dr.beneficiary_count, 1) as quantity,
              dr.full_address as notes,
              dr.pic_volunteer_id as volunteer_id,
              v.full_name as volunteer,
              vill.name as village,
              dist.name as district,
              reg.name as regency,
              prov.name as province
            FROM distribution_reports dr
            LEFT JOIN volunteers v ON v.id = dr.pic_volunteer_id
            LEFT JOIN villages vill ON vill.id = dr.village_id
            LEFT JOIN districts dist ON dist.id = vill.district_id
            LEFT JOIN regencies reg ON reg.id = dist.regency_id
            LEFT JOIN provinces prov ON prov.id = reg.province_id
          ) sub
          WHERE COALESCE(recipient_name,'') ILIKE ${like}
            OR COALESCE(recipient_phone,'') ILIKE ${like}
            OR COALESCE(items,'') ILIKE ${like}
            OR COALESCE(volunteer,'') ILIKE ${like}
            OR COALESCE(village,'') ILIKE ${like}
            OR COALESCE(district,'') ILIKE ${like}
            OR COALESCE(regency,'') ILIKE ${like}
            OR COALESCE(province,'') ILIKE ${like}
            OR CAST(id AS TEXT) ILIKE ${like}
          ORDER BY id DESC
          LIMIT 2000
        `
      } else {
        distributions = await sql`
          SELECT dr.id,
            to_char(dr.event_date, 'YYYY-MM-DD') as distribution_date,
            'completed' as status,
            dr.event_name as recipient_name,
            '' as recipient_phone,
            'Bantuan' as items,
            COALESCE(dr.beneficiary_count, 1) as quantity,
            dr.full_address as notes,
            dr.pic_volunteer_id as volunteer_id,
            v.full_name as volunteer,
            vill.name as village,
            dist.name as district,
            reg.name as regency,
            prov.name as province
          FROM distribution_reports dr
          LEFT JOIN volunteers v ON v.id = dr.pic_volunteer_id
          LEFT JOIN villages vill ON vill.id = dr.village_id
          LEFT JOIN districts dist ON dist.id = vill.district_id
          LEFT JOIN regencies reg ON reg.id = dist.regency_id
          LEFT JOIN provinces prov ON prov.id = reg.province_id
          ORDER BY dr.id DESC
          LIMIT 2000
        `
      }
      
      return NextResponse.json({
        success: true,
        data: distributions,
        total: distributions.length
      })
    } catch (error) {
      console.error('Error fetching distributions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch distributions' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      // Support new distribution_reports schema; fallback to old fields
      const {
        spk_number,
        event_name,
        event_date,
        disaster_type_id,
        pic_volunteer_id,
        full_address,
        latitude,
        longitude,
        beneficiary_count,
        volunteer_count,
        province_id,
        regency_id,
        district_id,
        village_id,
      } = body
      const volunteer_id = body.volunteer_id ?? pic_volunteer_id
      
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
      
      // Insert to distribution_reports as the canonical table
      const result = await sql`
        INSERT INTO distribution_reports (
          spk_number,
          event_name,
          event_date,
          disaster_type_id,
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
        ) VALUES (
          ${spk_number || null},
          ${event_name},
          ${event_date},
          ${disaster_type_id ? parseInt(disaster_type_id) : null},
          ${volunteer_id ? parseInt(volunteer_id) : null},
          ${full_address || null},
          ${latitude ? parseFloat(latitude) : null},
          ${longitude ? parseFloat(longitude) : null},
          ${beneficiary_count ? parseInt(beneficiary_count) : null},
          ${volunteer_count ? parseInt(volunteer_count) : null},
          ${province_id || null},
          ${regency_id || null},
          ${district_id || null},
          ${village_id || null}
        )
        RETURNING id
      `
      
      return NextResponse.json({ success: true, data: { id: result[0].id }, message: 'Distribution report created successfully' }, { status: 201 })
    } catch (error) {
      console.error('Error creating distribution:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create distribution' },
        { status: 500 }
      )
    }
  })(request)
}

export async function PUT(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id } = body
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      
      // Validasi field wajib berdasarkan struktur database
      if (!body.event_name || body.event_name.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Event name is required' },
          { status: 400 }
        )
      }
      
      if (!body.event_date) {
        return NextResponse.json(
          { success: false, error: 'Event date is required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE distribution_reports SET
          spk_number = ${body.spk_number || null},
          event_name = ${body.event_name},
          event_date = ${body.event_date},
          disaster_type_id = ${body.disaster_type_id ? parseInt(body.disaster_type_id) : null},
          pic_volunteer_id = ${(body.pic_volunteer_id ?? body.volunteer_id) ? parseInt(body.pic_volunteer_id ?? body.volunteer_id) : null},
          full_address = ${body.full_address || null},
          latitude = ${body.latitude ? parseFloat(body.latitude) : null},
          longitude = ${body.longitude ? parseFloat(body.longitude) : null},
          beneficiary_count = ${body.beneficiary_count ? parseInt(body.beneficiary_count) : null},
          volunteer_count = ${body.volunteer_count ? parseInt(body.volunteer_count) : null},
          province_id = ${body.province_id || null},
          regency_id = ${body.regency_id || null},
          district_id = ${body.district_id || null},
          village_id = ${body.village_id || null}
        WHERE id = ${id}
        RETURNING id
      `
      if (result.length === 0) return NextResponse.json({ success: false, error: 'Distribution report not found' }, { status: 404 })
      return NextResponse.json({ success: true, message: 'Distribution report updated successfully' })
    } catch (error) {
      console.error('Error updating distribution report:', error)
      return NextResponse.json({ success: false, error: 'Failed to update distribution report' }, { status: 500 })
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})