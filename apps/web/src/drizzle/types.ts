import { db } from "./db"
export type Trx = Parameters<Parameters<typeof db.transaction>[0]>[0]
