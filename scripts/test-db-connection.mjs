// One-off connectivity check for the Neon database, using Neon's HTTP
// driver (works over plain HTTPS — no raw TCP needed, which matters in
// sandboxed environments that only allow HTTPS egress).
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const rows = await sql`select version()`
console.log(rows[0].version)
