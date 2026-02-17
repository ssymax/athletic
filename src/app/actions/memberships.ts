'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function sellMembership(memberId: string, formData: FormData) {
    const typeId = formData.get('typeId') as string
    const startDateStr = formData.get('startDate') as string
    const paymentMethod = formData.get('paymentMethod') as string

    if (!typeId || !startDateStr || !paymentMethod) {
        throw new Error('Missing required fields')
    }

    const membershipType = await prisma.membershipType.findUnique({
        where: { id: typeId }
    })

    if (!membershipType) throw new Error('Invalid membership type')

    const startDate = new Date(startDateStr)
    let endDate: Date | null = null
    let remainingEntries: number | null = null

    if (membershipType.type === 'TIME' && membershipType.daysValid) {
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + membershipType.daysValid)
    } else if (membershipType.type === 'ENTRY' && membershipType.entries) {
        remainingEntries = membershipType.entries
    }

    await prisma.membership.create({
        data: {
            memberId,
            typeId,
            startDate,
            endDate,
            remainingEntries,
            status: 'ACTIVE',
            paymentMethod,
            pricePaid: membershipType.price,
            history: {
                create: {
                    action: 'PURCHASE',
                    details: `Karnet: ${membershipType.name} - ${membershipType.price} PLN`
                }
            }
        }
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true }
}
