import prisma from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        // Check if data exists - let's find user 'admin' specifically
        const adminUser = await prisma.user.findUnique({
            where: { username: 'admin' }
        })

        if (adminUser) {
            // Update passwords to be hashed if we are re-seeding or just ensure they are hashed
            const hashedAdmin = await bcrypt.hash('adminpassword', 10)
            const hashedReception = await bcrypt.hash('password123', 10)

            await prisma.user.update({
                where: { username: 'admin' },
                data: { password: hashedAdmin }
            })
            await prisma.user.update({
                where: { username: 'recepcja' },
                data: { password: hashedReception }
            })

            return NextResponse.json({ message: 'Users updated with hashed passwords' })
        }

        const hashedPassword = await bcrypt.hash('password123', 10)
        const hashedAdminPassword = await bcrypt.hash('adminpassword', 10)

        // Create Membership Types
        await prisma.membershipType.createMany({
            data: [
                { name: 'Karnet Open (30 dni)', scope: 'GYM', type: 'TIME', daysValid: 30, price: 159.00 },
                { name: 'Karnet Open (90 dni)', scope: 'GYM', type: 'TIME', daysValid: 90, price: 399.00 },
                { name: 'Karnet 10 Wejść', scope: 'GYM', type: 'ENTRY', entries: 10, price: 180.00 },
                { name: 'Karnet Zajęcia (30 dni)', scope: 'CLASSES', type: 'TIME', daysValid: 30, price: 199.00 },
            ]
        })

        // Create Products
        await prisma.product.createMany({
            data: [
                { name: 'Woda 0.5l', category: 'DRINKS', price: 5.00, stock: 100 },
                { name: 'Izotonik', category: 'DRINKS', price: 8.00, stock: 50 },
                { name: 'Białko (porcja)', category: 'SUPPLEMENTS', price: 12.00, stock: 200 },
                { name: 'Baton Proteinowy', category: 'SUPPLEMENTS', price: 10.00, stock: 40 },
                { name: 'Ręcznik (wypożyczenie)', category: 'OTHER', price: 15.00, stock: 0 },
            ]
        })

        // Create Reception User
        await prisma.user.create({
            data: {
                username: 'recepcja',
                password: hashedPassword,
                role: 'RECEPTION'
            }
        })

        // Create Admin User
        await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedAdminPassword,
                role: 'ADMIN'
            }
        })

        return NextResponse.json({ message: 'Database seeded successfully with hashed passwords' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Seeding failed' }, { status: 500 })
    }
}
